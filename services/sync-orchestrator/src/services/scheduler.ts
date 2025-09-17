import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../config/database';
import { logger } from '../config/logging';
import { JobPriority, ScheduleSyncJobRequest, SyncSchedule } from '../types';
import { JobManager } from './job-manager';
import { QueueManager } from './queue-manager';

export class SchedulerService {
  private static instance: SchedulerService;
  private dbManager: DatabaseManager;
  private jobManager: JobManager;
  private queueManager: QueueManager;
  private activeTasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.jobManager = JobManager.getInstance();
    this.queueManager = QueueManager.getInstance();
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing scheduler service...');

    // Load and start all active schedules
    await this.loadActiveSchedules();

    // Start cleanup job (runs every hour)
    this.startCleanupJob();

    // Start heartbeat monitoring (runs every 5 minutes)
    this.startHeartbeatMonitoring();

    this.isRunning = true;
    logger.info('Scheduler service initialized');
  }

  async createSchedule(
    userId: string,
    tenantId: string,
    request: ScheduleSyncJobRequest
  ): Promise<SyncSchedule> {
    // Validate cron expression
    if (!cron.validate(request.cronExpression)) {
      throw new Error(`Invalid cron expression: ${request.cronExpression}`);
    }

    const schedule: SyncSchedule = {
      id: uuidv4(),
      userId,
      tenantId,
      name: request.name,
      description: request.description,
      jobType: request.jobType,
      config: request.config,
      cronExpression: request.cronExpression,
      timezone: request.timezone || 'UTC',
      isActive: true,
      nextRunAt: this.calculateNextRun(request.cronExpression),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    const query = `
      INSERT INTO sync_schedules (
        id, user_id, tenant_id, name, description, job_type, config,
        cron_expression, timezone, is_active, next_run_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      schedule.id,
      schedule.userId,
      schedule.tenantId,
      schedule.name,
      schedule.description,
      schedule.jobType,
      JSON.stringify(schedule.config),
      schedule.cronExpression,
      schedule.timezone,
      schedule.isActive,
      schedule.nextRunAt,
      schedule.createdAt,
      schedule.updatedAt,
    ];

    await this.dbManager.executeQuery('default', query, values);

    // Start the scheduled task
    await this.startScheduledTask(schedule);

    logger.info('Sync schedule created', {
      scheduleId: schedule.id,
      name: schedule.name,
      cronExpression: schedule.cronExpression,
      tenantId,
      userId,
    });

    return schedule;
  }

  async updateSchedule(
    scheduleId: string,
    updates: Partial<
      Pick<
        SyncSchedule,
        'name' | 'description' | 'cronExpression' | 'timezone' | 'isActive' | 'config'
      >
    >
  ): Promise<SyncSchedule | null> {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) {
      return null;
    }

    // Validate new cron expression if provided
    if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
      throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let valueIndex = 0;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${++valueIndex}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${++valueIndex}`);
      values.push(updates.description);
    }

    if (updates.cronExpression !== undefined) {
      updateFields.push(`cron_expression = $${++valueIndex}`);
      values.push(updates.cronExpression);
      updateFields.push(`next_run_at = $${++valueIndex}`);
      values.push(this.calculateNextRun(updates.cronExpression));
    }

    if (updates.timezone !== undefined) {
      updateFields.push(`timezone = $${++valueIndex}`);
      values.push(updates.timezone);
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${++valueIndex}`);
      values.push(updates.isActive);
    }

    if (updates.config !== undefined) {
      updateFields.push(`config = $${++valueIndex}`);
      values.push(JSON.stringify(updates.config));
    }

    updateFields.push(`updated_at = $${++valueIndex}`);
    values.push(new Date());

    const query = `
      UPDATE sync_schedules
      SET ${updateFields.join(', ')}
      WHERE id = $${++valueIndex}
      RETURNING *
    `;
    values.push(scheduleId);

    const result = await this.dbManager.executeQuery('default', query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const updatedSchedule = this.mapRowToSchedule(result.rows[0]);

    // Restart the scheduled task with new configuration
    await this.stopScheduledTask(scheduleId);
    if (updatedSchedule.isActive) {
      await this.startScheduledTask(updatedSchedule);
    }

    logger.info('Sync schedule updated', {
      scheduleId,
      changes: Object.keys(updates),
      isActive: updatedSchedule.isActive,
    });

    return updatedSchedule;
  }

  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const query = 'DELETE FROM sync_schedules WHERE id = $1 RETURNING id';
    const result = await this.dbManager.executeQuery('default', query, [scheduleId]);

    if (result.rows.length > 0) {
      await this.stopScheduledTask(scheduleId);
      logger.info('Sync schedule deleted', { scheduleId });
      return true;
    }

    return false;
  }

  async getSchedule(scheduleId: string): Promise<SyncSchedule | null> {
    const query = 'SELECT * FROM sync_schedules WHERE id = $1';
    const result = await this.dbManager.executeQuery('default', query, [scheduleId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSchedule(result.rows[0]);
  }

  async getUserSchedules(
    userId: string,
    tenantId: string,
    options: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ schedules: SyncSchedule[]; total: number }> {
    let whereClause = 'WHERE user_id = $1 AND tenant_id = $2';
    let values: any[] = [userId, tenantId];
    let valueIndex = 2;

    if (options.isActive !== undefined) {
      whereClause += ` AND is_active = $${++valueIndex}`;
      values.push(options.isActive);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM sync_schedules ${whereClause}`;
    const countResult = await this.dbManager.executeQuery('default', countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get schedules with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const schedulesQuery = `
      SELECT * FROM sync_schedules
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++valueIndex} OFFSET $${++valueIndex}
    `;
    values.push(limit, offset);

    const schedulesResult = await this.dbManager.executeQuery('default', schedulesQuery, values);
    const schedules = schedulesResult.rows.map((row: any) => this.mapRowToSchedule(row));

    return { schedules, total };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down scheduler service...');

    this.isRunning = false;

    // Stop all active tasks
    for (const [scheduleId, task] of this.activeTasks) {
      task.stop();
      logger.info('Stopped scheduled task', { scheduleId });
    }

    this.activeTasks.clear();
    logger.info('Scheduler service shut down');
  }

  private async loadActiveSchedules(): Promise<void> {
    const query = 'SELECT * FROM sync_schedules WHERE is_active = true';
    const result = await this.dbManager.executeQuery('default', query);

    for (const row of result.rows) {
      const schedule = this.mapRowToSchedule(row);
      await this.startScheduledTask(schedule);
    }

    logger.info(`Loaded ${result.rows.length} active schedules`);
  }

  private async startScheduledTask(schedule: SyncSchedule): Promise<void> {
    try {
      const task = cron.schedule(
        schedule.cronExpression,
        async () => {
          await this.executeScheduledJob(schedule);
        },
        {
          scheduled: false,
          timezone: schedule.timezone,
        }
      );

      task.start();
      this.activeTasks.set(schedule.id, task);

      logger.info('Scheduled task started', {
        scheduleId: schedule.id,
        name: schedule.name,
        cronExpression: schedule.cronExpression,
        nextRun: schedule.nextRunAt?.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to start scheduled task', {
        scheduleId: schedule.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async stopScheduledTask(scheduleId: string): Promise<void> {
    const task = this.activeTasks.get(scheduleId);
    if (task) {
      task.stop();
      this.activeTasks.delete(scheduleId);
      logger.info('Scheduled task stopped', { scheduleId });
    }
  }

  private async executeScheduledJob(schedule: SyncSchedule): Promise<void> {
    const correlationId = uuidv4();

    logger.info('Executing scheduled job', {
      scheduleId: schedule.id,
      name: schedule.name,
      type: schedule.jobType,
      correlationId,
    });

    try {
      // Create and enqueue the job
      const job = await this.jobManager.createJob(
        schedule.userId,
        schedule.tenantId,
        {
          type: schedule.jobType,
          config: schedule.config,
          priority: JobPriority.NORMAL,
          metadata: {
            scheduledBy: schedule.id,
            scheduleName: schedule.name,
          },
        },
        correlationId
      );

      await this.queueManager.enqueueJob(job, correlationId);

      // Update last run time
      await this.updateScheduleLastRun(schedule.id);

      logger.info('Scheduled job created and enqueued', {
        scheduleId: schedule.id,
        jobId: job.id,
        correlationId,
      });
    } catch (error) {
      logger.error('Failed to execute scheduled job', {
        scheduleId: schedule.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
    }
  }

  private async updateScheduleLastRun(scheduleId: string): Promise<void> {
    const now = new Date();
    const query = `
      UPDATE sync_schedules
      SET last_run_at = $1, updated_at = $1
      WHERE id = $2
    `;

    await this.dbManager.executeQuery('default', query, [now, scheduleId]);
  }

  private calculateNextRun(cronExpression: string): Date {
    // This is a simplified calculation
    // In production, you'd want to use a proper cron parser
    return new Date(Date.now() + 60 * 60 * 1000); // Next hour
  }

  private startCleanupJob(): void {
    cron.schedule('0 * * * *', async () => {
      // Every hour
      if (this.isRunning) {
        await this.jobManager.cleanupOldJobs(7); // Keep jobs for 7 days
      }
    });

    logger.info('Cleanup job scheduled');
  }

  private startHeartbeatMonitoring(): void {
    cron.schedule('*/5 * * * *', async () => {
      // Every 5 minutes
      if (this.isRunning) {
        await this.monitorWorkerHeartbeats();
      }
    });

    logger.info('Heartbeat monitoring scheduled');
  }

  private async monitorWorkerHeartbeats(): Promise<void> {
    // Implementation for monitoring worker heartbeats
    // This would check Redis for worker heartbeat data
    logger.debug('Monitoring worker heartbeats...');
  }

  private mapRowToSchedule(row: any): SyncSchedule {
    return {
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      jobType: row.job_type,
      config: JSON.parse(row.config),
      cronExpression: row.cron_expression,
      timezone: row.timezone,
      isActive: row.is_active,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
