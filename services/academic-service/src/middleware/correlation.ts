import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logging';

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Create request-scoped logger
  req.logger = logger.child({
    correlationId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });

  // Log incoming request
  req.logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? 'present' : 'missing',
      'x-tenant-id': req.get('X-Tenant-ID')
    }
  });

  next();
};