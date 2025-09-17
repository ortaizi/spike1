import winston from 'winston';

// Define custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: 'auth-service',
      message,
      ...meta,
    };

    return JSON.stringify(logEntry);
  })
);

// Create Winston logger instance
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'auth-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(
          ({ timestamp, level, message, correlationId, userId, tenantId, ...meta }) => {
            let logString = `[${timestamp}] ${level}: ${message}`;

            // Add correlation tracking
            if (correlationId) {
              logString += ` [correlationId: ${correlationId}]`;
            }

            // Add user context
            if (userId) {
              logString += ` [userId: ${userId}]`;
            }

            // Add tenant context
            if (tenantId) {
              logString += ` [tenant: ${tenantId}]`;
            }

            // Add other metadata
            const metaKeys = Object.keys(meta);
            if (metaKeys.length > 0) {
              const metaString = metaKeys
                .map((key) => `${key}: ${JSON.stringify(meta[key])}`)
                .join(', ');
              logString += ` [${metaString}]`;
            }

            return logString;
          }
        )
      ),
    }),

    // File transport for production
    new winston.transports.File({
      filename: process.env.LOG_FILE_ERROR || 'logs/auth-service-error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),

    new winston.transports.File({
      filename: process.env.LOG_FILE_COMBINED || 'logs/auth-service.log',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true,
    }),
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/auth-service-exceptions.log',
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/auth-service-rejections.log',
    }),
  ],

  // Exit on error
  exitOnError: false,
});

// Add HTTP transport for centralized logging in production
if (process.env.NODE_ENV === 'production' && process.env.LOG_ENDPOINT) {
  logger.add(
    new winston.transports.Http({
      host: process.env.LOG_HOST || 'elasticsearch',
      port: parseInt(process.env.LOG_PORT || '9200'),
      path: process.env.LOG_ENDPOINT || '/logs/_doc',
      ssl: process.env.LOG_SSL === 'true',
    })
  );
}

// Create child logger with correlation ID
export function createCorrelatedLogger(correlationId: string, userId?: string, tenantId?: string) {
  return logger.child({
    correlationId,
    userId,
    tenantId,
  });
}

// Security event logging
export function logSecurityEvent(event: {
  type:
    | 'AUTH_FAILURE'
    | 'CREDENTIAL_ACCESS'
    | 'SESSION_HIJACK'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_ACTIVITY';
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  correlationId?: string;
}) {
  logger.warn('SECURITY_EVENT', {
    securityEventType: event.type,
    userId: event.userId,
    tenantId: event.tenantId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    details: event.details,
    correlationId: event.correlationId,
    timestamp: new Date().toISOString(),
  });
}

// Performance monitoring
export function logPerformanceMetric(metric: {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: any;
  correlationId?: string;
}) {
  logger.info('PERFORMANCE_METRIC', {
    operation: metric.operation,
    duration: metric.duration,
    success: metric.success,
    metadata: metric.metadata,
    correlationId: metric.correlationId,
    timestamp: new Date().toISOString(),
  });
}

// Database query logging
export function logDatabaseQuery(query: {
  sql: string;
  params?: any[];
  duration: number;
  rowCount?: number;
  correlationId?: string;
}) {
  logger.debug('DATABASE_QUERY', {
    sql: query.sql.substring(0, 200) + (query.sql.length > 200 ? '...' : ''),
    paramCount: query.params?.length || 0,
    duration: query.duration,
    rowCount: query.rowCount,
    correlationId: query.correlationId,
  });
}

// Middleware for request logging
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const correlationId = req.headers['x-correlation-id'] || require('uuid').v4();

    req.correlationId = correlationId;
    req.logger = createCorrelatedLogger(
      correlationId,
      req.headers['x-user-id'],
      req.headers['x-tenant-id']
    );

    // Log request start
    req.logger.info('HTTP_REQUEST_START', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      contentLength: req.get('Content-Length'),
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;

      req.logger.info('HTTP_REQUEST_END', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length'),
      });
    });

    next();
  };
}

// Ensure log directory exists
import fs from 'fs';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
