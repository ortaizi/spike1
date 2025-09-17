import Queue from 'bull';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logging';
import { QueueJobOptions, SyncJob, SyncJobData, SyncJobStatus, WorkerMetrics } from '../types';
import { JobManager } from './job-manager';

export class QueueManager {
  private static instance: QueueManager;
  private redis: Redis;
  private syncQueue: Queue.Queue<SyncJobData>;
  private jobManager: JobManager;
  private workerMetrics: WorkerMetrics;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.syncQueue = new Queue('sync-jobs', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });

    this.jobManager = JobManager.getInstance();
    this.workerMetrics = {
      workerId: process.env.WORKER_ID || uuidv4(),
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageJobDuration: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastHeartbeat: new Date(),
    };

    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  async initialize(): Promise<void> {
    await this.redis.ping();
    logger.info('Queue manager initialized', {
      redisHost: process.env.REDIS_HOST || 'localhost',
      redisPort: process.env.REDIS_PORT || '6379',
      workerId: this.workerMetrics.workerId,
    });

    // Clean up old jobs on startup
    await this.cleanupStaleJobs();
  }

  async enqueueJob(job: SyncJob, correlationId: string): Promise<void> {
    const jobData: SyncJobData = {
      jobId: job.id,
      userId: job.userId,
      tenantId: job.tenantId,
      type: job.type,
      config: job.config,
      correlationId,
    };

    const options: QueueJobOptions = {
      priority: job.priority,
      delay: Math.max(0, job.scheduledAt.getTime() - Date.now()),
      attempts: job.maxRetries + 1, // +1 for initial attempt
      backoff: {
        type: 'exponential',
        delay: 60000, // Start with 1 minute
      },
      removeOnComplete: 10,
      removeOnFail: 20,
    };

    await this.syncQueue.add(jobData, options);

    // Update job status to queued
    await this.jobManager.updateJobStatus(job.id, SyncJobStatus.QUEUED);

    logger.info('Job enqueued', {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
      scheduledAt: job.scheduledAt.toISOString(),
      correlationId,
    });
  }

  async pauseQueue(): Promise<void> {
    await this.syncQueue.pause();
    logger.info('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.syncQueue.resume();
    logger.info('Queue resumed');
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.syncQueue.getWaiting(),
      this.syncQueue.getActive(),
      this.syncQueue.getCompleted(),
      this.syncQueue.getFailed(),
      this.syncQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async getWorkerMetrics(): Promise<WorkerMetrics> {
    return { ...this.workerMetrics };
  }

  async cancelQueueJob(jobId: string): Promise<boolean> {
    try {
      const jobs = await this.syncQueue.getJobs(['waiting', 'delayed'], 0, -1);
      const job = jobs.find((j) => j.data.jobId === jobId);

      if (job) {
        await job.remove();
        logger.info('Queue job cancelled', { jobId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to cancel queue job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down queue manager...');

    await this.syncQueue.close();
    await this.redis.disconnect();

    logger.info('Queue manager shut down');
  }

  private setupEventHandlers(): void {
    this.syncQueue.on('completed', (job: Queue.Job<SyncJobData>, result: any) => {
      this.workerMetrics.completedJobs++;
      this.updateAverageJobDuration(job);

      logger.info('Queue job completed', {
        jobId: job.data.jobId,
        type: job.data.type,
        duration: Date.now() - job.processedOn!,
        result: result?.success ? 'success' : 'failed',
      });
    });

    this.syncQueue.on('failed', (job: Queue.Job<SyncJobData>, error: Error) => {
      this.workerMetrics.failedJobs++;

      logger.error('Queue job failed', {
        jobId: job.data.jobId,
        type: job.data.type,
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });
    });

    this.syncQueue.on('active', (job: Queue.Job<SyncJobData>) => {
      this.workerMetrics.activeJobs++;

      logger.info('Queue job started', {
        jobId: job.data.jobId,
        type: job.data.type,
        workerId: this.workerMetrics.workerId,
      });
    });

    this.syncQueue.on('stalled', (job: Queue.Job<SyncJobData>) => {
      logger.warn('Queue job stalled', {
        jobId: job.data.jobId,
        type: job.data.type,
        processedOn: job.processedOn,
      });
    });

    this.syncQueue.on('error', (error: Error) => {
      logger.error('Queue error', {
        error: error.message,
        stack: error.stack,
      });
    });
  }

  private async cleanupStaleJobs(): Promise<void> {
    try {
      // Find jobs that have been running for too long (> 1 hour)
      const staleJobsThreshold = Date.now() - 60 * 60 * 1000;
      const activeJobs = await this.syncQueue.getActive();

      for (const job of activeJobs) {
        if (job.processedOn && job.processedOn < staleJobsThreshold) {
          await job.moveToFailed(new Error('Job exceeded maximum runtime'), true);
          await this.jobManager.updateJobStatus(
            job.data.jobId,
            SyncJobStatus.FAILED,
            undefined,
            'Job exceeded maximum runtime and was terminated'
          );

          logger.warn('Cleaned up stale job', {
            jobId: job.data.jobId,
            processedOn: new Date(job.processedOn).toISOString(),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup stale jobs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private updateAverageJobDuration(job: Queue.Job<SyncJobData>): void {
    if (job.processedOn && job.finishedOn) {
      const duration = job.finishedOn - job.processedOn;
      const totalJobs = this.workerMetrics.completedJobs + this.workerMetrics.failedJobs;

      this.workerMetrics.averageJobDuration =
        (this.workerMetrics.averageJobDuration * (totalJobs - 1) + duration) / totalJobs;
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateSystemMetrics();
      this.publishWorkerHeartbeat();
    }, 30000); // Every 30 seconds
  }

  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.workerMetrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    this.workerMetrics.lastHeartbeat = new Date();

    // Update active jobs count
    this.syncQueue
      .getActive()
      .then((activeJobs) => {
        this.workerMetrics.activeJobs = activeJobs.length;
      })
      .catch((error) => {
        logger.error('Failed to update active jobs count', { error: error.message });
      });
  }

  private async publishWorkerHeartbeat(): Promise<void> {
    try {
      await this.redis.setex(
        `worker:heartbeat:${this.workerMetrics.workerId}`,
        120, // 2 minutes TTL
        JSON.stringify(this.workerMetrics)
      );
    } catch (error) {
      logger.error('Failed to publish worker heartbeat', {
        workerId: this.workerMetrics.workerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
