import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logging';

interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No valid authentication token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Verify tenant consistency
    if (decoded.tenantId !== req.tenantId) {
      logger.warn('Tenant mismatch in token:', {
        tokenTenant: decoded.tenantId,
        requestTenant: req.tenantId,
        userId: decoded.userId
      });

      return res.status(403).json({
        error: 'Tenant access denied',
        message: 'Token tenant does not match request tenant'
      });
    }

    // Add user info to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
    logger.error('Authentication failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: req.tenantId
    });

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify authentication token'
    });
  }
};