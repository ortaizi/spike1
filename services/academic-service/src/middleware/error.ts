import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logging';

export class ServiceError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ValidationError extends ServiceError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export const errorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestLogger = req.logger || logger;

  if (error instanceof ServiceError) {
    requestLogger.warn('Service error:', {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      tenantId: req.tenantId,
      userId: req.userId,
      stack: error.stack,
    });

    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  }

  // Unexpected errors
  requestLogger.error('Unexpected error:', {
    error: error.message,
    stack: error.stack,
    tenantId: req.tenantId,
    userId: req.userId,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
  });
};
