import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../config/database';
import { logger } from '../config/logging';
import {
  CreateSyncJobRequest,
  JobCompletedEvent,
  JobCreatedEvent,
  JobFailedEvent,
  JobPriority,
  JobStartedEvent,
  SyncJob,
  SyncJobResult,
  SyncJobStatus,
  SyncJobType,
} from '../types';
import { EventBus } from './event-bus';

export class JobManager {
  private static instance: JobManager;
  private dbManager: DatabaseManager;
  private eventBus: EventBus;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.eventBus = EventBus.getInstance();
  }

  static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }

  async createJob(
    userId: string,
    tenantId: string,
    request: CreateSyncJobRequest,
    correlationId: string
  ): Promise<SyncJob> {
    const job: SyncJob = {
      id: uuidv4(),
      userId,
      tenantId,
      type: request.type,
      status: SyncJobStatus.PENDING,
      priority: request.priority || JobPriority.NORMAL,
      config: request.config,
      metadata: request.metadata || {},
      scheduledAt: request.scheduledAt || new Date(),
      retryCount: 0,
      maxRetries: this.getMaxRetries(request.type),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store job in database
    const query = `
      INSERT INTO sync_jobs (
        id, user_id, tenant_id, type, status, priority, config,
        metadata, scheduled_at, retry_count, max_retries, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      job.id,
      job.userId,
      job.tenantId,
      job.type,
      job.status,
      job.priority,
      JSON.stringify(job.config),
      JSON.stringify(job.metadata),
      job.scheduledAt,
      job.retryCount,
      job.maxRetries,
      job.createdAt,
      job.updatedAt,
    ];

    await this.dbManager.executeQuery(tenantId, query, values);

    // Publish job created event
    const event: JobCreatedEvent = {
      type: 'sync.job.created',
      jobId: job.id,
      userId,
      tenantId,
      data: { job },
      timestamp: new Date(),
      correlationId,
    };

    await this.eventBus.publish('sync.job.created', event);

    logger.info('Sync job created', {
      jobId: job.id,
      type: job.type,
      tenantId,
      userId,
      correlationId,
    });

    return job;
  }

  async updateJobStatus(
    jobId: string,
    status: SyncJobStatus,
    result?: SyncJobResult,
    error?: string
  ): Promise<SyncJob> {
    const now = new Date();
    let updateFields = ['status = $1', 'updated_at = $2'];
    let values: any[] = [status, now];
    let valueIndex = 2;

    // Add status-specific fields
    switch (status) {
      case SyncJobStatus.RUNNING:
        updateFields.push(`started_at = $${++valueIndex}`);
        values.push(now);
        break;
      case SyncJobStatus.COMPLETED:
        updateFields.push(`completed_at = $${++valueIndex}`);
        values.push(now);
        if (result) {
          updateFields.push(`result = $${++valueIndex}`);
          values.push(JSON.stringify(result));
        }
        break;
      case SyncJobStatus.FAILED:
        updateFields.push(`failed_at = $${++valueIndex}`);
        values.push(now);
        if (error) {
          updateFields.push(`error = $${++valueIndex}`);
          values.push(error);
        }
        break;
      case SyncJobStatus.RETRYING:
        updateFields.push(`retry_count = retry_count + 1`);
        const nextRetry = new Date(Date.now() + this.calculateRetryDelay(jobId));
        updateFields.push(`next_retry_at = $${++valueIndex}`);
        values.push(nextRetry);
        break;
    }

    const query = `
      UPDATE sync_jobs
      SET ${updateFields.join(', ')}
      WHERE id = $${++valueIndex}
      RETURNING *
    `;
    values.push(jobId);

    const result_rows = await this.dbManager.executeQuery('default', query, values);
    const updatedJob = this.mapRowToJob(result_rows.rows[0]);

    // Publish appropriate event
    const correlationId = uuidv4();
    if (status === SyncJobStatus.RUNNING) {
      const event: JobStartedEvent = {
        type: 'sync.job.started',
        jobId,
        userId: updatedJob.userId,
        tenantId: updatedJob.tenantId,
        data: { job: updatedJob, workerId: process.env.WORKER_ID || 'unknown' },
        timestamp: now,
        correlationId,
      };
      await this.eventBus.publish('sync.job.started', event);
    } else if (status === SyncJobStatus.COMPLETED) {
      const event: JobCompletedEvent = {
        type: 'sync.job.completed',
        jobId,
        userId: updatedJob.userId,
        tenantId: updatedJob.tenantId,
        data: { job: updatedJob, result: result! },
        timestamp: now,
        correlationId,
      };
      await this.eventBus.publish('sync.job.completed', event);
    } else if (status === SyncJobStatus.FAILED) {
      const event: JobFailedEvent = {
        type: 'sync.job.failed',
        jobId,
        userId: updatedJob.userId,
        tenantId: updatedJob.tenantId,
        data: {
          job: updatedJob,
          error: error || 'Unknown error',
          retryScheduled: updatedJob.retryCount < updatedJob.maxRetries,
        },
        timestamp: now,
        correlationId,
      };
      await this.eventBus.publish('sync.job.failed', event);
    }

    return updatedJob;
  }

  async getJob(jobId: string): Promise<SyncJob | null> {
    const query = 'SELECT * FROM sync_jobs WHERE id = $1';
    const result = await this.dbManager.executeQuery('default', query, [jobId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToJob(result.rows[0]);
  }

  async getUserJobs(
    userId: string,
    tenantId: string,
    options: {
      status?: SyncJobStatus[];
      type?: SyncJobType[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ jobs: SyncJob[]; total: number }> {
    let whereClause = 'WHERE user_id = $1 AND tenant_id = $2';
    let values: any[] = [userId, tenantId];
    let valueIndex = 2;

    if (options.status && options.status.length > 0) {
      whereClause += ` AND status = ANY($${++valueIndex})`;
      values.push(options.status);
    }

    if (options.type && options.type.length > 0) {
      whereClause += ` AND type = ANY($${++valueIndex})`;
      values.push(options.type);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM sync_jobs ${whereClause}`;
    const countResult = await this.dbManager.executeQuery('default', countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get jobs with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const jobsQuery = `
      SELECT * FROM sync_jobs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++valueIndex} OFFSET $${++valueIndex}
    `;
    values.push(limit, offset);

    const jobsResult = await this.dbManager.executeQuery('default', jobsQuery, values);
    const jobs = jobsResult.rows.map((row: any) => this.mapRowToJob(row));

    return { jobs, total };
  }

  async getPendingJobs(limit: number = 100): Promise<SyncJob[]> {
    const query = `
      SELECT * FROM sync_jobs
      WHERE status IN ($1, $2) AND scheduled_at <= NOW()
      ORDER BY priority DESC, created_at ASC
      LIMIT $3
    `;

    const result = await this.dbManager.executeQuery('default', query, [
      SyncJobStatus.PENDING,
      SyncJobStatus.RETRYING,
      limit,
    ]);

    return result.rows.map((row: any) => this.mapRowToJob(row));
  }

  async getRunningJobs(): Promise<SyncJob[]> {
    const query = `
      SELECT * FROM sync_jobs
      WHERE status = $1
      ORDER BY started_at ASC
    `;

    const result = await this.dbManager.executeQuery('default', query, [SyncJobStatus.RUNNING]);
    return result.rows.map((row: any) => this.mapRowToJob(row));
  }

  async cancelJob(jobId: string, reason?: string): Promise<boolean> {
    const query = `
      UPDATE sync_jobs
      SET status = $1, updated_at = $2, error = $3
      WHERE id = $4 AND status IN ($5, $6, $7)
      RETURNING id
    `;

    const result = await this.dbManager.executeQuery('default', query, [
      SyncJobStatus.CANCELLED,
      new Date(),
      reason || 'Cancelled by user',
      jobId,
      SyncJobStatus.PENDING,
      SyncJobStatus.QUEUED,
      SyncJobStatus.RETRYING,
    ]);

    return result.rows.length > 0;
  }

  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const query = `
      DELETE FROM sync_jobs
      WHERE status IN ($1, $2, $3) AND updated_at < $4
    `;

    const result = await this.dbManager.executeQuery('default', query, [
      SyncJobStatus.COMPLETED,
      SyncJobStatus.FAILED,
      SyncJobStatus.CANCELLED,
      cutoffDate,
    ]);

    logger.info(`Cleaned up ${result.rowCount} old sync jobs`, {
      cutoffDate: cutoffDate.toISOString(),
      deletedCount: result.rowCount,
    });

    return result.rowCount || 0;
  }

  private mapRowToJob(row: any): SyncJob {
    return {
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      type: row.type,
      status: row.status,
      priority: row.priority,
      config: JSON.parse(row.config),
      metadata: JSON.parse(row.metadata),
      scheduledAt: row.scheduled_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      failedAt: row.failed_at,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      nextRetryAt: row.next_retry_at,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private getMaxRetries(jobType: SyncJobType): number {
    switch (jobType) {
      case SyncJobType.FULL_SYNC:
        return 3;
      case SyncJobType.INCREMENTAL_SYNC:
        return 5;
      case SyncJobType.BULK_USER_SYNC:
        return 2;
      default:
        return 3;
    }
  }

  private calculateRetryDelay(jobId: string): number {
    // Exponential backoff: 1min, 5min, 15min, 1hr
    const baseDelay = 60 * 1000; // 1 minute
    const maxDelay = 60 * 60 * 1000; // 1 hour

    // Use job ID to get consistent retry count
    // In practice, this would be fetched from the database
    const retryCount = Math.floor(Math.random() * 4); // Simplified for now

    const delay = Math.min(baseDelay * Math.pow(3, retryCount), maxDelay);
    return delay;
  }
}
