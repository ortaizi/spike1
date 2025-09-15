import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, tenantId, userId, correlationId, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: service || 'academic-service',
        tenantId,
        userId,
        correlationId,
        ...meta
      });
    })
  ),
  defaultMeta: {
    service: 'academic-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

export function setupLogging() {
  logger.info('Logging configured for academic-service');
  return logger;
}