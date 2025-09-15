import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import { DatabaseManager } from '../../src/config/database';
import { EventBus } from '../../src/services/event-bus';
import { ViewManager } from '../../src/cqrs/view-manager';

describe('Academic Service Integration Tests', () => {
  let app: any;
  let dbManager: DatabaseManager;
  let eventBus: EventBus;
  let viewManager: ViewManager;
  let authToken: string;

  const testTenant = 'test';
  const testUserId = 'user-test-123';

  beforeAll(async () => {
    // Import app after setting test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'spike_test';
    process.env.JWT_SECRET = 'test-secret';

    const { app: testApp } = await import('../../src/index');
    app = testApp;

    // Initialize services
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    eventBus = EventBus.getInstance();
    await eventBus.initialize();

    viewManager = ViewManager.getInstance();
    await viewManager.initialize();
    await viewManager.createViewsForTenant(testTenant);

    // Create test auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUserId, tenantId: testTenant },
      'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await viewManager.dropViewsForTenant(testTenant);
    await viewManager.shutdown();
    await eventBus.shutdown();
    await dbManager.shutdown();
  });

  beforeEach(async () => {
    // Clean up test data
    await dbManager.executeQuery(testTenant, `
      TRUNCATE TABLE academic_${testTenant}.courses CASCADE;
      TRUNCATE TABLE academic_${testTenant}.assignments CASCADE;
      TRUNCATE TABLE academic_${testTenant}.enrollments CASCADE;
      TRUNCATE TABLE academic_${testTenant}.grades CASCADE;
      TRUNCATE TABLE academic_${testTenant}.events CASCADE;
    `);
  });

  describe('Course Management', () => {
    it('should create a new course', async () => {
      const courseData = {
        code: 'CS-101',
        name: 'Introduction to Computer Science',
        faculty: 'Computer Science',
        academicYear: 2024,
        semester: 'fall',
        credits: 3,
        instructor: 'Dr. Test'
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(courseData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          code: courseData.code,
          name: courseData.name,
          faculty: courseData.faculty,
          tenantId: testTenant
        }
      });

      // Verify course was stored in database
      const dbResult = await dbManager.executeQuery(testTenant,
        `SELECT * FROM academic_${testTenant}.courses WHERE code = $1`,
        [courseData.code]
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].code).toBe(courseData.code);
    });

    it('should retrieve courses for a user', async () => {
      // Create test course and enrollment
      const courseId = 'course-test-123';
      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.courses (id, code, name, faculty, academic_year, semester, credits, tenant_id)
        VALUES ($1, 'CS-101', 'Test Course', 'CS', 2024, 'fall', 3, $2)
      `, [courseId, testTenant]);

      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.enrollments (id, user_id, course_id, status, tenant_id)
        VALUES ($1, $2, $3, 'active', $4)
      `, ['enroll-test-123', testUserId, courseId, testTenant]);

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe('CS-101');
    });

    it('should handle tenant isolation', async () => {
      const otherTenant = 'other';

      // Create course in other tenant
      await dbManager.executeQuery('default', `
        CREATE SCHEMA IF NOT EXISTS academic_${otherTenant}
      `);

      await dbManager.executeQuery('default', `
        CREATE TABLE IF NOT EXISTS academic_${otherTenant}.courses (LIKE academic_${testTenant}.courses INCLUDING ALL)
      `);

      await dbManager.executeQuery('default', `
        INSERT INTO academic_${otherTenant}.courses (id, code, name, faculty, academic_year, semester, credits, tenant_id)
        VALUES ('other-course', 'OTHER-101', 'Other Course', 'Other', 2024, 'fall', 3, $1)
      `, [otherTenant]);

      // Request with test tenant should not see other tenant's courses
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);

      // Cleanup
      await dbManager.executeQuery('default', `DROP SCHEMA IF EXISTS academic_${otherTenant} CASCADE`);
    });
  });

  describe('Assignment Management', () => {
    let courseId: string;

    beforeEach(async () => {
      courseId = 'course-test-assignment';
      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.courses (id, code, name, faculty, academic_year, semester, credits, tenant_id)
        VALUES ($1, 'CS-102', 'Test Course for Assignments', 'CS', 2024, 'fall', 3, $2)
      `, [courseId, testTenant]);

      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.enrollments (id, user_id, course_id, status, tenant_id)
        VALUES ($1, $2, $3, 'active', $4)
      `, ['enroll-assignment-test', testUserId, courseId, testTenant]);
    });

    it('should create an assignment', async () => {
      const assignmentData = {
        courseId,
        title: 'Test Assignment',
        description: 'A test assignment for integration testing',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        weight: 20,
        maxGrade: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(assignmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(assignmentData.title);
      expect(response.body.data.courseId).toBe(courseId);
    });

    it('should get user assignments', async () => {
      // Create test assignment
      const assignmentId = 'assignment-test-123';
      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.assignments (id, course_id, title, status, weight, max_grade, tenant_id)
        VALUES ($1, $2, 'Test Assignment', 'published', 20, 100, $3)
      `, [assignmentId, courseId, testTenant]);

      const response = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Assignment');
    });
  });

  describe('Event Sourcing', () => {
    it('should create domain events when course is created', async () => {
      const courseData = {
        code: 'CS-EVENT',
        name: 'Event Test Course',
        faculty: 'Computer Science',
        academicYear: 2024,
        semester: 'fall',
        credits: 3,
        instructor: 'Dr. Event'
      };

      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(courseData);

      // Check that domain event was created
      const events = await dbManager.executeQuery(testTenant, `
        SELECT * FROM academic_${testTenant}.events
        WHERE event_type = 'course.created'
        ORDER BY event_time DESC
        LIMIT 1
      `);

      expect(events.rows).toHaveLength(1);

      const event = events.rows[0];
      expect(event.event_type).toBe('course.created');
      expect(event.tenant_id).toBe(testTenant);
      expect(event.user_id).toBe(testUserId);

      const eventData = JSON.parse(event.event_data);
      expect(eventData.course.code).toBe(courseData.code);
    });
  });

  describe('CQRS Query Models', () => {
    it('should update materialized views', async () => {
      const courseId = 'course-cqrs-test';
      const assignmentId = 'assignment-cqrs-test';

      // Create test data
      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.courses (id, code, name, faculty, academic_year, semester, credits, tenant_id)
        VALUES ($1, 'CS-CQRS', 'CQRS Test Course', 'CS', 2024, 'fall', 3, $2)
      `, [courseId, testTenant]);

      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.enrollments (id, user_id, course_id, status, tenant_id)
        VALUES ($1, $2, $3, 'active', $4)
      `, ['enroll-cqrs-test', testUserId, courseId, testTenant]);

      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.assignments (id, course_id, title, status, weight, max_grade, tenant_id)
        VALUES ($1, $2, 'CQRS Assignment', 'published', 30, 100, $3)
      `, [assignmentId, courseId, testTenant]);

      await dbManager.executeQuery(testTenant, `
        INSERT INTO academic_${testTenant}.grades (id, user_id, assignment_id, course_id, score, max_score, tenant_id)
        VALUES ($1, $2, $3, $4, 85, 100, $5)
      `, ['grade-cqrs-test', testUserId, assignmentId, courseId, testTenant]);

      // Refresh materialized views
      await viewManager.refreshViewsForTenant(testTenant);

      // Query dashboard summary
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enrolledCourses).toBe(1);
      expect(response.body.data.averageGrade).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authorization', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should handle missing tenant ID', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Tenant identification failed');
    });

    it('should handle invalid tenant in token', async () => {
      const invalidToken = require('jsonwebtoken').sign(
        { userId: testUserId, tenantId: 'invalid' },
        'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${invalidToken}`)
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Tenant access denied');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const coursePromises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/courses')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-ID', testTenant)
          .send({
            code: `PERF-${i}`,
            name: `Performance Test Course ${i}`,
            faculty: 'Computer Science',
            academicYear: 2024,
            semester: 'fall',
            credits: 3,
            instructor: 'Dr. Performance'
          })
      );

      const responses = await Promise.all(coursePromises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all courses were created
      const dbResult = await dbManager.executeQuery(testTenant,
        `SELECT COUNT(*) as count FROM academic_${testTenant}.courses WHERE code LIKE 'PERF-%'`
      );

      expect(parseInt(dbResult.rows[0].count)).toBe(10);
    });
  });
});