import * as crypto from 'crypto';

/**
 * Encryption utilities for university credentials
 * Provides secure encryption/decryption of sensitive data
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Generate a secure encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }
  
  // Create a deterministic key from the secret
  return crypto.scryptSync(secret, 'spike-university-credentials', ENCRYPTION_KEY_LENGTH);
}

/**
 * Encrypt text data
 * @param text - The text to encrypt
 * @returns Encrypted text as base64 string
 */
export function encryptText(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key);
    cipher.setAAD(Buffer.from('spike-university-credentials'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + AuthTag + EncryptedData
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text data
 * @param encryptedText - The encrypted text as base64 string
 * @returns Decrypted text
 */
export function decryptText(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract IV, AuthTag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedData = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, key);
    decipher.setAAD(Buffer.from('spike-university-credentials'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt university credentials
 * @param username - University username
 * @param password - University password
 * @returns Object with encrypted username and password
 */
export function encryptUniversityCredentials(username: string, password: string) {
  return {
    encryptedUsername: encryptText(username),
    encryptedPassword: encryptText(password)
  };
}

/**
 * Decrypt university credentials
 * @param encryptedUsername - Encrypted username
 * @param encryptedPassword - Encrypted password
 * @returns Object with decrypted username and password
 */
export function decryptUniversityCredentials(encryptedUsername: string, encryptedPassword: string) {
  return {
    username: decryptText(encryptedUsername),
    password: decryptText(encryptedPassword)
  };
}

/**
 * Validate encryption key
 * @returns true if encryption key is properly configured
 */
export function validateEncryptionKey(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test encryption/decryption (for development only)
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-username-password-123';
    const encrypted = encryptText(testData);
    const decrypted = decryptText(encrypted);
    
    return testData === decrypted;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
} 