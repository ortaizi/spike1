import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { logger } from '../logging/logger';

export interface SessionData {
  sessionId: string;
  userId: string;
  tenantId: string;
  email: string;
  name?: string;
  role: string;
  permissions: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionToken {
  sessionId: string;
  userId: string;
  tenantId: string;
  iat: number;
  exp: number;
}

export interface CreateSessionRequest {
  userId: string;
  tenantId: string;
  email: string;
  name?: string;
  role: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  ttl?: number; // Custom TTL in seconds
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  error?: string;
  requiresRefresh?: boolean;
}

export class DistributedSessionManager {
  private static instance: DistributedSessionManager;
  private redis: Redis;
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly TENANT_SESSIONS_PREFIX = 'tenant_sessions:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly REFRESH_THRESHOLD = 24 * 60 * 60; // Refresh if expires within 24 hours
  private readonly jwtSecret: string;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_SESSION_DB || '1'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

    this.setupEventHandlers();
  }

  static getInstance(): DistributedSessionManager {
    if (!DistributedSessionManager.instance) {
      DistributedSessionManager.instance = new DistributedSessionManager();
    }
    return DistributedSessionManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      await this.redis.ping();
      logger.info('Distributed session manager initialized');

      // Set up session cleanup job
      this.scheduleCleanup();
    } catch (error) {
      logger.error('Failed to initialize distributed session manager:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createSession(request: CreateSessionRequest): Promise<{
    sessionId: string;
    token: string;
    expiresAt: Date;
  }> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const ttl = request.ttl || this.DEFAULT_TTL;
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const sessionData: SessionData = {
      sessionId,
      userId: request.userId,
      tenantId: request.tenantId,
      email: request.email,
      name: request.name,
      role: request.role,
      permissions: request.permissions || [],
      metadata: request.metadata || {},
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent
    };

    // Generate JWT token
    const token = jwt.sign(
      {
        sessionId,
        userId: request.userId,
        tenantId: request.tenantId
      } as SessionToken,
      this.jwtSecret,
      { expiresIn: ttl }
    );

    try {
      // Use Redis transaction for atomic operations
      const multi = this.redis.multi();

      // Store session data with tenant isolation
      const sessionKey = this.getSessionKey(request.tenantId, sessionId);
      multi.setex(sessionKey, ttl, JSON.stringify(sessionData));

      // Track user sessions for management
      const userSessionsKey = this.getUserSessionsKey(request.tenantId, request.userId);
      multi.sadd(userSessionsKey, sessionId);
      multi.expire(userSessionsKey, ttl);

      // Track tenant sessions for cleanup
      const tenantSessionsKey = this.getTenantSessionsKey(request.tenantId);
      multi.sadd(tenantSessionsKey, sessionId);
      multi.expire(tenantSessionsKey, ttl);

      // Store session metadata for quick lookups
      const metadataKey = `session_meta:${request.tenantId}:${sessionId}`;
      multi.setex(metadataKey, ttl, JSON.stringify({
        userId: request.userId,
        email: request.email,
        role: request.role,
        createdAt: now,
        ipAddress: request.ipAddress
      }));

      await multi.exec();

      logger.info('Session created', {
        sessionId,
        userId: request.userId,
        tenantId: request.tenantId,
        ttl,
        expiresAt: expiresAt.toISOString()
      });

      return {
        sessionId,
        token,
        expiresAt
      };
    } catch (error) {
      logger.error('Failed to create session:', {
        userId: request.userId,
        tenantId: request.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async validateSession(token: string): Promise<SessionValidationResult> {
    try {
      // Decode and verify JWT
      const decoded = jwt.verify(token, this.jwtSecret) as SessionToken;
      const { sessionId, userId, tenantId } = decoded;

      // Get session data from Redis
      const sessionKey = this.getSessionKey(tenantId, sessionId);
      const sessionDataString = await this.redis.get(sessionKey);

      if (!sessionDataString) {
        return {
          valid: false,
          error: 'Session not found or expired'
        };
      }

      const sessionData: SessionData = JSON.parse(sessionDataString);

      // Check if session is expired (double check)
      if (sessionData.expiresAt && new Date() > new Date(sessionData.expiresAt)) {
        await this.deleteSession(tenantId, sessionId);
        return {
          valid: false,
          error: 'Session expired'
        };
      }

      // Update last accessed time
      sessionData.lastAccessedAt = new Date();
      await this.redis.setex(sessionKey, this.getRemainingTTL(sessionData.expiresAt), JSON.stringify(sessionData));

      // Check if session needs refresh
      const requiresRefresh = this.shouldRefreshSession(sessionData.expiresAt);

      logger.debug('Session validated', {
        sessionId,
        userId,
        tenantId,
        requiresRefresh
      });

      return {
        valid: true,
        session: sessionData,
        requiresRefresh
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expired'
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token'
        };
      }

      logger.error('Session validation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        valid: false,
        error: 'Session validation failed'
      };
    }
  }

  async refreshSession(tenantId: string, sessionId: string, newTtl?: number): Promise<{
    token: string;
    expiresAt: Date;
  }> {
    const sessionKey = this.getSessionKey(tenantId, sessionId);
    const sessionDataString = await this.redis.get(sessionKey);

    if (!sessionDataString) {
      throw new Error('Session not found');
    }

    const sessionData: SessionData = JSON.parse(sessionDataString);
    const ttl = newTtl || this.DEFAULT_TTL;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    // Update session data
    sessionData.expiresAt = expiresAt;
    sessionData.lastAccessedAt = now;

    // Generate new JWT token
    const token = jwt.sign(
      {
        sessionId,
        userId: sessionData.userId,
        tenantId
      } as SessionToken,
      this.jwtSecret,
      { expiresIn: ttl }
    );

    // Update Redis with new TTL
    await this.redis.setex(sessionKey, ttl, JSON.stringify(sessionData));

    logger.info('Session refreshed', {
      sessionId,
      userId: sessionData.userId,
      tenantId,
      newExpiresAt: expiresAt.toISOString()
    });

    return { token, expiresAt };
  }

  async deleteSession(tenantId: string, sessionId: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(tenantId, sessionId);

      // Get session data to clean up user tracking
      const sessionDataString = await this.redis.get(sessionKey);
      if (sessionDataString) {
        const sessionData: SessionData = JSON.parse(sessionDataString);

        // Clean up tracking sets
        const multi = this.redis.multi();
        multi.del(sessionKey);
        multi.srem(this.getUserSessionsKey(tenantId, sessionData.userId), sessionId);
        multi.srem(this.getTenantSessionsKey(tenantId), sessionId);
        multi.del(`session_meta:${tenantId}:${sessionId}`);

        await multi.exec();

        logger.info('Session deleted', {
          sessionId,
          userId: sessionData.userId,
          tenantId
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete session:', {
        tenantId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async deleteAllUserSessions(tenantId: string, userId: string): Promise<number> {
    try {
      const userSessionsKey = this.getUserSessionsKey(tenantId, userId);
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return 0;
      }

      const multi = this.redis.multi();

      for (const sessionId of sessionIds) {
        const sessionKey = this.getSessionKey(tenantId, sessionId);
        multi.del(sessionKey);
        multi.del(`session_meta:${tenantId}:${sessionId}`);
        multi.srem(this.getTenantSessionsKey(tenantId), sessionId);
      }

      multi.del(userSessionsKey);

      await multi.exec();

      logger.info('All user sessions deleted', {
        tenantId,
        userId,
        sessionCount: sessionIds.length
      });

      return sessionIds.length;
    } catch (error) {
      logger.error('Failed to delete all user sessions:', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getUserSessions(tenantId: string, userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(tenantId, userId);
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return [];
      }

      const sessionKeys = sessionIds.map(id => this.getSessionKey(tenantId, id));
      const sessions = await this.redis.mget(...sessionKeys);

      return sessions
        .filter((session): session is string => session !== null)
        .map(session => JSON.parse(session) as SessionData)
        .filter(session => session.expiresAt && new Date() <= new Date(session.expiresAt));
    } catch (error) {
      logger.error('Failed to get user sessions:', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getSessionStatistics(tenantId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    activeUsers: number;
    expiredSessions: number;
  }> {
    try {
      const tenantSessionsKey = this.getTenantSessionsKey(tenantId);
      const sessionIds = await this.redis.smembers(tenantSessionsKey);

      if (sessionIds.length === 0) {
        return {
          totalSessions: 0,
          activeSessions: 0,
          activeUsers: 0,
          expiredSessions: 0
        };
      }

      const sessionKeys = sessionIds.map(id => this.getSessionKey(tenantId, id));
      const sessions = await this.redis.mget(...sessionKeys);

      let activeSessions = 0;
      let expiredSessions = 0;
      const activeUserIds = new Set<string>();

      sessions.forEach(sessionString => {
        if (sessionString) {
          const session = JSON.parse(sessionString) as SessionData;
          if (session.expiresAt && new Date() <= new Date(session.expiresAt)) {
            activeSessions++;
            activeUserIds.add(session.userId);
          } else {
            expiredSessions++;
          }
        } else {
          expiredSessions++;
        }
      });

      return {
        totalSessions: sessionIds.length,
        activeSessions,
        activeUsers: activeUserIds.size,
        expiredSessions
      };
    } catch (error) {
      logger.error('Failed to get session statistics:', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down distributed session manager...');

    try {
      await this.redis.disconnect();
      logger.info('Distributed session manager shut down');
    } catch (error) {
      logger.error('Error during session manager shutdown:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Private helper methods

  private generateSessionId(): string {
    return createHash('sha256')
      .update(randomBytes(32))
      .update(Date.now().toString())
      .digest('hex');
  }

  private getSessionKey(tenantId: string, sessionId: string): string {
    return `${this.SESSION_PREFIX}${tenantId}:${sessionId}`;
  }

  private getUserSessionsKey(tenantId: string, userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}${tenantId}:${userId}`;
  }

  private getTenantSessionsKey(tenantId: string): string {
    return `${this.TENANT_SESSIONS_PREFIX}${tenantId}`;
  }

  private getRemainingTTL(expiresAt: Date): number {
    const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(remaining, 1); // Minimum 1 second
  }

  private shouldRefreshSession(expiresAt: Date): boolean {
    const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    return timeUntilExpiry <= this.REFRESH_THRESHOLD * 1000;
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Session manager connected to Redis');
    });

    this.redis.on('error', (error) => {
      logger.error('Session manager Redis error:', {
        error: error.message
      });
    });

    this.redis.on('close', () => {
      logger.warn('Session manager Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Session manager reconnecting to Redis...');
    });
  }

  private scheduleCleanup(): void {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        logger.error('Session cleanup failed:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 60 * 60 * 1000); // 1 hour

    logger.info('Session cleanup scheduled');
  }

  private async cleanupExpiredSessions(): Promise<void> {
    logger.debug('Running session cleanup...');

    try {
      // Get all tenant session keys
      const tenantKeys = await this.redis.keys(`${this.TENANT_SESSIONS_PREFIX}*`);
      let totalCleaned = 0;

      for (const tenantKey of tenantKeys) {
        const tenantId = tenantKey.replace(this.TENANT_SESSIONS_PREFIX, '');
        const sessionIds = await this.redis.smembers(tenantKey);

        for (const sessionId of sessionIds) {
          const sessionKey = this.getSessionKey(tenantId, sessionId);
          const exists = await this.redis.exists(sessionKey);

          if (!exists) {
            // Session expired, clean up tracking
            const multi = this.redis.multi();
            multi.srem(tenantKey, sessionId);
            multi.del(`session_meta:${tenantId}:${sessionId}`);

            // Find and clean from user sessions
            const userSessionKeys = await this.redis.keys(`${this.USER_SESSIONS_PREFIX}${tenantId}:*`);
            for (const userKey of userSessionKeys) {
              multi.srem(userKey, sessionId);
            }

            await multi.exec();
            totalCleaned++;
          }
        }
      }

      if (totalCleaned > 0) {
        logger.info('Session cleanup completed', {
          cleanedSessions: totalCleaned
        });
      }
    } catch (error) {
      logger.error('Session cleanup error:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}