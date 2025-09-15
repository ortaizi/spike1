import { DatabaseConnection } from '../database/connection';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

const db = new DatabaseConnection();

// University domains mapping
const UNIVERSITY_DOMAINS = {
  'bgu.ac.il': 'bgu',
  'post.bgu.ac.il': 'bgu',
  'tau.ac.il': 'tau',
  'mail.tau.ac.il': 'tau',
  'huji.ac.il': 'huji',
  'mail.huji.ac.il': 'huji'
};

// Extract tenant ID from email domain
export function extractTenantFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    return null;
  }

  return UNIVERSITY_DOMAINS[domain] || null;
}

// Validate tenant ID
export function isValidTenant(tenantId: string): boolean {
  const validTenants = ['bgu', 'tau', 'huji'];
  return validTenants.includes(tenantId);
}

// Generate secure session token
export function generateSessionToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

// Hash token for storage
export function hashToken(token: string): string {
  return require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

// Create audit log entry
interface AuditLogData {
  userId?: string;
  tenantId: string;
  eventType: 'login' | 'logout' | 'credential_store' | 'credential_retrieve' | 'session_create' | 'session_revoke' | 'token_refresh' | 'password_reset';
  eventData: any;
  ipAddress?: string;
  userAgent?: string;
  correlationId: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.query(`
      INSERT INTO auth.audit_logs (
        id, user_id, tenant_id, event_type, event_data, ip_address, user_agent, correlation_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      uuidv4(),
      data.userId || null,
      data.tenantId,
      data.eventType,
      JSON.stringify(data.eventData),
      data.ipAddress || null,
      data.userAgent || null,
      data.correlationId
    ]);

    logger.info('Audit log created', {
      eventType: data.eventType,
      tenantId: data.tenantId,
      userId: data.userId,
      correlationId: data.correlationId
    });

  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw error to avoid disrupting the main flow
  }
}

// Validate university credentials format
export function validateCredentialsFormat(username: string, password: string, universityId: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Username validation by university
  switch (universityId) {
    case 'bgu':
      // BGU usernames are typically student ID numbers (8-9 digits)
      if (!/^\d{8,9}$/.test(username)) {
        errors.push('BGU username should be an 8-9 digit student ID');
      }
      break;

    case 'tau':
      // TAU usernames can be student ID or email format
      if (!/^(\d{8,9}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(username)) {
        errors.push('TAU username should be student ID or email format');
      }
      break;

    case 'huji':
      // HUJI usernames are typically alphanumeric
      if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
        errors.push('HUJI username should be 3-20 alphanumeric characters');
      }
      break;

    default:
      errors.push('Invalid university ID');
  }

  // Password validation - basic requirements
  if (password.length < 3) {
    errors.push('Password must be at least 3 characters long');
  }

  if (password.length > 100) {
    errors.push('Password is too long');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate correlation ID for request tracking
export function generateCorrelationId(): string {
  return uuidv4();
}

// Sanitize user data for logging
export function sanitizeUserDataForLogging(userData: any): any {
  const sanitized = { ...userData };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.encrypted_password;
  delete sanitized.encrypted_username;
  delete sanitized.token;
  delete sanitized.refreshToken;

  return sanitized;
}

// Check if user session is valid
export async function isSessionValid(userId: string, tenantId: string): Promise<boolean> {
  try {
    const sessionResult = await db.query(`
      SELECT id FROM auth.sessions
      WHERE user_id = $1 AND tenant_id = $2 AND is_active = true AND expires_at > NOW()
      LIMIT 1
    `, [userId, tenantId]);

    return sessionResult.length > 0;
  } catch (error) {
    logger.error('Session validation error:', error);
    return false;
  }
}

// Get user's active session count
export async function getActiveSessionCount(userId: string, tenantId: string): Promise<number> {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count FROM auth.sessions
      WHERE user_id = $1 AND tenant_id = $2 AND is_active = true AND expires_at > NOW()
    `, [userId, tenantId]);

    return parseInt(result[0]?.count || '0');
  } catch (error) {
    logger.error('Error getting active session count:', error);
    return 0;
  }
}

// Rate limiting helper
export async function checkRateLimit(
  identifier: string,
  windowMs: number,
  maxAttempts: number
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  // This would typically use Redis for distributed rate limiting
  // For now, implementing a simple in-memory version

  const now = Date.now();
  const windowStart = now - windowMs;

  // In a real implementation, you would:
  // 1. Get attempt count from Redis for the identifier
  // 2. Remove expired attempts
  // 3. Check if current count exceeds maxAttempts
  // 4. Update Redis with current attempt

  return {
    allowed: true, // Simplified for now
    remaining: maxAttempts - 1,
    resetTime: new Date(now + windowMs)
  };
}

// University-specific configuration
export function getUniversityConfig(universityId: string) {
  const configs = {
    bgu: {
      name: 'Ben-Gurion University of the Negev',
      domain: 'bgu.ac.il',
      moodleUrl: 'https://moodle.bgu.ac.il',
      loginUrl: 'https://in.bgu.ac.il',
      supportedFeatures: ['moodle', 'grades', 'schedule'],
      locale: 'he-IL',
      timezone: 'Asia/Jerusalem'
    },
    tau: {
      name: 'Tel Aviv University',
      domain: 'tau.ac.il',
      moodleUrl: 'https://moodle.tau.ac.il',
      loginUrl: 'https://www.tau.ac.il',
      supportedFeatures: ['moodle', 'grades'],
      locale: 'he-IL',
      timezone: 'Asia/Jerusalem'
    },
    huji: {
      name: 'Hebrew University of Jerusalem',
      domain: 'huji.ac.il',
      moodleUrl: 'https://moodle.huji.ac.il',
      loginUrl: 'https://www.huji.ac.il',
      supportedFeatures: ['moodle'],
      locale: 'he-IL',
      timezone: 'Asia/Jerusalem'
    }
  };

  return configs[universityId] || null;
}

// Encrypt sensitive data before storage
export function encryptSensitiveData(data: string): string {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars-long', 'utf8');
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipher(algorithm, key);
  cipher.setIV(iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
export function decryptSensitiveData(encryptedData: string): string {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars-long', 'utf8');

  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setIV(iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}