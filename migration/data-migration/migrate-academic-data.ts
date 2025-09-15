#!/usr/bin/env tsx
/**
 * Academic Data Migration Script
 * Migrates course, assignment, grade, and enrollment data from monolith to microservices
 *
 * Usage: tsx migrate-academic-data.ts --tenant=bgu --dry-run
 */

import { Pool } from 'pg';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface MigrationConfig {
  tenant: string;
  dryRun: boolean;
  batchSize: number;
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

interface MigrationStats {
  courses: { migrated: number; errors: number };
  assignments: { migrated: number; errors: number };
  grades: { migrated: number; errors: number };
  enrollments: { migrated: number; errors: number };
  duration: number;
}

class AcademicDataMigration {
  private sourcePool: Pool;
  private targetPool: Pool;
  private config: MigrationConfig;
  private stats: MigrationStats;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.sourcePool = new Pool(config.sourceDb);
    this.targetPool = new Pool(config.targetDb);
    this.stats = {
      courses: { migrated: 0, errors: 0 },
      assignments: { migrated: 0, errors: 0 },
      grades: { migrated: 0, errors: 0 },
      enrollments: { migrated: 0, errors: 0 },
      duration: 0
    };
  }

  async migrate(): Promise<void> {
    const startTime = Date.now();

    console.log(`🚀 Starting academic data migration for tenant: ${this.config.tenant}`);
    console.log(`📊 Dry run mode: ${this.config.dryRun}`);
    console.log(`📦 Batch size: ${this.config.batchSize}`);

    try {
      // Verify connections
      await this.verifyConnections();

      // Create schema if needed (only in actual migration)
      if (!this.config.dryRun) {
        await this.ensureTargetSchema();
      }

      // Migrate data in dependency order
      await this.migrateCourses();
      await this.migrateAssignments();
      await this.migrateEnrollments();
      await this.migrateGrades();

      this.stats.duration = Date.now() - startTime;

      console.log('✅ Migration completed successfully');
      this.printStats();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async verifyConnections(): Promise<void> {
    console.log('🔍 Verifying database connections...');

    // Test source connection
    const sourceClient = await this.sourcePool.connect();
    await sourceClient.query('SELECT 1');
    sourceClient.release();

    // Test target connection
    const targetClient = await this.targetPool.connect();
    await targetClient.query('SELECT 1');
    targetClient.release();

    console.log('✅ Database connections verified');
  }

  private async ensureTargetSchema(): Promise<void> {
    console.log('🗄️  Ensuring target schema exists...');

    const client = await this.targetPool.connect();
    try {
      // Create schema if it doesn't exist
      await client.query(`CREATE SCHEMA IF NOT EXISTS academic_${this.config.tenant}`);
      console.log(`✅ Schema academic_${this.config.tenant} ready`);
    } finally {
      client.release();
    }
  }

  private async migrateCourses(): Promise<void> {
    console.log('📚 Migrating courses...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    try {
      // Count total courses
      const countResult = await sourceClient.query(`
        SELECT COUNT(*) as total
        FROM courses
        WHERE tenant_id = $1
      `, [this.config.tenant]);

      const totalCourses = parseInt(countResult.rows[0].total);
      console.log(`📊 Found ${totalCourses} courses to migrate`);

      let offset = 0;
      while (offset < totalCourses) {
        // Fetch batch of courses
        const coursesResult = await sourceClient.query(`
          SELECT
            id, code, name, faculty, academic_year, semester,
            credits, instructor, description, metadata,
            created_at, updated_at
          FROM courses
          WHERE tenant_id = $1
          ORDER BY created_at
          LIMIT $2 OFFSET $3
        `, [this.config.tenant, this.config.batchSize, offset]);

        const courses = coursesResult.rows;

        for (const course of courses) {
          try {
            if (!this.config.dryRun) {
              // Insert course into target database
              await targetClient.query(`
                INSERT INTO academic_${this.config.tenant}.courses (
                  id, code, name, faculty, academic_year, semester,
                  credits, instructor, description, metadata, tenant_id,
                  created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  updated_at = EXCLUDED.updated_at
              `, [
                course.id,
                course.code,
                course.name,
                course.faculty,
                course.academic_year,
                course.semester,
                course.credits,
                course.instructor,
                course.description,
                JSON.stringify(course.metadata || {}),
                this.config.tenant,
                course.created_at,
                course.updated_at
              ]);

              // Create domain event for course creation
              await this.createCourseEvent(targetClient, course);
            }

            this.stats.courses.migrated++;
          } catch (error) {
            console.error(`❌ Failed to migrate course ${course.code}:`, error);
            this.stats.courses.errors++;
          }
        }

        offset += this.config.batchSize;
        const progress = Math.round((offset / totalCourses) * 100);
        console.log(`📈 Courses progress: ${progress}% (${Math.min(offset, totalCourses)}/${totalCourses})`);
      }

      console.log(`✅ Courses migration completed: ${this.stats.courses.migrated} migrated, ${this.stats.courses.errors} errors`);

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  private async migrateAssignments(): Promise<void> {
    console.log('📝 Migrating assignments...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    try {
      const countResult = await sourceClient.query(`
        SELECT COUNT(*) as total
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE c.tenant_id = $1
      `, [this.config.tenant]);

      const totalAssignments = parseInt(countResult.rows[0].total);
      console.log(`📊 Found ${totalAssignments} assignments to migrate`);

      let offset = 0;
      while (offset < totalAssignments) {
        const assignmentsResult = await sourceClient.query(`
          SELECT
            a.id, a.course_id, a.title, a.description, a.due_date,
            a.status, a.weight, a.max_grade, a.metadata,
            a.created_at, a.updated_at
          FROM assignments a
          JOIN courses c ON a.course_id = c.id
          WHERE c.tenant_id = $1
          ORDER BY a.created_at
          LIMIT $2 OFFSET $3
        `, [this.config.tenant, this.config.batchSize, offset]);

        const assignments = assignmentsResult.rows;

        for (const assignment of assignments) {
          try {
            if (!this.config.dryRun) {
              await targetClient.query(`
                INSERT INTO academic_${this.config.tenant}.assignments (
                  id, course_id, title, description, due_date,
                  status, weight, max_grade, metadata, tenant_id,
                  created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id) DO UPDATE SET
                  title = EXCLUDED.title,
                  updated_at = EXCLUDED.updated_at
              `, [
                assignment.id,
                assignment.course_id,
                assignment.title,
                assignment.description,
                assignment.due_date,
                assignment.status,
                assignment.weight,
                assignment.max_grade,
                JSON.stringify(assignment.metadata || {}),
                this.config.tenant,
                assignment.created_at,
                assignment.updated_at
              ]);

              await this.createAssignmentEvent(targetClient, assignment);
            }

            this.stats.assignments.migrated++;
          } catch (error) {
            console.error(`❌ Failed to migrate assignment ${assignment.title}:`, error);
            this.stats.assignments.errors++;
          }
        }

        offset += this.config.batchSize;
        const progress = Math.round((offset / totalAssignments) * 100);
        console.log(`📈 Assignments progress: ${progress}% (${Math.min(offset, totalAssignments)}/${totalAssignments})`);
      }

      console.log(`✅ Assignments migration completed: ${this.stats.assignments.migrated} migrated, ${this.stats.assignments.errors} errors`);

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  private async migrateEnrollments(): Promise<void> {
    console.log('👥 Migrating enrollments...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    try {
      const countResult = await sourceClient.query(`
        SELECT COUNT(*) as total
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.tenant_id = $1
      `, [this.config.tenant]);

      const totalEnrollments = parseInt(countResult.rows[0].total);
      console.log(`📊 Found ${totalEnrollments} enrollments to migrate`);

      let offset = 0;
      while (offset < totalEnrollments) {
        const enrollmentsResult = await sourceClient.query(`
          SELECT
            e.id, e.user_id, e.course_id, e.role, e.status,
            e.enrolled_at, e.metadata
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE c.tenant_id = $1
          ORDER BY e.enrolled_at
          LIMIT $2 OFFSET $3
        `, [this.config.tenant, this.config.batchSize, offset]);

        const enrollments = enrollmentsResult.rows;

        for (const enrollment of enrollments) {
          try {
            if (!this.config.dryRun) {
              await targetClient.query(`
                INSERT INTO academic_${this.config.tenant}.enrollments (
                  id, user_id, course_id, role, status,
                  enrolled_at, tenant_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                  status = EXCLUDED.status
              `, [
                enrollment.id,
                enrollment.user_id,
                enrollment.course_id,
                enrollment.role,
                enrollment.status,
                enrollment.enrolled_at,
                this.config.tenant
              ]);

              await this.createEnrollmentEvent(targetClient, enrollment);
            }

            this.stats.enrollments.migrated++;
          } catch (error) {
            console.error(`❌ Failed to migrate enrollment ${enrollment.id}:`, error);
            this.stats.enrollments.errors++;
          }
        }

        offset += this.config.batchSize;
        const progress = Math.round((offset / totalEnrollments) * 100);
        console.log(`📈 Enrollments progress: ${progress}% (${Math.min(offset, totalEnrollments)}/${totalEnrollments})`);
      }

      console.log(`✅ Enrollments migration completed: ${this.stats.enrollments.migrated} migrated, ${this.stats.enrollments.errors} errors`);

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  private async migrateGrades(): Promise<void> {
    console.log('📊 Migrating grades...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();

    try {
      const countResult = await sourceClient.query(`
        SELECT COUNT(*) as total
        FROM grades g
        JOIN assignments a ON g.assignment_id = a.id
        JOIN courses c ON a.course_id = c.id
        WHERE c.tenant_id = $1
      `, [this.config.tenant]);

      const totalGrades = parseInt(countResult.rows[0].total);
      console.log(`📊 Found ${totalGrades} grades to migrate`);

      let offset = 0;
      while (offset < totalGrades) {
        const gradesResult = await sourceClient.query(`
          SELECT
            g.id, g.user_id, g.assignment_id, a.course_id,
            g.score, g.max_score, g.letter_grade, g.feedback,
            g.graded_at, g.metadata
          FROM grades g
          JOIN assignments a ON g.assignment_id = a.id
          JOIN courses c ON a.course_id = c.id
          WHERE c.tenant_id = $1
          ORDER BY g.graded_at
          LIMIT $2 OFFSET $3
        `, [this.config.tenant, this.config.batchSize, offset]);

        const grades = gradesResult.rows;

        for (const grade of grades) {
          try {
            if (!this.config.dryRun) {
              await targetClient.query(`
                INSERT INTO academic_${this.config.tenant}.grades (
                  id, user_id, assignment_id, course_id,
                  score, max_score, letter_grade, feedback,
                  graded_at, tenant_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO UPDATE SET
                  score = EXCLUDED.score,
                  letter_grade = EXCLUDED.letter_grade,
                  feedback = EXCLUDED.feedback
              `, [
                grade.id,
                grade.user_id,
                grade.assignment_id,
                grade.course_id,
                grade.score,
                grade.max_score,
                grade.letter_grade,
                grade.feedback,
                grade.graded_at,
                this.config.tenant
              ]);

              await this.createGradeEvent(targetClient, grade);
            }

            this.stats.grades.migrated++;
          } catch (error) {
            console.error(`❌ Failed to migrate grade ${grade.id}:`, error);
            this.stats.grades.errors++;
          }
        }

        offset += this.config.batchSize;
        const progress = Math.round((offset / totalGrades) * 100);
        console.log(`📈 Grades progress: ${progress}% (${Math.min(offset, totalGrades)}/${totalGrades})`);
      }

      console.log(`✅ Grades migration completed: ${this.stats.grades.migrated} migrated, ${this.stats.grades.errors} errors`);

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  private async createCourseEvent(client: any, course: any): Promise<void> {
    const event = {
      id: uuidv4(),
      aggregate_id: course.id,
      event_type: 'course.migrated',
      event_data: JSON.stringify({
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          faculty: course.faculty
        },
        migrationId: createHash('md5').update(course.id + 'migration').digest('hex')
      }),
      event_time: new Date(),
      tenant_id: this.config.tenant,
      correlation_id: uuidv4(),
      version: 1
    };

    await client.query(`
      INSERT INTO academic_${this.config.tenant}.events (
        id, aggregate_id, event_type, event_data, event_time,
        tenant_id, correlation_id, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      event.id,
      event.aggregate_id,
      event.event_type,
      event.event_data,
      event.event_time,
      event.tenant_id,
      event.correlation_id,
      event.version
    ]);
  }

  private async createAssignmentEvent(client: any, assignment: any): Promise<void> {
    const event = {
      id: uuidv4(),
      aggregate_id: assignment.id,
      event_type: 'assignment.migrated',
      event_data: JSON.stringify({
        assignment: {
          id: assignment.id,
          courseId: assignment.course_id,
          title: assignment.title
        },
        migrationId: createHash('md5').update(assignment.id + 'migration').digest('hex')
      }),
      event_time: new Date(),
      tenant_id: this.config.tenant,
      correlation_id: uuidv4(),
      version: 1
    };

    await client.query(`
      INSERT INTO academic_${this.config.tenant}.events (
        id, aggregate_id, event_type, event_data, event_time,
        tenant_id, correlation_id, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      event.id,
      event.aggregate_id,
      event.event_type,
      event.event_data,
      event.event_time,
      event.tenant_id,
      event.correlation_id,
      event.version
    ]);
  }

  private async createEnrollmentEvent(client: any, enrollment: any): Promise<void> {
    const event = {
      id: uuidv4(),
      aggregate_id: enrollment.course_id,
      event_type: 'student.enrolled.migrated',
      event_data: JSON.stringify({
        enrollment: {
          id: enrollment.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          role: enrollment.role
        },
        migrationId: createHash('md5').update(enrollment.id + 'migration').digest('hex')
      }),
      event_time: new Date(),
      tenant_id: this.config.tenant,
      correlation_id: uuidv4(),
      user_id: enrollment.user_id,
      version: 1
    };

    await client.query(`
      INSERT INTO academic_${this.config.tenant}.events (
        id, aggregate_id, event_type, event_data, event_time,
        tenant_id, correlation_id, user_id, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      event.id,
      event.aggregate_id,
      event.event_type,
      event.event_data,
      event.event_time,
      event.tenant_id,
      event.correlation_id,
      event.user_id,
      event.version
    ]);
  }

  private async createGradeEvent(client: any, grade: any): Promise<void> {
    const event = {
      id: uuidv4(),
      aggregate_id: grade.assignment_id,
      event_type: 'grade.updated.migrated',
      event_data: JSON.stringify({
        grade: {
          id: grade.id,
          userId: grade.user_id,
          assignmentId: grade.assignment_id,
          score: grade.score,
          maxScore: grade.max_score
        },
        migrationId: createHash('md5').update(grade.id + 'migration').digest('hex')
      }),
      event_time: new Date(),
      tenant_id: this.config.tenant,
      correlation_id: uuidv4(),
      user_id: grade.user_id,
      version: 1
    };

    await client.query(`
      INSERT INTO academic_${this.config.tenant}.events (
        id, aggregate_id, event_type, event_data, event_time,
        tenant_id, correlation_id, user_id, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      event.id,
      event.aggregate_id,
      event.event_type,
      event.event_data,
      event.event_time,
      event.tenant_id,
      event.correlation_id,
      event.user_id,
      event.version
    ]);
  }

  private printStats(): void {
    console.log('\n📊 Migration Statistics:');
    console.log('='.repeat(50));
    console.log(`🕒 Duration: ${Math.round(this.stats.duration / 1000)}s`);
    console.log(`📚 Courses: ${this.stats.courses.migrated} migrated, ${this.stats.courses.errors} errors`);
    console.log(`📝 Assignments: ${this.stats.assignments.migrated} migrated, ${this.stats.assignments.errors} errors`);
    console.log(`👥 Enrollments: ${this.stats.enrollments.migrated} migrated, ${this.stats.enrollments.errors} errors`);
    console.log(`📊 Grades: ${this.stats.grades.migrated} migrated, ${this.stats.grades.errors} errors`);
    console.log('='.repeat(50));
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up connections...');
    await this.sourcePool.end();
    await this.targetPool.end();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const tenant = args.find(arg => arg.startsWith('--tenant='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1000');

  if (!tenant) {
    console.error('❌ Tenant is required. Usage: tsx migrate-academic-data.ts --tenant=bgu');
    process.exit(1);
  }

  const config: MigrationConfig = {
    tenant,
    dryRun,
    batchSize,
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
    }
  };

  const migration = new AcademicDataMigration(config);
  await migration.migrate();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { AcademicDataMigration, type MigrationConfig, type MigrationStats };