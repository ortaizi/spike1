import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseConnection {
  private pool: Pool | null = null;
  private static instance: DatabaseConnection;

  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    DatabaseConnection.instance = this;
  }

  async connect(): Promise<void> {
    if (this.pool) {
      logger.warn('Database connection already exists');
      return;
    }

    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'spike_auth',
      user: process.env.DB_USER || 'spike_user',
      password: process.env.DB_PASSWORD || 'spike_password123',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(config);

    // Test the connection
    try {
      const client = await this.pool.connect();
      logger.info('Database connection established successfully');

      // Verify auth schema exists
      const result = await client.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'"
      );

      if (result.rows.length === 0) {
        logger.warn('Auth schema not found. Please run migrations.');
      }

      client.release();
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }

    // Handle pool events
    this.pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });

    this.pool.on('connect', (client) => {
      logger.debug('New client connected to database');
    });

    this.pool.on('remove', (client) => {
      logger.debug('Client removed from database pool');
    });
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection closed');
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      const client = await this.pool.connect();

      // Set default timezone and application name
      await client.query("SET timezone = 'UTC'");
      await client.query("SET application_name = 'spike-auth-service'");

      return client;
    } catch (error) {
      logger.error('Failed to get database client:', error);
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.getClient();

    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount,
      });

      return result.rows;
    } catch (error) {
      logger.error('Database query error:', {
        query: text,
        params,
        error: error.message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      const client = await this.getClient();
      await client.query('SELECT 1');
      client.release();

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message,
      };
    }
  }

  // Cleanup expired sessions periodically
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.query<{ cleanup_expired_sessions: number }>(
        'SELECT auth.cleanup_expired_sessions() as cleanup_expired_sessions'
      );

      const deletedCount = result[0]?.cleanup_expired_sessions || 0;

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} expired sessions`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      throw error;
    }
  }
}
