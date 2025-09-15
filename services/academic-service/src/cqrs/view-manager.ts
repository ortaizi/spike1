import { DatabaseManager } from '../config/database';
import { logger } from '../config/logging';
import {
  DASHBOARD_QUERY_VIEW,
  COURSE_QUERY_VIEW,
  STUDENT_PROGRESS_VIEW,
  REFRESH_QUERIES,
  UPDATE_TRIGGERS
} from './query-models';
import cron from 'node-cron';

export class ViewManager {
  private static instance: ViewManager;
  private dbManager: DatabaseManager;
  private refreshTasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  static getInstance(): ViewManager {
    if (!ViewManager.instance) {
      ViewManager.instance = new ViewManager();
    }
    return ViewManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    logger.info('Initializing view manager...');

    // Set up automatic refresh scheduling
    this.scheduleRefreshTasks();

    this.isInitialized = true;
    logger.info('View manager initialized');
  }

  async createViewsForTenant(tenantId: string): Promise<void> {
    logger.info(`Creating materialized views for tenant: ${tenantId}`);

    const client = await this.dbManager.getConnection(tenantId);

    try {
      await client.query('BEGIN');

      // Create dashboard summary view
      const dashboardView = DASHBOARD_QUERY_VIEW
        .replace(/\{tenant_id\}/g, tenantId)
        .replace('$1', `'${this.getCurrentSemester()}'`);

      await client.query(dashboardView);

      // Create course summary view
      const courseView = COURSE_QUERY_VIEW.replace(/\{tenant_id\}/g, tenantId);
      await client.query(courseView);

      // Create student progress view
      const studentProgressView = STUDENT_PROGRESS_VIEW.replace(/\{tenant_id\}/g, tenantId);
      await client.query(studentProgressView);

      // Create snapshots table for event sourcing
      await client.query(`
        CREATE TABLE IF NOT EXISTS academic_${tenantId}.snapshots (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          aggregate_id UUID NOT NULL,
          aggregate_type VARCHAR(50) NOT NULL,
          data JSONB NOT NULL,
          version INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          tenant_id VARCHAR(50) NOT NULL DEFAULT '${tenantId}',

          UNIQUE(aggregate_id)
        );

        CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate_id_${tenantId}
          ON academic_${tenantId}.snapshots(aggregate_id);
        CREATE INDEX IF NOT EXISTS idx_snapshots_type_${tenantId}
          ON academic_${tenantId}.snapshots(aggregate_type);
      `);

      // Create indexes on materialized views for better performance
      await this.createViewIndexes(client, tenantId);

      // Set up triggers for automatic refresh
      const triggers = UPDATE_TRIGGERS.replace(/\{tenant_id\}/g, tenantId);
      await client.query(triggers);

      await client.query('COMMIT');

      logger.info(`Materialized views created successfully for tenant: ${tenantId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to create views for tenant ${tenantId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async refreshViewsForTenant(tenantId: string, viewNames?: string[]): Promise<void> {
    const viewsToRefresh = viewNames || ['dashboard', 'courses', 'studentProgress'];

    logger.info(`Refreshing materialized views for tenant: ${tenantId}`, {
      views: viewsToRefresh
    });

    const client = await this.dbManager.getConnection(tenantId);

    try {
      const refreshPromises = viewsToRefresh.map(async (viewName) => {
        const refreshQuery = REFRESH_QUERIES[viewName as keyof typeof REFRESH_QUERIES];
        if (refreshQuery) {
          try {
            await client.query(refreshQuery(tenantId));
            logger.debug(`Refreshed ${viewName} view for tenant ${tenantId}`);
          } catch (error) {
            logger.error(`Failed to refresh ${viewName} view for tenant ${tenantId}:`, {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      });

      await Promise.all(refreshPromises);

      logger.info(`Views refreshed successfully for tenant: ${tenantId}`);
    } catch (error) {
      logger.error(`Failed to refresh views for tenant ${tenantId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async refreshAllTenantViews(): Promise<void> {
    logger.info('Refreshing materialized views for all tenants...');

    try {
      // Get list of tenant schemas
      const tenants = await this.getTenantList();

      const refreshPromises = tenants.map(tenantId =>
        this.refreshViewsForTenant(tenantId).catch(error => {
          logger.error(`Failed to refresh views for tenant ${tenantId}:`, {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        })
      );

      await Promise.all(refreshPromises);

      logger.info(`Refreshed views for ${tenants.length} tenants`);
    } catch (error) {
      logger.error('Failed to refresh all tenant views:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getViewStatistics(tenantId: string): Promise<{
    dashboard: { rows: number; lastRefresh: Date };
    courses: { rows: number; lastRefresh: Date };
    studentProgress: { rows: number; lastRefresh: Date };
  }> {
    const client = await this.dbManager.getConnection(tenantId);

    try {
      const stats = await Promise.all([
        this.getViewStats(client, `academic_${tenantId}.dashboard_summary`),
        this.getViewStats(client, `academic_${tenantId}.course_summary`),
        this.getViewStats(client, `academic_${tenantId}.student_progress`)
      ]);

      return {
        dashboard: stats[0],
        courses: stats[1],
        studentProgress: stats[2]
      };
    } catch (error) {
      logger.error(`Failed to get view statistics for tenant ${tenantId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async dropViewsForTenant(tenantId: string): Promise<void> {
    logger.info(`Dropping materialized views for tenant: ${tenantId}`);

    const client = await this.dbManager.getConnection(tenantId);

    try {
      await client.query('BEGIN');

      // Drop triggers first
      await client.query(`DROP TRIGGER IF EXISTS refresh_on_grade_change_${tenantId} ON academic_${tenantId}.grades CASCADE`);
      await client.query(`DROP TRIGGER IF EXISTS refresh_on_enrollment_change_${tenantId} ON academic_${tenantId}.enrollments CASCADE`);
      await client.query(`DROP TRIGGER IF EXISTS refresh_on_assignment_change_${tenantId} ON academic_${tenantId}.assignments CASCADE`);

      // Drop function
      await client.query(`DROP FUNCTION IF EXISTS refresh_query_models_${tenantId}() CASCADE`);

      // Drop materialized views
      await client.query(`DROP MATERIALIZED VIEW IF EXISTS academic_${tenantId}.dashboard_summary CASCADE`);
      await client.query(`DROP MATERIALIZED VIEW IF EXISTS academic_${tenantId}.course_summary CASCADE`);
      await client.query(`DROP MATERIALIZED VIEW IF EXISTS academic_${tenantId}.student_progress CASCADE`);

      // Drop snapshots table
      await client.query(`DROP TABLE IF EXISTS academic_${tenantId}.snapshots CASCADE`);

      await client.query('COMMIT');

      logger.info(`Materialized views dropped successfully for tenant: ${tenantId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to drop views for tenant ${tenantId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  shutdown(): void {
    logger.info('Shutting down view manager...');

    // Stop all scheduled refresh tasks
    for (const [tenantId, task] of this.refreshTasks) {
      task.stop();
      logger.info(`Stopped refresh task for tenant: ${tenantId}`);
    }

    this.refreshTasks.clear();
    this.isInitialized = false;

    logger.info('View manager shut down');
  }

  private scheduleRefreshTasks(): void {
    // Schedule global refresh every hour
    const globalRefreshTask = cron.schedule('0 * * * *', async () => {
      try {
        await this.refreshAllTenantViews();
      } catch (error) {
        logger.error('Scheduled global refresh failed:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, {
      scheduled: false
    });

    globalRefreshTask.start();
    this.refreshTasks.set('global', globalRefreshTask);

    // Schedule frequent dashboard refresh (every 15 minutes)
    const dashboardRefreshTask = cron.schedule('*/15 * * * *', async () => {
      try {
        const tenants = await this.getTenantList();
        await Promise.all(
          tenants.map(tenantId =>
            this.refreshViewsForTenant(tenantId, ['dashboard']).catch(error => {
              logger.error(`Dashboard refresh failed for tenant ${tenantId}:`, {
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            })
          )
        );
      } catch (error) {
        logger.error('Scheduled dashboard refresh failed:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, {
      scheduled: false
    });

    dashboardRefreshTask.start();
    this.refreshTasks.set('dashboard', dashboardRefreshTask);

    logger.info('Scheduled view refresh tasks configured');
  }

  private async createViewIndexes(client: any, tenantId: string): Promise<void> {
    const indexes = [
      // Dashboard summary indexes
      `CREATE INDEX IF NOT EXISTS idx_dashboard_summary_user_${tenantId}
       ON academic_${tenantId}.dashboard_summary(user_id)`,

      // Course summary indexes
      `CREATE INDEX IF NOT EXISTS idx_course_summary_code_${tenantId}
       ON academic_${tenantId}.course_summary(code)`,
      `CREATE INDEX IF NOT EXISTS idx_course_summary_semester_${tenantId}
       ON academic_${tenantId}.course_summary(semester, academic_year)`,
      `CREATE INDEX IF NOT EXISTS idx_course_summary_instructor_${tenantId}
       ON academic_${tenantId}.course_summary(instructor)`,

      // Student progress indexes
      `CREATE INDEX IF NOT EXISTS idx_student_progress_user_${tenantId}
       ON academic_${tenantId}.student_progress(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_student_progress_course_${tenantId}
       ON academic_${tenantId}.student_progress(course_id)`,
      `CREATE INDEX IF NOT EXISTS idx_student_progress_grade_${tenantId}
       ON academic_${tenantId}.student_progress(current_grade)`
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        logger.warn(`Failed to create index for tenant ${tenantId}:`, {
          query: indexQuery,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async getTenantList(): Promise<string[]> {
    // This would typically query a tenant registry or discover schemas
    // For now, we'll use a simple approach
    const client = await this.dbManager.getConnection('default');

    try {
      const result = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'academic_%'
      `);

      return result.rows.map((row: any) =>
        row.schema_name.replace('academic_', '')
      );
    } catch (error) {
      logger.error('Failed to get tenant list:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    } finally {
      client.release();
    }
  }

  private async getViewStats(client: any, viewName: string): Promise<{ rows: number; lastRefresh: Date }> {
    try {
      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as rows FROM ${viewName}`);
      const rows = parseInt(countResult.rows[0].rows) || 0;

      // Get last refresh time (materialized views don't have this built-in, so we approximate)
      const statsResult = await client.query(`
        SELECT
          schemaname,
          matviewname,
          hasindexes,
          ispopulated
        FROM pg_matviews
        WHERE matviewname = $1
      `, [viewName.split('.')[1]]);

      const lastRefresh = new Date(); // Approximation - would need custom tracking for exact times

      return { rows, lastRefresh };
    } catch (error) {
      logger.error(`Failed to get stats for view ${viewName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { rows: 0, lastRefresh: new Date() };
    }
  }

  private getCurrentSemester(): string {
    const now = new Date();
    const month = now.getMonth();

    // Simple semester calculation (adjust based on your academic calendar)
    if (month >= 8 || month <= 0) {
      return 'fall';
    } else if (month >= 1 && month <= 5) {
      return 'spring';
    } else {
      return 'summer';
    }
  }
}