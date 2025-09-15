// Shared event bus configuration for all microservices

export interface EventBusConfig {
  rabbitmq: {
    url: string;
    exchanges: ExchangeConfig[];
    queues: QueueConfig[];
    deadLetterExchange: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  retries: {
    maxAttempts: number;
    backoffDelay: number;
    maxDelay: number;
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
  };
}

export interface ExchangeConfig {
  name: string;
  type: 'topic' | 'direct' | 'fanout';
  durable: boolean;
  autoDelete: boolean;
}

export interface QueueConfig {
  name: string;
  exchange: string;
  routingKey: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  arguments?: Record<string, any>;
}

// Event routing patterns for Spike platform
export const SPIKE_EVENT_PATTERNS = {
  // Academic service events
  COURSE_CREATED: 'academic.course.created',
  COURSE_UPDATED: 'academic.course.updated',
  COURSE_DELETED: 'academic.course.deleted',

  ASSIGNMENT_CREATED: 'academic.assignment.created',
  ASSIGNMENT_UPDATED: 'academic.assignment.updated',
  ASSIGNMENT_DELETED: 'academic.assignment.deleted',

  GRADE_CREATED: 'academic.grade.created',
  GRADE_UPDATED: 'academic.grade.updated',

  ENROLLMENT_CREATED: 'academic.enrollment.created',
  ENROLLMENT_UPDATED: 'academic.enrollment.updated',

  // Sync orchestrator events
  SYNC_JOB_CREATED: 'sync.job.created',
  SYNC_JOB_STARTED: 'sync.job.started',
  SYNC_JOB_PROGRESS: 'sync.job.progress',
  SYNC_JOB_COMPLETED: 'sync.job.completed',
  SYNC_JOB_FAILED: 'sync.job.failed',
  SYNC_JOB_CANCELLED: 'sync.job.cancelled',

  // Auth service events
  USER_AUTHENTICATED: 'auth.user.authenticated',
  USER_LOGGED_OUT: 'auth.user.logged_out',
  SESSION_CREATED: 'auth.session.created',
  SESSION_EXPIRED: 'auth.session.expired',
  CREDENTIALS_UPDATED: 'auth.credentials.updated',

  // Notification service events
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
  EMAIL_SENT: 'notification.email.sent',
  PUSH_SENT: 'notification.push.sent',

  // University integration events
  UNIVERSITY_DATA_SCRAPED: 'university.data.scraped',
  UNIVERSITY_LOGIN_FAILED: 'university.login.failed',
  UNIVERSITY_RATE_LIMITED: 'university.rate_limited',

  // System events
  TENANT_CREATED: 'system.tenant.created',
  TENANT_UPDATED: 'system.tenant.updated',
  SERVICE_HEALTH_CHECK: 'system.service.health_check',
  SYSTEM_ALERT: 'system.alert'
};

// Default event bus configuration for Spike platform
export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchanges: [
      {
        name: 'spike.events',
        type: 'topic',
        durable: true,
        autoDelete: false
      },
      {
        name: 'spike.events.dlx',
        type: 'topic',
        durable: true,
        autoDelete: false
      },
      {
        name: 'spike.notifications',
        type: 'direct',
        durable: true,
        autoDelete: false
      }
    ],
    queues: [
      // Academic service queues
      {
        name: 'academic-service.course-events',
        exchange: 'spike.events',
        routingKey: 'academic.course.*',
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          'x-dead-letter-exchange': 'spike.events.dlx',
          'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours
          'x-max-retries': 3
        }
      },
      {
        name: 'academic-service.grade-events',
        exchange: 'spike.events',
        routingKey: 'academic.grade.*',
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          'x-dead-letter-exchange': 'spike.events.dlx',
          'x-message-ttl': 24 * 60 * 60 * 1000
        }
      },

      // Sync orchestrator queues
      {
        name: 'sync-orchestrator.job-events',
        exchange: 'spike.events',
        routingKey: 'sync.job.*',
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          'x-dead-letter-exchange': 'spike.events.dlx',
          'x-message-ttl': 48 * 60 * 60 * 1000 // 48 hours for job events
        }
      },

      // Auth service queues
      {
        name: 'auth-service.user-events',
        exchange: 'spike.events',
        routingKey: 'auth.*',
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          'x-dead-letter-exchange': 'spike.events.dlx',
          'x-message-ttl': 12 * 60 * 60 * 1000 // 12 hours for auth events
        }
      },

      // Notification service queues
      {
        name: 'notification-service.all-events',
        exchange: 'spike.events',
        routingKey: 'academic.*',
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          'x-dead-letter-exchange': 'spike.events.dlx'
        }
      },
      {
        name: 'notification-service.urgent',
        exchange: 'spike.notifications',
        routingKey: 'urgent',
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          'x-message-ttl': 60 * 60 * 1000 // 1 hour for urgent notifications
        }
      },

      // Dead letter queue
      {
        name: 'spike.events.dead-letters',
        exchange: 'spike.events.dlx',
        routingKey: '#',
        durable: true,
        exclusive: false,
        autoDelete: false
      }
    ],
    deadLetterExchange: 'spike.events.dlx'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_EVENTS_DB || '2')
  },
  retries: {
    maxAttempts: 3,
    backoffDelay: 1000, // 1 second
    maxDelay: 30000     // 30 seconds
  },
  monitoring: {
    enableMetrics: process.env.NODE_ENV === 'production',
    metricsInterval: 60000 // 1 minute
  }
};

// Event message structure for Spike platform
export interface SpikeEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  userId?: string;
  correlationId: string;
  causationId?: string;
  timestamp: Date;
  version: number;
  source: string;
  data: Record<string, any>;
  metadata?: {
    retryCount?: number;
    originalTimestamp?: Date;
    traceId?: string;
    spanId?: string;
  };
}

// Service-specific event types
export interface AcademicEvent extends SpikeEvent {
  source: 'academic-service';
  data: {
    course?: any;
    assignment?: any;
    grade?: any;
    enrollment?: any;
  };
}

export interface SyncEvent extends SpikeEvent {
  source: 'sync-orchestrator';
  data: {
    jobId: string;
    jobType: string;
    status?: string;
    progress?: number;
    result?: any;
    error?: string;
  };
}

export interface AuthEvent extends SpikeEvent {
  source: 'auth-service';
  data: {
    userId: string;
    sessionId?: string;
    authMethod?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface NotificationEvent extends SpikeEvent {
  source: 'notification-service';
  data: {
    notificationType: 'email' | 'push' | 'sms';
    recipient: string;
    subject?: string;
    message: string;
    status: 'sent' | 'failed' | 'pending';
  };
}

// Event routing utilities
export class EventRouter {
  static getRoutingKey(tenantId: string, eventType: string): string {
    return `${tenantId}.${eventType}`;
  }

  static getQueueName(serviceName: string, eventCategory: string): string {
    return `${serviceName}.${eventCategory}`;
  }

  static isSystemEvent(eventType: string): boolean {
    return eventType.startsWith('system.');
  }

  static isTenantSpecific(eventType: string): boolean {
    return !this.isSystemEvent(eventType);
  }

  static getEventPriority(eventType: string): 'high' | 'normal' | 'low' {
    const highPriorityPatterns = [
      'auth.user.logged_out',
      'auth.session.expired',
      'system.alert',
      'sync.job.failed'
    ];

    const lowPriorityPatterns = [
      'system.service.health_check',
      'notification.sent',
      'sync.job.progress'
    ];

    if (highPriorityPatterns.some(pattern => eventType.match(pattern))) {
      return 'high';
    }

    if (lowPriorityPatterns.some(pattern => eventType.match(pattern))) {
      return 'low';
    }

    return 'normal';
  }
}

// Event publishing utilities
export class EventPublisher {
  static createEvent<T extends SpikeEvent>(
    eventType: string,
    aggregateId: string,
    tenantId: string,
    source: string,
    data: any,
    options: {
      userId?: string;
      correlationId?: string;
      causationId?: string;
      version?: number;
      metadata?: any;
    } = {}
  ): T {
    return {
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      aggregateId,
      tenantId,
      userId: options.userId,
      correlationId: options.correlationId || `corr-${Date.now()}`,
      causationId: options.causationId,
      timestamp: new Date(),
      version: options.version || 1,
      source,
      data,
      metadata: options.metadata
    } as T;
  }

  static createAcademicEvent(
    eventType: string,
    aggregateId: string,
    tenantId: string,
    data: any,
    options?: any
  ): AcademicEvent {
    return this.createEvent<AcademicEvent>(
      eventType,
      aggregateId,
      tenantId,
      'academic-service',
      data,
      options
    );
  }

  static createSyncEvent(
    eventType: string,
    aggregateId: string,
    tenantId: string,
    data: any,
    options?: any
  ): SyncEvent {
    return this.createEvent<SyncEvent>(
      eventType,
      aggregateId,
      tenantId,
      'sync-orchestrator',
      data,
      options
    );
  }
}

// Event subscription configuration
export interface EventSubscription {
  serviceName: string;
  eventPatterns: string[];
  handler: string; // Handler function name or class
  options: {
    queueName?: string;
    durable?: boolean;
    exclusive?: boolean;
    autoAck?: boolean;
    prefetch?: number;
    retries?: number;
  };
}

// Predefined subscriptions for Spike services
export const SPIKE_EVENT_SUBSCRIPTIONS: EventSubscription[] = [
  // Academic service subscriptions
  {
    serviceName: 'academic-service',
    eventPatterns: ['sync.job.completed', 'sync.job.failed'],
    handler: 'SyncJobEventHandler',
    options: {
      queueName: 'academic-service.sync-updates',
      durable: true,
      prefetch: 5,
      retries: 3
    }
  },

  // Sync orchestrator subscriptions
  {
    serviceName: 'sync-orchestrator',
    eventPatterns: ['auth.credentials.updated'],
    handler: 'CredentialUpdateHandler',
    options: {
      queueName: 'sync-orchestrator.credential-updates',
      durable: true,
      prefetch: 10,
      retries: 2
    }
  },

  // Notification service subscriptions
  {
    serviceName: 'notification-service',
    eventPatterns: [
      'academic.assignment.created',
      'academic.grade.updated',
      'sync.job.completed',
      'sync.job.failed'
    ],
    handler: 'NotificationEventHandler',
    options: {
      queueName: 'notification-service.academic-notifications',
      durable: true,
      prefetch: 20,
      retries: 3
    }
  },

  // Auth service subscriptions
  {
    serviceName: 'auth-service',
    eventPatterns: ['university.login.failed', 'system.tenant.created'],
    handler: 'AuthSystemEventHandler',
    options: {
      queueName: 'auth-service.system-events',
      durable: true,
      prefetch: 5,
      retries: 2
    }
  }
];

export default DEFAULT_EVENT_BUS_CONFIG;