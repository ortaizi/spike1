/**
 * Safe SQL Builder Utility
 *
 * This utility provides safe construction of SQL identifiers and names
 * to prevent SQL injection vulnerabilities when working with dynamic
 * database and schema names.
 *
 * All methods in this utility perform validation and sanitization
 * before constructing SQL identifiers.
 */

import { SecureTenantIdValidator, validateTenantId } from './tenant-validation';

/**
 * Safe SQL identifier builder with protection against SQL injection
 *
 * This class provides methods to safely construct database names, schema names,
 * and other SQL identifiers using validated tenant IDs. All methods implement
 * defense-in-depth security measures.
 */
export class SafeSqlBuilder {
  /**
   * Tenant validator instance for secure validation
   */
  private static readonly validator = new SecureTenantIdValidator();

  /**
   * Creates a safe schema name for a tenant
   *
   * Schema names follow the pattern: academic_<validated_tenant_id>
   *
   * @param tenantId - The tenant ID to use in the schema name
   * @returns Safe schema name (without quotes)
   * @throws Error if tenant ID is invalid
   *
   * @example
   * SafeSqlBuilder.createSchemaName('bgu_student_123') // Returns: 'academic_bgu_student_123'
   */
  static createSchemaName(tenantId: string): string {
    const safeTenantId = validateTenantId(tenantId);
    return `academic_${safeTenantId}`;
  }

  /**
   * Creates a safe database name for a tenant
   *
   * Database names follow the pattern: spike_<validated_tenant_id>
   *
   * @param tenantId - The tenant ID to use in the database name
   * @returns Safe database name (without quotes)
   * @throws Error if tenant ID is invalid
   *
   * @example
   * SafeSqlBuilder.createDatabaseName('bgu_student_123') // Returns: 'spike_bgu_student_123'
   */
  static createDatabaseName(tenantId: string): string {
    const safeTenantId = validateTenantId(tenantId);
    return `spike_${safeTenantId}`;
  }

  /**
   * Creates a safe trigger name for a tenant
   *
   * @param triggerBaseName - Base name for the trigger (e.g., 'refresh_on_grade_change')
   * @param tenantId - The tenant ID to use in the trigger name
   * @returns Safe trigger name (without quotes)
   * @throws Error if tenant ID is invalid
   */
  static createTriggerName(triggerBaseName: string, tenantId: string): string {
    const safeTenantId = validateTenantId(tenantId);

    // Validate trigger base name
    if (!triggerBaseName || typeof triggerBaseName !== 'string') {
      throw new Error('Trigger base name must be a non-empty string');
    }

    // Sanitize trigger base name (allow letters, numbers, underscores)
    const safeTriggerBaseName = triggerBaseName.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeTriggerBaseName !== triggerBaseName) {
      throw new Error('Trigger base name contains invalid characters');
    }

    return `${safeTriggerBaseName}_${safeTenantId}`;
  }

  /**
   * Creates a safe function name for a tenant
   *
   * @param functionBaseName - Base name for the function (e.g., 'refresh_query_models')
   * @param tenantId - The tenant ID to use in the function name
   * @returns Safe function name (without quotes)
   * @throws Error if tenant ID is invalid
   */
  static createFunctionName(functionBaseName: string, tenantId: string): string {
    const safeTenantId = validateTenantId(tenantId);

    // Validate function base name
    if (!functionBaseName || typeof functionBaseName !== 'string') {
      throw new Error('Function base name must be a non-empty string');
    }

    // Sanitize function base name
    const safeFunctionBaseName = functionBaseName.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeFunctionBaseName !== functionBaseName) {
      throw new Error('Function base name contains invalid characters');
    }

    return `${safeFunctionBaseName}_${safeTenantId}`;
  }

  /**
   * Creates a safe view name for a tenant
   *
   * @param viewBaseName - Base name for the view (e.g., 'dashboard_summary')
   * @param tenantId - The tenant ID to use in the view name (optional, for global views)
   * @returns Safe view name (without quotes)
   * @throws Error if tenant ID is invalid
   */
  static createViewName(viewBaseName: string, tenantId?: string): string {
    // Validate view base name
    if (!viewBaseName || typeof viewBaseName !== 'string') {
      throw new Error('View base name must be a non-empty string');
    }

    // Sanitize view base name
    const safeViewBaseName = viewBaseName.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeViewBaseName !== viewBaseName) {
      throw new Error('View base name contains invalid characters');
    }

    // If tenant ID is provided, validate it
    if (tenantId) {
      const safeTenantId = validateTenantId(tenantId);
      return `${safeViewBaseName}_${safeTenantId}`;
    }

    return safeViewBaseName;
  }

  /**
   * Safely quotes a PostgreSQL identifier
   *
   * This method properly escapes PostgreSQL identifiers to prevent
   * SQL injection when using dynamic identifier names.
   *
   * @param identifier - The identifier to quote
   * @returns Properly quoted identifier
   *
   * @example
   * SafeSqlBuilder.quoteIdentifier('my_table') // Returns: '"my_table"'
   * SafeSqlBuilder.quoteIdentifier('table"with"quotes') // Returns: '"table""with""quotes"'
   */
  static quoteIdentifier(identifier: string): string {
    if (!identifier || typeof identifier !== 'string') {
      throw new Error('Identifier must be a non-empty string');
    }

    // PostgreSQL identifier quoting: escape double quotes by doubling them
    const escaped = identifier.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  /**
   * Creates a safe qualified table name (schema.table)
   *
   * @param schemaName - Schema name (should be result of createSchemaName)
   * @param tableName - Table name
   * @returns Safely quoted qualified table name
   * @throws Error if parameters are invalid
   */
  static createQualifiedTableName(schemaName: string, tableName: string): string {
    if (!schemaName || typeof schemaName !== 'string') {
      throw new Error('Schema name must be a non-empty string');
    }

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('Table name must be a non-empty string');
    }

    // Validate table name contains only safe characters
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Table name contains invalid characters');
    }

    return `${this.quoteIdentifier(schemaName)}.${this.quoteIdentifier(tableName)}`;
  }

  /**
   * Validates that a string can be safely used as a SQL identifier
   *
   * @param identifier - The identifier to validate
   * @returns true if safe, false otherwise
   */
  static isValidIdentifier(identifier: string): boolean {
    return (
      typeof identifier === 'string' &&
      identifier.length > 0 &&
      identifier.length <= 63 && // PostgreSQL identifier limit
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)
    ); // Must start with letter or underscore
  }
}

/**
 * Utility functions for common SQL building patterns
 */

/**
 * Creates a safe schema name with proper quoting
 */
export function createSafeSchema(tenantId: string): string {
  const schemaName = SafeSqlBuilder.createSchemaName(tenantId);
  return SafeSqlBuilder.quoteIdentifier(schemaName);
}

/**
 * Creates a safe qualified table name with proper quoting
 */
export function createSafeQualifiedTable(tenantId: string, tableName: string): string {
  const schemaName = SafeSqlBuilder.createSchemaName(tenantId);
  return SafeSqlBuilder.createQualifiedTableName(schemaName, tableName);
}

/**
 * Creates a safe database connection string component
 */
export function createSafeDatabase(tenantId: string): string {
  return SafeSqlBuilder.createDatabaseName(tenantId);
}
