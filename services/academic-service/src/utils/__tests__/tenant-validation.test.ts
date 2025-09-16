/**
 * Security Tests for Tenant ID Validation
 *
 * These tests validate that the tenant ID validation utilities properly
 * prevent SQL injection attacks and other security vulnerabilities.
 */

import { SecureTenantIdValidator, validateTenantId } from '../tenant-validation';

describe('SecureTenantIdValidator', () => {
  let validator: SecureTenantIdValidator;

  beforeEach(() => {
    validator = new SecureTenantIdValidator();
  });

  describe('Valid Tenant IDs', () => {
    test('should accept alphanumeric tenant IDs', () => {
      expect(validator.isValid('bgu123')).toBe(true);
      expect(validator.isValid('student_456')).toBe(true);
      expect(validator.isValid('test_tenant_1')).toBe(true);
    });

    test('should accept tenant IDs with underscores', () => {
      expect(validator.isValid('bgu_student')).toBe(true);
      expect(validator.isValid('test_123_abc')).toBe(true);
    });

    test('should validate and sanitize valid tenant IDs', () => {
      expect(validator.validateAndSanitize('bgu123')).toBe('bgu123');
      expect(validator.validateAndSanitize('student_456')).toBe('student_456');
    });
  });

  describe('Invalid Tenant IDs - SQL Injection Prevention', () => {
    test('should reject SQL injection attempts', () => {
      expect(() => validator.validateAndSanitize("'; DROP TABLE users; --")).toThrow();
      expect(() => validator.validateAndSanitize('admin\'; SELECT * FROM secrets; --')).toThrow();
      expect(() => validator.validateAndSanitize('1\' OR 1=1 --')).toThrow();
    });

    test('should reject tenant IDs with SQL keywords', () => {
      expect(() => validator.validateAndSanitize('DROP')).toThrow();
      expect(() => validator.validateAndSanitize('SELECT')).toThrow();
      expect(() => validator.validateAndSanitize('DELETE')).toThrow();
      expect(() => validator.validateAndSanitize('UPDATE')).toThrow();
      expect(() => validator.validateAndSanitize('INSERT')).toThrow();
      expect(() => validator.validateAndSanitize('UNION')).toThrow();
      expect(() => validator.validateAndSanitize('EXEC')).toThrow();
    });

    test('should reject tenant IDs with special characters', () => {
      expect(() => validator.validateAndSanitize('tenant-123')).toThrow();
      expect(() => validator.validateAndSanitize('tenant@domain')).toThrow();
      expect(() => validator.validateAndSanitize('tenant.123')).toThrow();
      expect(() => validator.validateAndSanitize('tenant space')).toThrow();
      expect(() => validator.validateAndSanitize('tenant;123')).toThrow();
      expect(() => validator.validateAndSanitize('tenant\'123')).toThrow();
      expect(() => validator.validateAndSanitize('tenant\"123')).toThrow();
    });

    test('should reject tenant IDs that are too long', () => {
      const longTenantId = 'a'.repeat(51); // 51 characters
      expect(() => validator.validateAndSanitize(longTenantId)).toThrow();
    });

    test('should reject empty or null tenant IDs', () => {
      expect(() => validator.validateAndSanitize('')).toThrow();
      expect(() => validator.validateAndSanitize(null as any)).toThrow();
      expect(() => validator.validateAndSanitize(undefined as any)).toThrow();
    });

    test('should reject non-string tenant IDs', () => {
      expect(() => validator.validateAndSanitize(123 as any)).toThrow();
      expect(() => validator.validateAndSanitize({} as any)).toThrow();
      expect(() => validator.validateAndSanitize([] as any)).toThrow();
    });
  });

  describe('Sanitization', () => {
    test('should sanitize tenant IDs by removing special characters', () => {
      expect(validator.sanitize('tenant-123')).toBe('tenant123');
      expect(validator.sanitize('tenant@domain.com')).toBe('tenantdomaincom');
      expect(validator.sanitize('tenant space')).toBe('tenantspace');
    });

    test('should preserve valid characters during sanitization', () => {
      expect(validator.sanitize('tenant_123')).toBe('tenant_123');
      expect(validator.sanitize('BGU123')).toBe('BGU123');
    });
  });

  describe('SQL Injection Attack Vectors', () => {
    const commonAttacks = [
      "'; DROP TABLE users; --",
      "' UNION SELECT password FROM users --",
      "admin'--",
      "admin'/*",
      "' OR '1'='1",
      "'; EXEC xp_cmdshell('dir') --",
      "1'; DROP DATABASE academic; --",
      "test'; UPDATE users SET password='hacked' --",
      "'; INSERT INTO admin (username) VALUES ('hacker') --",
      "' OR 1=1; DELETE FROM courses; --"
    ];

    test.each(commonAttacks)('should reject SQL injection attempt: %s', (attack) => {
      expect(() => validator.validateAndSanitize(attack)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle maximum valid length', () => {
      const maxValidLength = 'a'.repeat(50); // 50 characters (max allowed)
      expect(validator.validateAndSanitize(maxValidLength)).toBe(maxValidLength);
    });

    test('should reject just over maximum length', () => {
      const overMaxLength = 'a'.repeat(51); // 51 characters (over limit)
      expect(() => validator.validateAndSanitize(overMaxLength)).toThrow();
    });

    test('should handle minimum valid length', () => {
      expect(validator.validateAndSanitize('a')).toBe('a');
    });
  });
});

describe('validateTenantId utility function', () => {
  test('should validate tenant IDs using global validator', () => {
    expect(validateTenantId('bgu123')).toBe('bgu123');
    expect(validateTenantId('student_456')).toBe('student_456');
  });

  test('should throw on invalid tenant IDs', () => {
    expect(() => validateTenantId("'; DROP TABLE users; --")).toThrow();
    expect(() => validateTenantId('invalid-tenant')).toThrow();
  });
});

describe('Security Regression Tests', () => {
  test('should prevent bypassing validation with Unicode characters', () => {
    const validator = new SecureTenantIdValidator();
    expect(() => validator.validateAndSanitize('tenant\u0000')).toThrow();
    expect(() => validator.validateAndSanitize('tenant\u000A')).toThrow();
    expect(() => validator.validateAndSanitize('tenant\u000D')).toThrow();
  });

  test('should prevent bypassing validation with encoded characters', () => {
    const validator = new SecureTenantIdValidator();
    expect(() => validator.validateAndSanitize('tenant%20DROP')).toThrow();
    expect(() => validator.validateAndSanitize('tenant+DROP')).toThrow();
  });
});