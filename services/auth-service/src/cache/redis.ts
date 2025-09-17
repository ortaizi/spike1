import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisConnection {
  private client: Redis | null = null;
  private static instance: RedisConnection;

  constructor() {
    if (RedisConnection.instance) {
      return RedisConnection.instance;
    }
    RedisConnection.instance = this;
  }

  async connect(): Promise<void> {
    if (this.client) {
      logger.warn('Redis connection already exists');
      return;
    }

    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      lazyConnect: true,
    };

    this.client = new Redis(redisConfig);

    // Event handlers
    this.client.on('connect', () => {
      logger.info('Redis connection established');
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    try {
      await this.client.connect();
      logger.info('Connected to Redis successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis connection closed');
    }
  }

  // Session management methods
  async setSession(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async getSession(key: string): Promise<any | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async deleteSession(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    await this.client.del(key);
  }

  // Generic cache methods
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    await this.client.del(key);
  }

  async setex(key: string, ttlSeconds: number, value: any): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  // Rate limiting support
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const multi = this.client.multi();
    multi.incr(key);

    if (ttlSeconds) {
      multi.expire(key, ttlSeconds);
    }

    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  }

  // Multi-tenant session patterns
  async getTenantSessions(tenantId: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    return await this.client.keys(`session:${tenantId}:*`);
  }

  async getUserSessions(tenantId: string, userId: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const keys = await this.client.keys(`session:${tenantId}:${userId}:*`);
    if (keys.length === 0) return [];

    const values = await this.client.mget(...keys);
    return values.filter((value) => value !== null).map((value) => JSON.parse(value as string));
  }

  async revokeTenantSessions(tenantId: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const keys = await this.client.keys(`session:${tenantId}:*`);
    if (keys.length === 0) return 0;

    return await this.client.del(...keys);
  }

  async revokeUserSessions(tenantId: string, userId: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const keys = await this.client.keys(`session:${tenantId}:${userId}:*`);
    if (keys.length === 0) return 0;

    return await this.client.del(...keys);
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      if (!this.client) {
        return { status: 'unhealthy', details: 'Redis client not initialized' };
      }

      const pong = await this.client.ping();
      if (pong === 'PONG') {
        return { status: 'healthy' };
      } else {
        return { status: 'unhealthy', details: `Unexpected ping response: ${pong}` };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message,
      };
    }
  }

  // Statistics
  async getStats(): Promise<any> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const info = await this.client.info();
    const memory = await this.client.memory('usage');

    return {
      info: info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
      memoryUsage: memory,
    };
  }
}
