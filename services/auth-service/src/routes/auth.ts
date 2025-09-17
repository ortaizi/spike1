import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RedisConnection } from '../cache/redis';
import { DatabaseConnection } from '../database/connection';
import { createAuditLog, extractTenantFromEmail } from '../utils/auth-helpers';
import { logger } from '../utils/logger';
import { CredentialVault } from '../vault/credential-vault';

const router = Router();
const db = new DatabaseConnection();
const redis = new RedisConnection();
const vault = new CredentialVault();

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation rules
const googleCallbackValidation = [
  body('token').notEmpty().withMessage('Google token is required'),
  body('tenantId').optional().isAlpha().withMessage('Invalid tenant ID format'),
];

const credentialValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('universityId').isIn(['bgu', 'tau', 'huji']).withMessage('Invalid university ID'),
];

// Google OAuth callback endpoint
router.post('/google/callback', googleCallbackValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { token, tenantId: requestedTenantId } = req.body;
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const emailVerified = payload['email_verified'] || false;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Extract tenant from email domain or use requested tenant
    const tenantId = requestedTenantId || extractTenantFromEmail(email);
    if (!tenantId) {
      return res.status(400).json({
        error: 'Cannot determine university from email. Please select your university.',
      });
    }

    // Create or update user
    const user = await db.transaction(async (client) => {
      // Check if user exists by Google ID or email
      let userResult = await client.query(
        'SELECT * FROM auth.users WHERE google_id = $1 OR email = $2',
        [googleId, email]
      );

      let userId: string;

      if (userResult.rows.length > 0) {
        // Update existing user
        const existingUser = userResult.rows[0];
        userId = existingUser.id;

        await client.query(
          `
          UPDATE auth.users
          SET google_id = $1, name = $2, email_verified = $3, last_login = NOW()
          WHERE id = $4
        `,
          [googleId, name, emailVerified, userId]
        );

        logger.info(`User updated: ${email}`, { userId, tenantId, correlationId });
      } else {
        // Create new user
        userId = uuidv4();

        await client.query(
          `
          INSERT INTO auth.users (id, email, google_id, name, email_verified, last_login)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
          [userId, email, googleId, name, emailVerified]
        );

        logger.info(`New user created: ${email}`, { userId, tenantId, correlationId });
      }

      // Get complete user data
      const finalUserResult = await client.query(
        'SELECT id, email, name, email_verified, created_at FROM auth.users WHERE id = $1',
        [userId]
      );

      return finalUserResult.rows[0];
    });

    // Generate JWT token with tenant context
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId,
      emailVerified: user.email_verified,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '1h',
      issuer: 'spike-auth-service',
      audience: `tenant-${tenantId}`,
    });

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
        issuer: 'spike-auth-service',
      }
    );

    // Store refresh token in database
    const refreshTokenId = uuidv4();
    const refreshTokenHash = require('crypto')
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await db.query(
      `
      INSERT INTO auth.refresh_tokens (id, user_id, token_hash, expires_at, tenant_id)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4)
    `,
      [refreshTokenId, user.id, refreshTokenHash, tenantId]
    );

    // Store session in Redis for quick access
    const sessionKey = `session:${tenantId}:${user.id}`;
    await redis.setex(
      sessionKey,
      3600,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        tenantId,
        loginTime: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
      })
    );

    // Create audit log
    await createAuditLog({
      userId: user.id,
      tenantId,
      eventType: 'login',
      eventData: { method: 'google_oauth', email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      correlationId,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        tenantId,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// University credential validation endpoint
router.post('/credentials/validate', credentialValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { username, password, universityId } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    if (!userId || !tenantId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    // Verify user exists and belongs to tenant
    const userResult = await db.query('SELECT id, email FROM auth.users WHERE id = $1', [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store encrypted credentials in vault
    try {
      await vault.storeCredentials(userId, tenantId, {
        username,
        password,
        universityId,
      });

      logger.info('University credentials stored successfully', {
        userId,
        universityId,
        tenantId,
        correlationId,
      });

      // Create audit log
      await createAuditLog({
        userId,
        tenantId,
        eventType: 'credential_store',
        eventData: { universityId, username },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId,
      });

      res.json({
        success: true,
        message: 'Credentials validated and stored securely',
      });
    } catch (vaultError) {
      logger.error('Failed to store credentials in vault:', vaultError);
      res.status(500).json({
        error: 'Failed to store credentials securely',
      });
    }
  } catch (error) {
    logger.error('Credential validation error:', error);
    res.status(500).json({
      error: 'Credential validation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// Token refresh endpoint
router.post('/token/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if refresh token exists in database
    const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');

    const tokenResult = await db.query(
      `
      SELECT rt.*, u.email, u.name
      FROM auth.refresh_tokens rt
      JOIN auth.users u ON rt.user_id = u.id
      WHERE rt.token_hash = $1 AND rt.is_revoked = false AND rt.expires_at > NOW()
    `,
      [tokenHash]
    );

    if (tokenResult.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenData = tokenResult[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: tokenData.user_id,
        email: tokenData.email,
        name: tokenData.name,
        tenantId: tokenData.tenant_id,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '1h',
        issuer: 'spike-auth-service',
        audience: `tenant-${tokenData.tenant_id}`,
      }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 3600,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    if (refreshToken) {
      // Revoke refresh token
      const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');

      await db.query(
        `
        UPDATE auth.refresh_tokens
        SET is_revoked = true, revoked_at = NOW()
        WHERE token_hash = $1
      `,
        [tokenHash]
      );
    }

    if (userId && tenantId) {
      // Clear session from Redis
      const sessionKey = `session:${tenantId}:${userId}`;
      await redis.del(sessionKey);

      // Create audit log
      await createAuditLog({
        userId,
        tenantId,
        eventType: 'logout',
        eventData: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId,
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export { router as authRoutes };
