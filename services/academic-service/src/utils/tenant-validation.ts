/**
 * Secure TenantId Validation Utility
 *
 * This utility provides secure validation and sanitization for tenant IDs
 * to prevent SQL injection vulnerabilities. All tenant IDs must be validated
 * before use in SQL queries or database operations.
 *
 * Security Requirements:
 * - Alphanumeric characters and underscores only
 * - Maximum length of 50 characters
 * - No special characters that could enable SQL injection
 * - Fail-fast behavior for invalid inputs
 */

export interface TenantIdValidator {
  isValid(tenantId: string): boolean;
  sanitize(tenantId: string): string;
  validateAndSanitize(tenantId: string): string;
}

/**
 * Secure implementation of tenant ID validation
 *
 * Implements defense-in-depth strategy:
 * 1. Input type validation
 * 2. Length validation (1-50 characters)
 * 3. Pattern validation (alphanumeric + underscore only)
 * 4. Character sanitization
 * 5. Fail-fast error handling
 */
export class SecureTenantIdValidator implements TenantIdValidator {
  /**
   * Regex pattern for valid tenant IDs
   * - Only allows: a-z, A-Z, 0-9, underscore
   * - Length: 1-50 characters
   */
  private static readonly VALID_PATTERN = /^[a-zA-Z0-9_]{1,50}$/;

  /**
   * Maximum allowed length for tenant IDs
   */
  private static readonly MAX_LENGTH = 50;

  /**
   * Validates if a tenant ID is safe to use
   *
   * @param tenantId - The tenant ID to validate
   * @returns true if valid, false otherwise
   */
  isValid(tenantId: string): boolean {
    return (
      typeof tenantId === 'string' &&
      tenantId.length > 0 &&
      tenantId.length <= SecureTenantIdValidator.MAX_LENGTH &&
      SecureTenantIdValidator.VALID_PATTERN.test(tenantId)
    );
  }

  /**
   * Sanitizes a tenant ID by removing potentially dangerous characters
   *
   * @param tenantId - The tenant ID to sanitize
   * @returns Sanitized tenant ID with only safe characters
   */
  sanitize(tenantId: string): string {
    if (typeof tenantId !== 'string') {
      return '';
    }

    // Remove any character that is not alphanumeric or underscore
    return tenantId.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * Validates and sanitizes a tenant ID, throwing an error if invalid
   *
   * This is the primary method to use when processing tenant IDs for
   * database operations. It ensures the tenant ID is safe to use in
   * SQL queries and database identifiers.
   *
   * @param tenantId - The tenant ID to validate and sanitize
   * @returns Validated and sanitized tenant ID
   * @throws Error if tenant ID is invalid or unsafe
   */
  validateAndSanitize(tenantId: string): string {
    // Input validation
    if (!tenantId) {
      throw new Error('TenantId must be provided and cannot be empty');
    }

    if (typeof tenantId !== 'string') {
      throw new Error('TenantId must be a string');
    }

    // Length validation
    if (tenantId.length === 0) {
      throw new Error('TenantId cannot be empty');
    }

    if (tenantId.length > SecureTenantIdValidator.MAX_LENGTH) {
      throw new Error(`TenantId cannot exceed ${SecureTenantIdValidator.MAX_LENGTH} characters`);
    }

    // Sanitize the input
    const sanitized = this.sanitize(tenantId);

    // Validate the sanitized input
    if (!this.isValid(sanitized)) {
      throw new Error(
        'Invalid tenantId format. Only alphanumeric characters and underscores are allowed (1-50 chars)'
      );
    }

    // Additional safety check - ensure no dangerous SQL keywords
    const upperCased = sanitized.toUpperCase();
    const dangerousKeywords = [
      'DROP',
      'DELETE',
      'UPDATE',
      'INSERT',
      'SELECT',
      'ALTER',
      'CREATE',
      'TRUNCATE',
      'GRANT',
      'REVOKE',
      'UNION',
      'EXEC',
      'EXECUTE',
      'DECLARE',
      'SCRIPT',
      'PROCEDURE',
      'FUNCTION',
    ];

    for (const keyword of dangerousKeywords) {
      if (upperCased.includes(keyword)) {
        throw new Error(`TenantId cannot contain SQL keywords: ${keyword}`);
      }
    }

    return sanitized;
  }
}

/**
 * Global instance of the tenant validator for convenience
 * Use this instance throughout the application for consistent validation
 */
export const tenantValidator = new SecureTenantIdValidator();

/**
 * Utility function for quick tenant ID validation
 *
 * @param tenantId - The tenant ID to validate
 * @returns Validated tenant ID
 * @throws Error if validation fails
 */
export function validateTenantId(tenantId: string): string {
  return tenantValidator.validateAndSanitize(tenantId);
}
