/**
 * Security Tests for SafeSqlBuilder
 *
 * These tests validate that the SafeSqlBuilder utilities properly
 * construct SQL identifiers without SQL injection vulnerabilities.
 */

import { SafeSqlBuilder, createSafeSchema, createSafeQualifiedTable, createSafeDatabase } from '../sql-builder';

describe('SafeSqlBuilder', () => {
  describe('Schema Name Creation', () => {
    test('should create safe schema names for valid tenant IDs', () => {
      expect(SafeSqlBuilder.createSchemaName('bgu123')).toBe('academic_bgu123');
      expect(SafeSqlBuilder.createSchemaName('student_456')).toBe('academic_student_456');
    });

    test('should reject invalid tenant IDs in schema creation', () => {
      expect(() => SafeSqlBuilder.createSchemaName("'; DROP TABLE users; --")).toThrow();
      expect(() => SafeSqlBuilder.createSchemaName('invalid-tenant')).toThrow();
    });
  });

  describe('Database Name Creation', () => {
    test('should create safe database names for valid tenant IDs', () => {
      expect(SafeSqlBuilder.createDatabaseName('bgu123')).toBe('spike_bgu123');
      expect(SafeSqlBuilder.createDatabaseName('student_456')).toBe('spike_student_456');
    });

    test('should reject invalid tenant IDs in database creation', () => {
      expect(() => SafeSqlBuilder.createDatabaseName("'; DROP DATABASE test; --")).toThrow();
      expect(() => SafeSqlBuilder.createDatabaseName('invalid-tenant')).toThrow();
    });
  });

  describe('Trigger Name Creation', () => {
    test('should create safe trigger names', () => {
      const result = SafeSqlBuilder.createTriggerName('refresh_on_change', 'bgu123');
      expect(result).toBe('refresh_on_change_bgu123');
    });

    test('should validate trigger base names', () => {
      expect(() => SafeSqlBuilder.createTriggerName('', 'bgu123')).toThrow();
      expect(() => SafeSqlBuilder.createTriggerName(null as any, 'bgu123')).toThrow();
    });

    test('should reject invalid characters in trigger names', () => {
      expect(() => SafeSqlBuilder.createTriggerName('refresh-on-change', 'bgu123')).toThrow();
      expect(() => SafeSqlBuilder.createTriggerName('refresh on change', 'bgu123')).toThrow();
    });
  });

  describe('Function Name Creation', () => {
    test('should create safe function names', () => {
      const result = SafeSqlBuilder.createFunctionName('refresh_query_models', 'bgu123');
      expect(result).toBe('refresh_query_models_bgu123');
    });

    test('should validate function base names', () => {
      expect(() => SafeSqlBuilder.createFunctionName('', 'bgu123')).toThrow();
      expect(() => SafeSqlBuilder.createFunctionName('invalid-function', 'bgu123')).toThrow();
    });
  });

  describe('View Name Creation', () => {
    test('should create safe view names without tenant ID', () => {
      const result = SafeSqlBuilder.createViewName('dashboard_summary');
      expect(result).toBe('dashboard_summary');
    });

    test('should create safe view names with tenant ID', () => {
      const result = SafeSqlBuilder.createViewName('dashboard_summary', 'bgu123');
      expect(result).toBe('dashboard_summary_bgu123');
    });

    test('should validate view base names', () => {
      expect(() => SafeSqlBuilder.createViewName('')).toThrow();
      expect(() => SafeSqlBuilder.createViewName('invalid-view')).toThrow();
    });
  });

  describe('Identifier Quoting', () => {
    test('should properly quote PostgreSQL identifiers', () => {
      expect(SafeSqlBuilder.quoteIdentifier('simple_name')).toBe('"simple_name"');
      expect(SafeSqlBuilder.quoteIdentifier('CamelCase')).toBe('"CamelCase"');
      expect(SafeSqlBuilder.quoteIdentifier('with_123_numbers')).toBe('"with_123_numbers"');
    });

    test('should escape double quotes in identifiers', () => {
      expect(SafeSqlBuilder.quoteIdentifier('name"with"quotes')).toBe('"name""with""quotes"');
      expect(SafeSqlBuilder.quoteIdentifier('table"name')).toBe('"table""name"');
    });

    test('should reject empty identifiers', () => {
      expect(() => SafeSqlBuilder.quoteIdentifier('')).toThrow();
      expect(() => SafeSqlBuilder.quoteIdentifier(null as any)).toThrow();
    });
  });

  describe('Qualified Table Names', () => {
    test('should create properly quoted qualified table names', () => {
      const result = SafeSqlBuilder.createQualifiedTableName('academic_bgu123', 'courses');
      expect(result).toBe('"academic_bgu123"."courses"');
    });

    test('should validate schema and table names', () => {
      expect(() => SafeSqlBuilder.createQualifiedTableName('', 'courses')).toThrow();
      expect(() => SafeSqlBuilder.createQualifiedTableName('schema', '')).toThrow();
    });

    test('should reject invalid characters in table names', () => {
      expect(() => SafeSqlBuilder.createQualifiedTableName('schema', 'invalid-table')).toThrow();
      expect(() => SafeSqlBuilder.createQualifiedTableName('schema', 'table with spaces')).toThrow();
    });
  });

  describe('Identifier Validation', () => {
    test('should validate PostgreSQL identifiers', () => {
      expect(SafeSqlBuilder.isValidIdentifier('valid_name')).toBe(true);
      expect(SafeSqlBuilder.isValidIdentifier('_starts_with_underscore')).toBe(true);
      expect(SafeSqlBuilder.isValidIdentifier('CamelCase')).toBe(true);
      expect(SafeSqlBuilder.isValidIdentifier('name123')).toBe(true);
    });

    test('should reject invalid identifiers', () => {
      expect(SafeSqlBuilder.isValidIdentifier('')).toBe(false);
      expect(SafeSqlBuilder.isValidIdentifier('123starts_with_number')).toBe(false);
      expect(SafeSqlBuilder.isValidIdentifier('invalid-dash')).toBe(false);
      expect(SafeSqlBuilder.isValidIdentifier('invalid space')).toBe(false);
      expect(SafeSqlBuilder.isValidIdentifier('a'.repeat(64))).toBe(false); // Too long
    });
  });
});

describe('Utility Functions', () => {
  describe('createSafeSchema', () => {
    test('should create quoted schema names', () => {
      const result = createSafeSchema('bgu123');
      expect(result).toBe('"academic_bgu123"');
    });

    test('should reject invalid tenant IDs', () => {
      expect(() => createSafeSchema("'; DROP SCHEMA test; --")).toThrow();
    });
  });

  describe('createSafeQualifiedTable', () => {
    test('should create quoted qualified table names', () => {
      const result = createSafeQualifiedTable('bgu123', 'courses');
      expect(result).toBe('"academic_bgu123"."courses"');
    });

    test('should reject invalid tenant IDs and table names', () => {
      expect(() => createSafeQualifiedTable("'; DROP TABLE test; --", 'courses')).toThrow();
      expect(() => createSafeQualifiedTable('bgu123', 'invalid-table')).toThrow();
    });
  });

  describe('createSafeDatabase', () => {
    test('should create safe database names', () => {
      const result = createSafeDatabase('bgu123');
      expect(result).toBe('spike_bgu123');
    });

    test('should reject invalid tenant IDs', () => {
      expect(() => createSafeDatabase("'; DROP DATABASE test; --")).toThrow();
    });
  });
});

describe('SQL Injection Prevention Tests', () => {
  const maliciousInputs = [
    "'; DROP SCHEMA academic_test; --",
    "test'; CREATE TABLE malicious (id INT); --",
    "admin'/**/UNION/**/SELECT/**/password/**/FROM/**/users--",
    "1' OR '1'='1' --",
    "'; EXEC xp_cmdshell('malicious_command'); --",
    "tenant\"; DROP TABLE courses; --"
  ];

  test.each(maliciousInputs)('should prevent SQL injection in schema creation: %s', (maliciousInput) => {
    expect(() => SafeSqlBuilder.createSchemaName(maliciousInput)).toThrow();
  });

  test.each(maliciousInputs)('should prevent SQL injection in database creation: %s', (maliciousInput) => {
    expect(() => SafeSqlBuilder.createDatabaseName(maliciousInput)).toThrow();
  });

  test.each(maliciousInputs)('should prevent SQL injection in trigger creation: %s', (maliciousInput) => {
    expect(() => SafeSqlBuilder.createTriggerName('refresh_on_change', maliciousInput)).toThrow();
  });
});

describe('Integration Tests', () => {
  test('should work with real-world tenant IDs', () => {
    const validTenantIds = [
      'bgu_student_2024',
      'haifa_university',
      'technion_cs',
      'weizmann_science',
      'huji_medicine'
    ];

    validTenantIds.forEach(tenantId => {
      expect(() => {
        const schema = SafeSqlBuilder.createSchemaName(tenantId);
        const database = SafeSqlBuilder.createDatabaseName(tenantId);
        const quotedSchema = SafeSqlBuilder.quoteIdentifier(schema);
        const qualifiedTable = SafeSqlBuilder.createQualifiedTableName(schema, 'courses');

        // All operations should succeed
        expect(schema).toContain('academic_');
        expect(database).toContain('spike_');
        expect(quotedSchema).toMatch(/^".*"$/);
        expect(qualifiedTable).toMatch(/^".*"\.".*"$/);
      }).not.toThrow();
    });
  });
});