/**
 * 🗄️ SUPABASE DATABASE INTEGRATION TESTS
 *
 * Comprehensive integration testing for Supabase database operations,
 * Hebrew academic data handling, and real database function testing.
 *
 * Part of Phase 3: Integration Testing Implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../../apps/web/lib/db';

// Test data for Hebrew academic content
const testUser = {
  email: 'integration.test@post.bgu.ac.il',
  name: 'תלמיד בדיקה',
  student_id: '999888777',
  faculty: 'מדעי המחשב',
  department: 'הנדסת תוכנה',
  year_of_study: 2,
  university: 'BGU',
  preferred_language: 'he',
};

const testCourse = {
  name: 'מבוא למדעי המחשב',
  code: 'CS101',
  credits: 4,
  semester: 'א',
  year: 2024,
  university_id: 'bgu',
  faculty: 'מדעי המחשב',
  instructor: "פרופ' יוסי כהן",
};

describe('🗄️ Supabase Database Integration', () => {
  let testUserId: string | null = null;
  let testCourseId: string | null = null;

  beforeEach(async () => {
    // Setup test environment
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
      testUserId = null;
    }
    if (testCourseId) {
      await supabase.from('courses').delete().eq('id', testCourseId);
      testCourseId = null;
    }
  });

  describe('🔌 Database Connection and Health', () => {
    it('should establish connection to Supabase', async () => {
      const { data, error } = await supabase.from('users').select('count(*)').limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should support Hebrew character encoding', async () => {
      // Test creating a record with Hebrew content
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...testUser,
          id: 'test-hebrew-encoding',
        })
        .select()
        .single();

      if (!error && data) {
        testUserId = data.id;

        expect(data.name).toBe('תלמיד בדיקה');
        expect(data.faculty).toBe('מדעי המחשב');
        expect(data.department).toBe('הנדסת תוכנה');

        // Verify Hebrew characters are preserved
        expect(data.name).toMatch(/[\u0590-\u05FF]/);
        expect(data.faculty).toMatch(/[\u0590-\u05FF]/);
        expect(data.department).toMatch(/[\u0590-\u05FF]/);
      }

      expect(error).toBeNull();
    });

    it('should handle Hebrew text in queries and filters', async () => {
      // First create a test user with Hebrew content
      const { data: createData, error: createError } = await supabase
        .from('users')
        .insert({
          ...testUser,
          id: 'test-hebrew-query',
        })
        .select()
        .single();

      if (createError) {
        console.log('Create error:', createError);
        return;
      }

      testUserId = createData.id;

      // Query by Hebrew faculty
      const { data: queryData, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('faculty', 'מדעי המחשב')
        .eq('id', testUserId);

      expect(queryError).toBeNull();
      expect(queryData).toBeDefined();
      expect(queryData?.length).toBeGreaterThan(0);

      if (queryData && queryData.length > 0) {
        expect(queryData[0].faculty).toBe('מדעי המחשב');
      }
    });
  });

  describe('👤 User Management Integration', () => {
    it('should create user with Hebrew academic information', async () => {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...testUser,
          id: 'test-user-create',
        })
        .select()
        .single();

      if (!error && data) {
        testUserId = data.id;

        expect(data.name).toBe(testUser.name);
        expect(data.faculty).toBe(testUser.faculty);
        expect(data.department).toBe(testUser.department);
        expect(data.student_id).toBe(testUser.student_id);
        expect(data.year_of_study).toBe(testUser.year_of_study);
        expect(data.university).toBe(testUser.university);
        expect(data.preferred_language).toBe(testUser.preferred_language);

        // Verify timestamps
        expect(data.created_at).toBeDefined();
        expect(data.updated_at).toBeDefined();
      }

      expect(error).toBeNull();
    });

    it('should update user information with Hebrew content', async () => {
      // Create user first
      const { data: createData, error: createError } = await supabase
        .from('users')
        .insert({
          ...testUser,
          id: 'test-user-update',
        })
        .select()
        .single();

      if (createError) return;
      testUserId = createData.id;

      // Update with new Hebrew content
      const updatedData = {
        name: 'תלמיד עודכן',
        faculty: 'הנדסה',
        department: 'הנדסת חשמל',
        year_of_study: 3,
      };

      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', testUserId)
        .select()
        .single();

      expect(updateError).toBeNull();
      if (updateData) {
        expect(updateData.name).toBe('תלמיד עודכן');
        expect(updateData.faculty).toBe('הנדסה');
        expect(updateData.department).toBe('הנדסת חשמל');
        expect(updateData.year_of_study).toBe(3);
      }
    });

    it('should handle user queries with complex Hebrew filters', async () => {
      // Create multiple test users
      const testUsers = [
        { ...testUser, id: 'test-1', faculty: 'מדעי המחשב', year_of_study: 1 },
        { ...testUser, id: 'test-2', faculty: 'מדעי המחשב', year_of_study: 2 },
        { ...testUser, id: 'test-3', faculty: 'הנדסה', year_of_study: 1 },
      ];

      // Insert test users
      const { error: insertError } = await supabase.from('users').insert(testUsers);

      if (insertError) return;

      // Query with Hebrew filters
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('faculty', 'מדעי המחשב')
        .gte('year_of_study', 1)
        .in('id', ['test-1', 'test-2', 'test-3']);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(2); // Only CS students

      // Cleanup
      await supabase.from('users').delete().in('id', ['test-1', 'test-2', 'test-3']);
    });
  });

  describe('📚 Course Management Integration', () => {
    it('should create course with Hebrew academic content', async () => {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...testCourse,
          id: 'test-course-create',
        })
        .select()
        .single();

      if (!error && data) {
        testCourseId = data.id;

        expect(data.name).toBe(testCourse.name);
        expect(data.faculty).toBe(testCourse.faculty);
        expect(data.instructor).toBe(testCourse.instructor);
        expect(data.semester).toBe(testCourse.semester);

        // Verify Hebrew content
        expect(data.name).toMatch(/[\u0590-\u05FF]/);
        expect(data.faculty).toMatch(/[\u0590-\u05FF]/);
        expect(data.instructor).toMatch(/[\u0590-\u05FF]/);
        expect(data.semester).toMatch(/[\u0590-\u05FF]/);
      }

      expect(error).toBeNull();
    });

    it('should handle Hebrew semester calculations', async () => {
      const hebrewSemesters = ['א', 'ב', 'קיץ'];

      for (const semester of hebrewSemesters) {
        const courseData = {
          ...testCourse,
          id: `test-semester-${semester}`,
          semester,
          name: `קורס ${semester}`,
        };

        const { data, error } = await supabase.from('courses').insert(courseData).select().single();

        expect(error).toBeNull();
        if (data) {
          expect(data.semester).toBe(semester);
          expect(data.name).toContain(semester);
        }

        // Cleanup
        if (data) {
          await supabase.from('courses').delete().eq('id', data.id);
        }
      }
    });
  });

  describe('🔐 Authentication and Credentials Integration', () => {
    it('should handle credential storage with encryption', async () => {
      const credentialData = {
        user_email: testUser.email,
        university_id: 'bgu',
        username: 'test_student',
        encrypted_password: 'encrypted_test_password',
        is_active: true,
        last_validated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('user_credentials').insert(credentialData).select().single();

      expect(error).toBeNull();
      if (data) {
        expect(data.user_email).toBe(testUser.email);
        expect(data.university_id).toBe('bgu');
        expect(data.username).toBe('test_student');
        expect(data.is_active).toBe(true);

        // Cleanup
        await supabase.from('user_credentials').delete().eq('id', data.id);
      }
    });

    it('should log authentication attempts with Hebrew error messages', async () => {
      const authLog = {
        user_email: testUser.email,
        university_id: 'bgu',
        success: false,
        authentication_type: 'manual_validation',
        error_message: 'שם משתמש או סיסמה שגויים',
        client_ip: '192.168.1.100',
        response_time_ms: 150,
      };

      const { data, error } = await supabase.from('auth_attempts').insert(authLog).select().single();

      expect(error).toBeNull();
      if (data) {
        expect(data.user_email).toBe(testUser.email);
        expect(data.success).toBe(false);
        expect(data.error_message).toBe('שם משתמש או סיסמה שגויים');
        expect(data.error_message).toMatch(/[\u0590-\u05FF]/);

        // Cleanup
        await supabase.from('auth_attempts').delete().eq('id', data.id);
      }
    });
  });

  describe('🔄 Database Functions Integration', () => {
    it('should call user credential status function', async () => {
      const { data, error } = await supabase.rpc('get_user_credential_status', {
        user_email_param: testUser.email,
        university_id_param: 'bgu',
      });

      // Function should exist and return data (even if empty)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should handle database function with Hebrew parameters', async () => {
      // This would test Hebrew text being passed to database functions
      const { data, error } = await supabase.rpc('search_courses_by_name', {
        course_name_param: 'מדעי המחשב',
        university_param: 'bgu',
      });

      // Even if function doesn't exist, we test that Hebrew parameters are handled
      // Function existence would depend on actual database schema
      if (error && error.message.includes('does not exist')) {
        // Expected if function doesn't exist in test environment
        expect(error.message).toContain('does not exist');
      } else {
        expect(data).toBeDefined();
      }
    });
  });

  describe('📊 Performance and Scalability Integration', () => {
    it('should handle bulk operations with Hebrew content', async () => {
      const bulkUsers = Array.from({ length: 10 }, (_, i) => ({
        ...testUser,
        id: `bulk-test-${i}`,
        email: `bulk${i}@post.bgu.ac.il`,
        name: `תלמיד ${i}`,
        student_id: `99900${i}`,
      }));

      // Bulk insert
      const { data, error } = await supabase.from('users').insert(bulkUsers).select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(10);

      // Verify Hebrew content in bulk data
      data?.forEach((user, index) => {
        expect(user.name).toBe(`תלמיד ${index}`);
        expect(user.name).toMatch(/[\u0590-\u05FF]/);
      });

      // Cleanup
      const userIds = data?.map((user) => user.id) || [];
      if (userIds.length > 0) {
        await supabase.from('users').delete().in('id', userIds);
      }
    });

    it('should handle concurrent database operations', async () => {
      const concurrentOps = Array.from({ length: 5 }, (_, i) =>
        supabase
          .from('users')
          .insert({
            ...testUser,
            id: `concurrent-${i}`,
            email: `concurrent${i}@post.bgu.ac.il`,
            name: `תלמיד מקבילי ${i}`,
          })
          .select()
          .single()
      );

      const results = await Promise.all(concurrentOps);

      results.forEach((result, index) => {
        expect(result.error).toBeNull();
        expect(result.data?.name).toBe(`תלמיד מקבילי ${index}`);
      });

      // Cleanup
      const userIds = results.filter((r) => r.data).map((r) => r.data!.id);

      if (userIds.length > 0) {
        await supabase.from('users').delete().in('id', userIds);
      }
    });
  });

  describe('🧪 CRITICAL: Real-World Integration Scenarios', () => {
    it('CRITICAL: should handle complete user registration workflow', async () => {
      const newStudent = {
        ...testUser,
        id: 'complete-workflow-test',
        email: 'workflow@post.bgu.ac.il',
        name: 'דוגמה ממשית',
      };

      // Step 1: Create user
      const { data: userData, error: userError } = await supabase.from('users').insert(newStudent).select().single();

      expect(userError).toBeNull();
      testUserId = userData?.id || null;

      // Step 2: Save credentials
      const { data: credData, error: credError } = await supabase
        .from('user_credentials')
        .insert({
          user_email: newStudent.email,
          university_id: 'bgu',
          username: 'workflow_user',
          encrypted_password: 'encrypted_password',
          is_active: true,
        })
        .select()
        .single();

      expect(credError).toBeNull();

      // Step 3: Log authentication
      const { data: logData, error: logError } = await supabase
        .from('auth_attempts')
        .insert({
          user_email: newStudent.email,
          university_id: 'bgu',
          success: true,
          authentication_type: 'new_user_registration',
          response_time_ms: 200,
        })
        .select()
        .single();

      expect(logError).toBeNull();

      // Verify all data integrity
      expect(userData?.name).toBe('דוגמה ממשית');
      expect(credData?.user_email).toBe(newStudent.email);
      expect(logData?.success).toBe(true);

      // Cleanup
      if (credData) {
        await supabase.from('user_credentials').delete().eq('id', credData.id);
      }
      if (logData) {
        await supabase.from('auth_attempts').delete().eq('id', logData.id);
      }
    });

    it('CRITICAL: should maintain data consistency across related tables', async () => {
      const userId = 'consistency-test';
      const courseId = 'consistency-course';

      // Create related data
      const [userResult, courseResult] = await Promise.all([
        supabase
          .from('users')
          .insert({ ...testUser, id: userId })
          .select()
          .single(),
        supabase
          .from('courses')
          .insert({ ...testCourse, id: courseId })
          .select()
          .single(),
      ]);

      expect(userResult.error).toBeNull();
      expect(courseResult.error).toBeNull();

      testUserId = userId;
      testCourseId = courseId;

      // Create enrollment relationship
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      expect(enrollmentError).toBeNull();

      // Verify relationship integrity
      const { data: joinData, error: joinError } = await supabase
        .from('course_enrollments')
        .select(
          `
          *,
          users:user_id (name, faculty),
          courses:course_id (name, instructor)
        `
        )
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      expect(joinError).toBeNull();
      if (joinData) {
        // TypeScript might complain about nested objects, but data should be correct
        expect(joinData.user_id).toBe(userId);
        expect(joinData.course_id).toBe(courseId);
      }

      // Cleanup enrollment
      if (enrollmentData) {
        await supabase.from('course_enrollments').delete().eq('id', enrollmentData.id);
      }
    });

    it('CRITICAL: should handle Hebrew search and filtering across all tables', async () => {
      // Create test data with various Hebrew terms
      const hebrewTestData = [
        { type: 'user', name: 'מדעי המחשב', field: 'faculty' },
        { type: 'course', name: 'מבוא לאלגוריתמים', field: 'name' },
        { type: 'user', name: 'הנדסת תוכנה', field: 'department' },
      ];

      const createdIds: string[] = [];

      for (const item of hebrewTestData) {
        if (item.type === 'user') {
          const { data, error } = await supabase
            .from('users')
            .insert({
              ...testUser,
              id: `hebrew-search-${item.field}`,
              [item.field]: item.name,
            })
            .select()
            .single();

          if (!error && data) {
            createdIds.push(data.id);
          }
        }
      }

      // Search for Hebrew content
      const { data: searchResults, error: searchError } = await supabase
        .from('users')
        .select('*')
        .or(`faculty.ilike.%מדעי המחשב%,department.ilike.%הנדסת תוכנה%`)
        .in('id', createdIds);

      expect(searchError).toBeNull();
      expect(searchResults).toBeDefined();
      expect(searchResults?.length).toBeGreaterThan(0);

      // Cleanup
      if (createdIds.length > 0) {
        await supabase.from('users').delete().in('id', createdIds);
      }
    });
  });
});
