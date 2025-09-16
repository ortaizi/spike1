import * as crypto from 'crypto';
import { env } from '../env';

// Get encryption key from environment or generate a secure one for development
const getEncryptionKey = (): Buffer => {
  const key = env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('⚠️ No ENCRYPTION_KEY found in environment variables. Generating a temporary key for development.');
    console.warn('🔒 For production, please set ENCRYPTION_KEY environment variable to a 32-byte hex string.');
    
    // Generate a random key for development (will be different on each restart)
    return crypto.randomBytes(32);
  }
  
  // Convert hex string to buffer
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-gcm';

export interface EncryptedCredentials {
  encryptedUsername: string;
  encryptedPassword: string;
  authTag: string;
  iv: string;
}

export interface DecryptedCredentials {
  username: string;
  password: string;
}

/**
 * Credentials Encryption Utility
 * Uses AES-256-GCM for authenticated encryption
 */
export class CredentialsEncryption {
  
  /**
   * הצפנת פרטי כניסה למודל באמצעות AES-256-GCM
   * @param username שם המשתמש
   * @param password הסיסמה
   * @returns אובייקט עם הנתונים המוצפנים
   */
  static encryptCredentials(username: string, password: string): EncryptedCredentials {
    try {
      // Generate a random IV for this encryption
      const iv = crypto.randomBytes(16);
      
      // Encrypt username
      const usernameCipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      usernameCipher.setAAD(Buffer.from('spike-username-v1'));
      let encryptedUsername = usernameCipher.update(username, 'utf8', 'hex');
      encryptedUsername += usernameCipher.final('hex');
      const usernameAuthTag = usernameCipher.getAuthTag();
      
      // Encrypt password with same IV but different AAD
      const passwordCipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      passwordCipher.setAAD(Buffer.from('spike-password-v1'));
      let encryptedPassword = passwordCipher.update(password, 'utf8', 'hex');
      encryptedPassword += passwordCipher.final('hex');
      const passwordAuthTag = passwordCipher.getAuthTag();
      
      console.log('🔒 Credentials encrypted successfully');
      
      return {
        encryptedUsername,
        encryptedPassword,
        authTag: `${usernameAuthTag.toString('hex')}:${passwordAuthTag.toString('hex')}`,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Failed to encrypt credentials');
    }
  }
  
  /**
   * פענוח פרטי כניסה מהדטה בייס
   * @param encryptedUsername שם משתמש מוצפן
   * @param encryptedPassword סיסמה מוצפנת
   * @param authTag תג אימות
   * @param iv וקטור התחלתי
   * @returns אובייקט עם הפרטים המפוענחים
   */
  static decryptCredentials(
    encryptedUsername: string,
    encryptedPassword: string, 
    authTag: string,
    iv: string
  ): DecryptedCredentials {
    try {
      const [usernameAuthTag, passwordAuthTag] = authTag.split(':');
      
      if (!usernameAuthTag || !passwordAuthTag) {
        throw new Error('Invalid auth tag format');
      }
      
      const ivBuffer = Buffer.from(iv, 'hex');
      
      // Decrypt username
      const usernameDecipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer);
      usernameDecipher.setAAD(Buffer.from('spike-username-v1'));
      usernameDecipher.setAuthTag(Buffer.from(usernameAuthTag, 'hex'));
      let username = usernameDecipher.update(encryptedUsername, 'hex', 'utf8');
      username += usernameDecipher.final('utf8');
      
      // Decrypt password
      const passwordDecipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer); 
      passwordDecipher.setAAD(Buffer.from('spike-password-v1'));
      passwordDecipher.setAuthTag(Buffer.from(passwordAuthTag, 'hex'));
      let password = passwordDecipher.update(encryptedPassword, 'hex', 'utf8');
      password += passwordDecipher.final('utf8');
      
      console.log('🔓 Credentials decrypted successfully');
      
      return { username, password };
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Failed to decrypt credentials - they may be corrupted or tampered with');
    }
  }
  
  /**
   * בדיקת תקפות מבנה הנתונים המוצפנים
   * @param encryptedData נתונים מוצפנים לבדיקה
   * @returns true אם המבנה תקין
   */
  static validateEncryptionStructure(encryptedData: any): encryptedData is EncryptedCredentials {
    return !!(
      encryptedData &&
      typeof encryptedData.encryptedUsername === 'string' &&
      typeof encryptedData.encryptedPassword === 'string' &&
      typeof encryptedData.authTag === 'string' &&
      typeof encryptedData.iv === 'string' &&
      encryptedData.encryptedUsername.length > 0 &&
      encryptedData.encryptedPassword.length > 0 &&
      encryptedData.authTag.includes(':') &&
      encryptedData.iv.length === 32 // 16 bytes as hex
    );
  }
  
  /**
   * יצירת מפתח הצפנה חדש (לפיתוח בלבד)
   * @returns מפתח הצפנה חדש כ-hex string
   */
  static generateEncryptionKey(): string {
    const key = crypto.randomBytes(32);
    console.log('🔑 New encryption key generated. Add this to your environment variables:');
    console.log(`ENCRYPTION_KEY=${key.toString('hex')}`);
    return key.toString('hex');
  }
  
  /**
   * בדיקה אם ההצפנה פועלת כהלכה
   * @returns true אם ההצפנה עובדת
   */
  static testEncryption(): boolean {
    try {
      const testUsername = 'test_user_123';
      const testPassword = 'test_password_456!@#';
      
      console.log('🧪 Testing encryption functionality...');
      
      // Encrypt
      const encrypted = this.encryptCredentials(testUsername, testPassword);
      console.log('✅ Encryption test passed');
      
      // Validate structure
      if (!this.validateEncryptionStructure(encrypted)) {
        throw new Error('Invalid encryption structure');
      }
      console.log('✅ Structure validation test passed');
      
      // Decrypt
      const decrypted = this.decryptCredentials(
        encrypted.encryptedUsername,
        encrypted.encryptedPassword,
        encrypted.authTag,
        encrypted.iv
      );
      console.log('✅ Decryption test passed');
      
      // Verify data integrity
      if (decrypted.username !== testUsername || decrypted.password !== testPassword) {
        throw new Error('Decrypted data does not match original');
      }
      console.log('✅ Data integrity test passed');
      
      console.log('🎉 All encryption tests passed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Encryption test failed:', error);
      return false;
    }
  }
}

/**
 * Rate Limiting Utility for sensitive operations
 */
export class SecurityLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * בדיקת rate limiting לפעולות רגישות
   * @param identifier מזהה (IP, user ID, etc.)
   * @param maxAttempts מספר ניסיונות מקסימלי
   * @param windowMs חלון זמן במילישניות
   * @returns האם הפעולה מותרת
   */
  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    // No previous attempts or window expired
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetTime: now + windowMs
      };
    }
    
    // Within window
    if (record.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    // Increment attempts
    record.count++;
    this.attempts.set(identifier, record);
    
    return {
      allowed: true,
      remaining: maxAttempts - record.count,
      resetTime: record.resetTime
    };
  }
  
  /**
   * איפוס rate limit למזהה מסוים
   * @param identifier מזהה לאיפוס
   */
  static resetRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  /**
   * ניקוי записи פגי תוקף
   */
  static cleanupExpiredRecords(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [identifier, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(identifier);
        cleaned++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleaned} expired rate limit records`);
    return cleaned;
  }
}

// Auto-cleanup expired rate limit records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    SecurityLimiter.cleanupExpiredRecords();
  }, 5 * 60 * 1000);
}

// Test encryption on module load in development
if (process.env.NODE_ENV === 'development') {
  // Run test on next tick to avoid blocking module loading
  setImmediate(() => {
    try {
      CredentialsEncryption.testEncryption();
    } catch (error) {
      console.error('⚠️ Encryption test failed on module load:', error);
    }
  });
}

export default CredentialsEncryption;