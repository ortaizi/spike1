import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logging';

const VALID_TENANTS = ['bgu', 'tau', 'huji'];

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      userId?: string;
      correlationId: string;
      logger: typeof logger;
    }
  }
}

export async function resolveTenant(req: Request): Promise<string> {
  // Priority 1: Subdomain
  const subdomain = req.hostname.split('.')[0];
  if (VALID_TENANTS.includes(subdomain)) {
    return subdomain;
  }

  // Priority 2: JWT claim
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (decoded.tenantId && VALID_TENANTS.includes(decoded.tenantId)) {
        return decoded.tenantId;
      }
    } catch (error) {
      // Token invalid, continue to next method
    }
  }

  // Priority 3: Header
  const tenantHeader = req.headers['x-tenant-id'] as string;
  if (tenantHeader && VALID_TENANTS.includes(tenantHeader)) {
    return tenantHeader;
  }

  throw new Error('Tenant identification failed');
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = await resolveTenant(req);
    req.tenantId = tenantId;

    // Add tenant info to response headers
    res.setHeader('X-Tenant-ID', tenantId);

    next();
  } catch (error) {
    logger.error('Tenant resolution failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      hostname: req.hostname,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        'x-tenant-id': req.headers['x-tenant-id'],
      },
    });

    res.status(400).json({
      error: 'Tenant identification failed',
      message: 'Unable to determine tenant from request',
    });
  }
};
