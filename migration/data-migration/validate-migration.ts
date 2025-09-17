#!/usr/bin/env tsx
/**
 * Migration Validation Script
 * Validates data integrity between monolith and microservices
 *
 * Usage: tsx validate-migration.ts --tenant=bgu --verbose
 */

import { Pool } from 'pg';

interface ValidationConfig {
  tenant: string;
  verbose: boolean;
  sourceDb: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  targetDb: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

interface ValidationResults {
  courses: ValidationResult;
  assignments: ValidationResult;
  enrollments: ValidationResult;
  grades: ValidationResult;
  overall: {
    passed: boolean;
    criticalErrors: number;
    warnings: number;
  };
}

interface ValidationResult {
  entity: string;
  passed: boolean;
  counts: {
    source: number;
    target: number;
    missing: number;
    extra: number;
  };
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'MISSING_RECORD' | 'DATA_MISMATCH' | 'CONSTRAINT_VIOLATION';
  entityId: string;
  message: string;
  details?: any;
}

interface ValidationWarning {
  type: 'MINOR_DIFFERENCE' | 'METADATA_MISMATCH' | 'TIMESTAMP_DRIFT';
  entityId: string;
  message: string;
  details?: any;
}

class MigrationValidator {
  private sourcePool: Pool;
  private targetPool: Pool;
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
    this.sourcePool = new Pool(config.sourceDb);
    this.targetPool = new Pool(config.targetDb);
  }

  async validate(): Promise<ValidationResults> {
    console.log(`🔍 Starting migration validation for tenant: ${this.config.tenant}`);

    const results: ValidationResults = {
      courses: await this.validateCourses(),
      assignments: await this.validateAssignments(),
      enrollments: await this.validateEnrollments(),
      grades: await this.validateGrades(),
      overall: {
        passed: true,
        criticalErrors: 0,
        warnings: 0,
      },
    };

    // Calculate overall results
    const entities = [results.courses, results.assignments, results.enrollments, results.grades];
    results.overall.passed = entities.every((entity) => entity.passed);
    results.overall.criticalErrors = entities.reduce(
      (sum, entity) => sum + entity.errors.length,
      0
    );
    results.overall.warnings = entities.reduce((sum, entity) => sum + entity.warnings.length, 0);

    this.printResults(results);
    await this.cleanup();

    return results;
  }

  private async validateCourses(): Promise<ValidationResult> {
    console.log('📚 Validating courses...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    const result: ValidationResult = {
      entity: 'courses',
      passed: true,
      counts: { source: 0, target: 0, missing: 0, extra: 0 },
      errors: [],
      warnings: [],
    };

    try {
      // Get counts
      const sourceCount = await sourceClient.query(
        'SELECT COUNT(*) as count FROM courses WHERE tenant_id = $1',
        [this.config.tenant]
      );
      result.counts.source = parseInt(sourceCount.rows[0].count);

      const targetCount = await targetClient.query(
        `SELECT COUNT(*) as count FROM academic_${this.config.tenant}.courses`,
        []
      );
      result.counts.target = parseInt(targetCount.rows[0].count);

      // Basic count validation
      if (result.counts.source !== result.counts.target) {
        result.errors.push({
          type: 'DATA_MISMATCH',
          entityId: 'COUNT',
          message: `Course count mismatch: source=${result.counts.source}, target=${result.counts.target}`,
        });
        result.passed = false;
      }

      // Detailed record validation
      const sourceCourses = await sourceClient.query(
        `
        SELECT id, code, name, faculty, academic_year, semester, credits, instructor, created_at
        FROM courses
        WHERE tenant_id = $1
        ORDER BY id
      `,
        [this.config.tenant]
      );

      for (const sourceCourse of sourceCourses.rows) {
        const targetResult = await targetClient.query(
          `
          SELECT id, code, name, faculty, academic_year, semester, credits, instructor, created_at
          FROM academic_${this.config.tenant}.courses
          WHERE id = $1
        `,
          [sourceCourse.id]
        );

        if (targetResult.rows.length === 0) {
          result.errors.push({
            type: 'MISSING_RECORD',
            entityId: sourceCourse.id,
            message: `Course ${sourceCourse.code} (${sourceCourse.id}) not found in target`,
            details: { code: sourceCourse.code, name: sourceCourse.name },
          });
          result.counts.missing++;
          result.passed = false;
          continue;
        }

        const targetCourse = targetResult.rows[0];

        // Validate critical fields
        const criticalFields = ['code', 'name', 'faculty', 'academic_year', 'semester', 'credits'];
        for (const field of criticalFields) {
          if (sourceCourse[field] !== targetCourse[field]) {
            result.errors.push({
              type: 'DATA_MISMATCH',
              entityId: sourceCourse.id,
              message: `Course ${sourceCourse.code}: ${field} mismatch`,
              details: {
                source: sourceCourse[field],
                target: targetCourse[field],
              },
            });
            result.passed = false;
          }
        }

        // Validate non-critical fields (warnings only)
        if (sourceCourse.instructor !== targetCourse.instructor) {
          result.warnings.push({
            type: 'MINOR_DIFFERENCE',
            entityId: sourceCourse.id,
            message: `Course ${sourceCourse.code}: instructor mismatch`,
            details: {
              source: sourceCourse.instructor,
              target: targetCourse.instructor,
            },
          });
        }

        // Check timestamp drift (warning if > 1 minute)
        const timeDrift = Math.abs(
          new Date(sourceCourse.created_at).getTime() - new Date(targetCourse.created_at).getTime()
        );

        if (timeDrift > 60000) {
          // 1 minute
          result.warnings.push({
            type: 'TIMESTAMP_DRIFT',
            entityId: sourceCourse.id,
            message: `Course ${sourceCourse.code}: significant timestamp drift`,
            details: {
              driftMs: timeDrift,
              source: sourceCourse.created_at,
              target: targetCourse.created_at,
            },
          });
        }
      }

      // Check for extra records in target
      const allTargetCourses = await targetClient.query(`
        SELECT id, code FROM academic_${this.config.tenant}.courses ORDER BY id
      `);

      const sourceIds = new Set(sourceCourses.rows.map((c) => c.id));
      for (const targetCourse of allTargetCourses.rows) {
        if (!sourceIds.has(targetCourse.id)) {
          result.warnings.push({
            type: 'MINOR_DIFFERENCE',
            entityId: targetCourse.id,
            message: `Extra course in target: ${targetCourse.code}`,
            details: { code: targetCourse.code },
          });
          result.counts.extra++;
        }
      }

      if (this.config.verbose) {
        console.log(
          `✅ Courses validation: ${result.passed ? 'PASSED' : 'FAILED'} - ${result.errors.length} errors, ${result.warnings.length} warnings`
        );
      }
    } catch (error) {
      result.errors.push({
        type: 'CONSTRAINT_VIOLATION',
        entityId: 'VALIDATION',
        message: `Course validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      result.passed = false;
    } finally {
      sourceClient.release();
      targetClient.release();
    }

    return result;
  }

  private async validateAssignments(): Promise<ValidationResult> {
    console.log('📝 Validating assignments...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    const result: ValidationResult = {
      entity: 'assignments',
      passed: true,
      counts: { source: 0, target: 0, missing: 0, extra: 0 },
      errors: [],
      warnings: [],
    };

    try {
      // Get counts with JOIN to ensure tenant filtering
      const sourceCount = await sourceClient.query(
        `
        SELECT COUNT(*) as count
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE c.tenant_id = $1
      `,
        [this.config.tenant]
      );
      result.counts.source = parseInt(sourceCount.rows[0].count);

      const targetCount = await targetClient.query(
        `SELECT COUNT(*) as count FROM academic_${this.config.tenant}.assignments`
      );
      result.counts.target = parseInt(targetCount.rows[0].count);

      if (result.counts.source !== result.counts.target) {
        result.errors.push({
          type: 'DATA_MISMATCH',
          entityId: 'COUNT',
          message: `Assignment count mismatch: source=${result.counts.source}, target=${result.counts.target}`,
        });
        result.passed = false;
      }

      // Detailed validation
      const sourceAssignments = await sourceClient.query(
        `
        SELECT a.id, a.course_id, a.title, a.due_date, a.status, a.weight, a.max_grade, c.code as course_code
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE c.tenant_id = $1
        ORDER BY a.id
      `,
        [this.config.tenant]
      );

      for (const sourceAssignment of sourceAssignments.rows) {
        const targetResult = await targetClient.query(
          `
          SELECT id, course_id, title, due_date, status, weight, max_grade
          FROM academic_${this.config.tenant}.assignments
          WHERE id = $1
        `,
          [sourceAssignment.id]
        );

        if (targetResult.rows.length === 0) {
          result.errors.push({
            type: 'MISSING_RECORD',
            entityId: sourceAssignment.id,
            message: `Assignment ${sourceAssignment.title} not found in target`,
            details: {
              title: sourceAssignment.title,
              courseCode: sourceAssignment.course_code,
            },
          });
          result.counts.missing++;
          result.passed = false;
          continue;
        }

        const targetAssignment = targetResult.rows[0];

        // Validate critical fields
        const criticalFields = ['course_id', 'title', 'status', 'weight', 'max_grade'];
        for (const field of criticalFields) {
          if (sourceAssignment[field] !== targetAssignment[field]) {
            result.errors.push({
              type: 'DATA_MISMATCH',
              entityId: sourceAssignment.id,
              message: `Assignment ${sourceAssignment.title}: ${field} mismatch`,
              details: {
                source: sourceAssignment[field],
                target: targetAssignment[field],
              },
            });
            result.passed = false;
          }
        }

        // Validate due dates (handle timezone differences)
        const sourceDue = new Date(sourceAssignment.due_date);
        const targetDue = new Date(targetAssignment.due_date);
        const dueDateDrift = Math.abs(sourceDue.getTime() - targetDue.getTime());

        if (dueDateDrift > 60000) {
          // More than 1 minute difference
          result.warnings.push({
            type: 'TIMESTAMP_DRIFT',
            entityId: sourceAssignment.id,
            message: `Assignment ${sourceAssignment.title}: due date drift`,
            details: {
              driftMs: dueDateDrift,
              source: sourceAssignment.due_date,
              target: targetAssignment.due_date,
            },
          });
        }
      }

      if (this.config.verbose) {
        console.log(
          `✅ Assignments validation: ${result.passed ? 'PASSED' : 'FAILED'} - ${result.errors.length} errors, ${result.warnings.length} warnings`
        );
      }
    } catch (error) {
      result.errors.push({
        type: 'CONSTRAINT_VIOLATION',
        entityId: 'VALIDATION',
        message: `Assignment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      result.passed = false;
    } finally {
      sourceClient.release();
      targetClient.release();
    }

    return result;
  }

  private async validateEnrollments(): Promise<ValidationResult> {
    console.log('👥 Validating enrollments...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    const result: ValidationResult = {
      entity: 'enrollments',
      passed: true,
      counts: { source: 0, target: 0, missing: 0, extra: 0 },
      errors: [],
      warnings: [],
    };

    try {
      const sourceCount = await sourceClient.query(
        `
        SELECT COUNT(*) as count
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.tenant_id = $1
      `,
        [this.config.tenant]
      );
      result.counts.source = parseInt(sourceCount.rows[0].count);

      const targetCount = await targetClient.query(
        `SELECT COUNT(*) as count FROM academic_${this.config.tenant}.enrollments`
      );
      result.counts.target = parseInt(targetCount.rows[0].count);

      if (result.counts.source !== result.counts.target) {
        result.errors.push({
          type: 'DATA_MISMATCH',
          entityId: 'COUNT',
          message: `Enrollment count mismatch: source=${result.counts.source}, target=${result.counts.target}`,
        });
        result.passed = false;
      }

      if (this.config.verbose) {
        console.log(
          `✅ Enrollments validation: ${result.passed ? 'PASSED' : 'FAILED'} - ${result.errors.length} errors, ${result.warnings.length} warnings`
        );
      }
    } catch (error) {
      result.errors.push({
        type: 'CONSTRAINT_VIOLATION',
        entityId: 'VALIDATION',
        message: `Enrollment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      result.passed = false;
    } finally {
      sourceClient.release();
      targetClient.release();
    }

    return result;
  }

  private async validateGrades(): Promise<ValidationResult> {
    console.log('📊 Validating grades...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    const result: ValidationResult = {
      entity: 'grades',
      passed: true,
      counts: { source: 0, target: 0, missing: 0, extra: 0 },
      errors: [],
      warnings: [],
    };

    try {
      const sourceCount = await sourceClient.query(
        `
        SELECT COUNT(*) as count
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN courses c ON a.course_id = c.id
        WHERE c.tenant_id = $1
      `,
        [this.config.tenant]
      );
      result.counts.source = parseInt(sourceCount.rows[0].count);

      const targetCount = await targetClient.query(
        `SELECT COUNT(*) as count FROM academic_${this.config.tenant}.grades`
      );
      result.counts.target = parseInt(targetCount.rows[0].count);

      if (result.counts.source !== result.counts.target) {
        result.errors.push({
          type: 'DATA_MISMATCH',
          entityId: 'COUNT',
          message: `Grade count mismatch: source=${result.counts.source}, target=${result.counts.target}`,
        });
        result.passed = false;
      }

      if (this.config.verbose) {
        console.log(
          `✅ Grades validation: ${result.passed ? 'PASSED' : 'FAILED'} - ${result.errors.length} errors, ${result.warnings.length} warnings`
        );
      }
    } catch (error) {
      result.errors.push({
        type: 'CONSTRAINT_VIOLATION',
        entityId: 'VALIDATION',
        message: `Grade validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      result.passed = false;
    } finally {
      sourceClient.release();
      targetClient.release();
    }

    return result;
  }

  private printResults(results: ValidationResults): void {
    console.log('\n🔍 Migration Validation Results');
    console.log('='.repeat(60));

    // Overall status
    const status = results.overall.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`Overall Status: ${status}`);
    console.log(`Critical Errors: ${results.overall.criticalErrors}`);
    console.log(`Warnings: ${results.overall.warnings}`);
    console.log();

    // Entity-specific results
    const entities = [results.courses, results.assignments, results.enrollments, results.grades];

    for (const entity of entities) {
      const entityStatus = entity.passed ? '✅' : '❌';
      console.log(`${entityStatus} ${entity.entity.toUpperCase()}`);
      console.log(`   Source: ${entity.counts.source} | Target: ${entity.counts.target}`);
      console.log(`   Missing: ${entity.counts.missing} | Extra: ${entity.counts.extra}`);
      console.log(`   Errors: ${entity.errors.length} | Warnings: ${entity.warnings.length}`);

      if (this.config.verbose && entity.errors.length > 0) {
        console.log('   Errors:');
        entity.errors.forEach((error) => {
          console.log(`     - ${error.type}: ${error.message}`);
        });
      }

      if (this.config.verbose && entity.warnings.length > 0) {
        console.log('   Warnings:');
        entity.warnings.slice(0, 5).forEach((warning) => {
          console.log(`     - ${warning.type}: ${warning.message}`);
        });
        if (entity.warnings.length > 5) {
          console.log(`     ... and ${entity.warnings.length - 5} more warnings`);
        }
      }
      console.log();
    }

    console.log('='.repeat(60));
  }

  private async cleanup(): Promise<void> {
    await this.sourcePool.end();
    await this.targetPool.end();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const tenant = args.find((arg) => arg.startsWith('--tenant='))?.split('=')[1];
  const verbose = args.includes('--verbose');

  if (!tenant) {
    console.error('❌ Tenant is required. Usage: tsx validate-migration.ts --tenant=bgu');
    process.exit(1);
  }

  const config: ValidationConfig = {
    tenant,
    verbose,
    sourceDb: {
      host: process.env.SOURCE_DB_HOST || 'localhost',
      port: parseInt(process.env.SOURCE_DB_PORT || '5432'),
      database: process.env.SOURCE_DB_NAME || 'spike',
      user: process.env.SOURCE_DB_USER || 'postgres',
      password: process.env.SOURCE_DB_PASSWORD || 'postgres',
    },
    targetDb: {
      host: process.env.TARGET_DB_HOST || 'localhost',
      port: parseInt(process.env.TARGET_DB_PORT || '5432'),
      database: `spike_${tenant}`,
      user: process.env.TARGET_DB_USER || 'postgres',
      password: process.env.TARGET_DB_PASSWORD || 'postgres',
    },
  };

  const validator = new MigrationValidator(config);
  const results = await validator.validate();

  // Exit with error code if validation failed
  process.exit(results.overall.passed ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  });
}

export { MigrationValidator, type ValidationConfig, type ValidationResults };
