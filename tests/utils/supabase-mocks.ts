/**
 * 🗄️ SUPABASE MOCKS - Spike Academic Platform
 *
 * Mock utilities for Supabase client, database operations,
 * and Hebrew academic data testing
 */

import type {
  PostgrestResponse,
  SupabaseClient,
  User as SupabaseUser,
} from '@supabase/supabase-js';
import { vi } from 'vitest';
import {
  createMockAssignment,
  createMockCourse,
  createMockGrade,
  createMockStudent,
} from './academic-data';

// ================================================================================================
// 🗄️ DATABASE MOCK TYPES
// ================================================================================================

export interface MockDatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface MockAcademicTables {
  students: any[];
  courses: any[];
  grades: any[];
  assignments: any[];
  universities: any[];
  faculties: any[];
  sync_logs: any[];
  user_credentials: any[];
}

// ================================================================================================
// 🎓 MOCK DATABASE SETUP
// ================================================================================================

/**
 * Create mock academic database with Hebrew data
 */
export const createMockAcademicDatabase = (): MockAcademicTables => {
  // Generate realistic Hebrew academic data
  const students = Array.from({ length: 10 }, () => {
    const student = createMockStudent();
    return {
      id: student.id,
      email: student.email,
      first_name: student.firstName,
      last_name: student.lastName,
      first_name_hebrew: student.firstNameHebrew,
      last_name_hebrew: student.lastNameHebrew,
      student_id: student.studentId,
      university_id: student.universityId,
      faculty_id: student.facultyId,
      academic_year: student.year,
      degree: student.degree,
      degree_hebrew: student.degreeHebrew,
      gpa: student.gpa,
      enrollment_date: student.enrollmentDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const courses = Array.from({ length: 20 }, () => {
    const course = createMockCourse();
    return {
      id: course.id,
      name: course.name,
      name_hebrew: course.nameHebrew,
      code: course.code,
      credits: course.credits,
      faculty_id: course.facultyId,
      semester: course.semester,
      academic_year: course.year,
      description: course.description,
      description_hebrew: course.descriptionHebrew,
      instructor_hebrew: course.instructorHebrew,
      prerequisites: course.prerequisites || [],
      schedule: course.schedule || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const grades = Array.from({ length: 50 }, () => {
    const grade = createMockGrade();
    return {
      id: grade.id,
      student_id: grade.studentId,
      course_id: grade.courseId,
      grade: grade.grade,
      credits: grade.credits,
      semester: grade.semester,
      academic_year: grade.year,
      grade_type: grade.type,
      grade_type_hebrew: grade.typeHebrew,
      date_recorded: grade.date.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const assignments = Array.from({ length: 30 }, () => {
    const assignment = createMockAssignment();
    return {
      id: assignment.id,
      course_id: assignment.courseId,
      title: assignment.title,
      title_hebrew: assignment.titleHebrew,
      description: assignment.description,
      description_hebrew: assignment.descriptionHebrew,
      due_date: assignment.dueDate.toISOString(),
      max_grade: assignment.maxGrade,
      weight: assignment.weight,
      assignment_type: assignment.type,
      assignment_type_hebrew: assignment.typeHebrew,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const universities = [
    {
      id: 'bgu',
      name: 'Ben Gurion University of the Negev',
      name_hebrew: 'אוניברסיטת בן גוריון בנגב',
      code: 'bgu',
      domain: 'bgu.ac.il',
      location: 'Beer Sheva',
      location_hebrew: 'באר שבע',
      established: 1969,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tau',
      name: 'Tel Aviv University',
      name_hebrew: 'אוניברסיטת תל אביב',
      code: 'tau',
      domain: 'tau.ac.il',
      location: 'Tel Aviv',
      location_hebrew: 'תל אביב',
      established: 1956,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const faculties = [
    {
      id: 'cs-faculty',
      university_id: 'bgu',
      name: 'Computer Science',
      name_hebrew: 'מדעי המחשב',
      code: 'CS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'math-faculty',
      university_id: 'bgu',
      name: 'Mathematics',
      name_hebrew: 'מתמטיקה',
      code: 'MATH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const sync_logs = [
    {
      id: 'sync-1',
      user_id: students[0].id,
      university_id: 'bgu',
      sync_type: 'moodle',
      status: 'success',
      courses_synced: 5,
      grades_synced: 12,
      assignments_synced: 8,
      started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      completed_at: new Date().toISOString(),
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const user_credentials = [
    {
      id: 'cred-1',
      user_id: students[0].id,
      university_id: 'bgu',
      username_encrypted: 'encrypted_username',
      password_encrypted: 'encrypted_password',
      is_valid: true,
      last_validated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return {
    students,
    courses,
    grades,
    assignments,
    universities,
    faculties,
    sync_logs,
    user_credentials,
  };
};

// ================================================================================================
// 🔍 QUERY BUILDER MOCKS
// ================================================================================================

/**
 * Mock Supabase query builder
 */
export class MockQueryBuilder {
  private data: any[];
  private tableName: string;
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private selectFields = '*';
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private singleResult = false;

  constructor(tableName: string, data: any[]) {
    this.tableName = tableName;
    this.data = data;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = {
      column,
      ascending: options?.ascending ?? true,
    };
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async insert(values: any | any[]): Promise<PostgrestResponse<any>> {
    const insertData = Array.isArray(values) ? values : [values];
    const newRecords = insertData.map((item) => ({
      ...item,
      id: item.id || `mock-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    this.data.push(...newRecords);

    return {
      data: this.singleResult ? newRecords[0] : newRecords,
      error: null,
      count: newRecords.length,
      status: 201,
      statusText: 'Created',
    };
  }

  async update(values: any): Promise<PostgrestResponse<any>> {
    let filteredData = this.applyFilters();
    const updatedRecords = filteredData.map((record) => ({
      ...record,
      ...values,
      updated_at: new Date().toISOString(),
    }));

    // Update original data
    filteredData.forEach((record, index) => {
      const originalIndex = this.data.findIndex((item) => item.id === record.id);
      if (originalIndex >= 0) {
        this.data[originalIndex] = updatedRecords[index];
      }
    });

    return {
      data: this.singleResult ? updatedRecords[0] : updatedRecords,
      error: null,
      count: updatedRecords.length,
      status: 200,
      statusText: 'OK',
    };
  }

  async delete(): Promise<PostgrestResponse<any>> {
    const filteredData = this.applyFilters();
    const deletedRecords = [...filteredData];

    // Remove from original data
    filteredData.forEach((record) => {
      const index = this.data.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        this.data.splice(index, 1);
      }
    });

    return {
      data: this.singleResult ? deletedRecords[0] : deletedRecords,
      error: null,
      count: deletedRecords.length,
      status: 200,
      statusText: 'OK',
    };
  }

  // Simulate async query execution
  then(onFulfilled?: any): Promise<PostgrestResponse<any>> {
    return this.execute().then(onFulfilled);
  }

  private async execute(): Promise<PostgrestResponse<any>> {
    let result = this.applyFilters();

    // Apply ordering
    if (this.orderBy) {
      result.sort((a, b) => {
        const aVal = a[this.orderBy!.column];
        const bVal = b[this.orderBy!.column];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    // Apply limit
    if (this.limitValue !== null) {
      result = result.slice(0, this.limitValue);
    }

    // Handle single result
    if (this.singleResult) {
      return {
        data: result.length > 0 ? result[0] : null,
        error: result.length === 0 ? { message: 'No rows found', code: 'PGRST116' } : null,
        count: result.length,
        status: result.length > 0 ? 200 : 404,
        statusText: result.length > 0 ? 'OK' : 'Not Found',
      };
    }

    return {
      data: result,
      error: null,
      count: result.length,
      status: 200,
      statusText: 'OK',
    };
  }

  private applyFilters(): any[] {
    return this.data.filter((record) => {
      return this.filters.every((filter) => {
        const value = record[filter.column];

        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          case 'like':
            return typeof value === 'string' && value.includes(filter.value.replace(/%/g, ''));
          case 'ilike':
            return (
              typeof value === 'string' &&
              value.toLowerCase().includes(filter.value.replace(/%/g, '').toLowerCase())
            );
          case 'in':
            return filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }
}

// ================================================================================================
// 🔐 AUTH MOCK SETUP
// ================================================================================================

/**
 * Mock Supabase Auth
 */
export const createMockSupabaseAuth = () => {
  const mockUser: SupabaseUser = {
    id: 'mock-user-id',
    email: 'test@bgu.ac.il',
    user_metadata: {
      name: 'בדיקה תלמיד',
      university: 'bgu',
      student_id: '123456789',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),

    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600000, // 1 hour
          expires_in: 3600,
          token_type: 'bearer',
        },
      },
      error: null,
    }),

    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { provider: 'google', url: 'https://mock-oauth-url.com' },
      error: null,
    }),

    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),

    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      // Simulate initial auth state
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: mockUser,
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600000,
          expires_in: 3600,
          token_type: 'bearer',
        });
      }, 100);

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
  };
};

// ================================================================================================
// 🗄️ FULL SUPABASE CLIENT MOCK
// ================================================================================================

/**
 * Create complete mock Supabase client
 */
export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  const mockDatabase = createMockAcademicDatabase();
  const mockAuth = createMockSupabaseAuth();

  return {
    auth: mockAuth,

    from: vi.fn().mockImplementation((table: string) => {
      const tableData = mockDatabase[table as keyof MockAcademicTables] || [];
      return new MockQueryBuilder(table, tableData);
    }),

    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-file-path.pdf' },
          error: null,
        }),

        download: vi.fn().mockResolvedValue({
          data: new Blob(['mock file content'], { type: 'application/pdf' }),
          error: null,
        }),

        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://mock-storage-url.com/file.pdf' },
        }),

        remove: vi.fn().mockResolvedValue({
          data: [{ name: 'file.pdf' }],
          error: null,
        }),
      }),
    },

    rpc: vi.fn().mockImplementation((fnName: string, params = {}) => {
      // Mock common RPC functions
      switch (fnName) {
        case 'calculate_gpa':
          return Promise.resolve({
            data: 85.5,
            error: null,
          });

        case 'get_academic_summary':
          return Promise.resolve({
            data: {
              totalCredits: 45,
              completedCourses: 15,
              currentGPA: 85.5,
              academicYear: 2024,
            },
            error: null,
          });

        case 'sync_moodle_data':
          return Promise.resolve({
            data: {
              coursesAdded: 3,
              gradesUpdated: 7,
              assignmentsAdded: 12,
            },
            error: null,
          });

        default:
          return Promise.resolve({
            data: null,
            error: { message: `Function ${fnName} not found` },
          });
      }
    }),
  };
};

// ================================================================================================
// 🧪 TEST UTILITIES
// ================================================================================================

/**
 * Setup Supabase mocks for testing
 */
export const setupSupabaseMocks = () => {
  const mockClient = createMockSupabaseClient();

  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => mockClient),
  }));

  return mockClient;
};

/**
 * Reset Supabase mocks
 */
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};

/**
 * Add test data to mock database
 */
export const addMockData = (table: string, data: any | any[]) => {
  const mockDatabase = createMockAcademicDatabase();
  const tableData = mockDatabase[table as keyof MockAcademicTables];

  if (tableData) {
    const newData = Array.isArray(data) ? data : [data];
    tableData.push(...newData);
  }
};

/**
 * Clear mock database
 */
export const clearMockDatabase = () => {
  const mockDatabase = createMockAcademicDatabase();
  Object.keys(mockDatabase).forEach((table) => {
    mockDatabase[table as keyof MockAcademicTables] = [];
  });
};

// ================================================================================================
// 📝 USAGE EXAMPLES
// ================================================================================================

/*
// Basic Supabase testing
import { setupSupabaseMocks } from '@/tests/utils/supabase-mocks';

test('fetches student courses', async () => {
  const mockClient = setupSupabaseMocks();

  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('student_id', 'test-student-id');

  expect(data).toHaveLength(5);
  expect(data[0]).toHaveProperty('name_hebrew');
});

// Custom mock data
import { addMockData } from '@/tests/utils/supabase-mocks';

test('handles custom course data', () => {
  addMockData('courses', {
    id: 'custom-course',
    name_hebrew: 'מתמטיקה דיסקרטית',
    credits: 4,
  });

  // Test with custom data
});

// RPC function testing
test('calculates GPA correctly', async () => {
  const mockClient = setupSupabaseMocks();

  const { data } = await supabase.rpc('calculate_gpa', {
    student_id: 'test-student'
  });

  expect(data).toBe(85.5);
});
*/

export {
  addMockData,
  clearMockDatabase,
  createMockAcademicDatabase,
  createMockSupabaseClient,
  MockQueryBuilder,
  resetSupabaseMocks,
  setupSupabaseMocks,
};
