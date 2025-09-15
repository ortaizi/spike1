import { Pool, PoolClient } from 'pg';
import { logger } from './logging';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private pools: Map<string, Pool> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize default pool for shared operations
    const defaultPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'spike_academic',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pools.set('default', defaultPool);

    // Test connection
    try {
      const client = await defaultPool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }

    this.initialized = true;
  }

  async getConnection(tenantId: string): Promise<PoolClient> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if we have a pool for this tenant
    if (!this.pools.has(tenantId)) {
      await this.createTenantPool(tenantId);
    }

    const pool = this.pools.get(tenantId);
    if (!pool) {
      throw new Error(`No database pool found for tenant: ${tenantId}`);
    }

    return pool.connect();
  }

  private async createTenantPool(tenantId: string): Promise<void> {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: `spike_${tenantId}`,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    try {
      const client = await pool.connect();

      // Create schema if it doesn't exist
      await client.query(`CREATE SCHEMA IF NOT EXISTS academic_${tenantId}`);

      client.release();
      this.pools.set(tenantId, pool);

      logger.info(`Created database pool for tenant: ${tenantId}`);
    } catch (error) {
      logger.error(`Failed to create pool for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async executeQuery(
    tenantId: string,
    query: string,
    params: any[] = []
  ): Promise<any> {
    const client = await this.getConnection(tenantId);

    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  async withTransaction<T>(
    tenantId: string,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection(tenantId);

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

  async shutdown(): Promise<void> {
    logger.info('Shutting down database connections...');

    for (const [tenantId, pool] of this.pools) {
      await pool.end();
      logger.info(`Closed database pool for tenant: ${tenantId}`);
    }

    this.pools.clear();
    this.initialized = false;
  }
}