/**
 * 🧪 Comprehensive Supabase Mock Factory
 *
 * Provides complete mock implementation of Supabase client
 * with proper Hebrew content support and realistic responses
 */

import { vi } from 'vitest';

// Mock data for Hebrew academic content
export const MOCK_HEBREW_DATA = {
  universities: [
    { id: 'bgu', name: 'אוניברסיטת בן-גוריון בנגב', city: 'באר שבע' },
    { id: 'tau', name: 'אוניברסיטת תל-אביב', city: 'תל אביב' },
    { id: 'huji', name: 'האוניברסיטה העברית בירושלים', city: 'ירושלים' }
  ],
  courses: [
    {
      id: '1',
      name: 'מבוא למדעי המחשב',
      code: 'CS101',
      faculty: 'מדעי הטבע ומתמטיקה',
      credits: 4,
      semester: 'א',
      academicYear: '2024'
    },
    {
      id: '2',
      name: 'אלגוריתמים מתקדמים',
      code: 'CS201',
      faculty: 'מדעי הטבע ומתמטיקה',
      credits: 3,
      semester: 'ב',
      academicYear: '2024'
    }
  ],
  students: [
    {
      id: 'student1',
      name: 'דן כהן',
      email: 'dan.cohen@post.bgu.ac.il',
      studentId: '123456789',
      university: 'bgu',
      faculty: 'מדעי הטבע ומתמטיקה',
      yearOfStudy: 2
    }
  ],
  assignments: [
    {
      id: '1',
      title: 'מטלה 1 - מבוא לתכנות',
      description: 'פתרון בעיות בסיסיות בתכנות',
      dueDate: '2024-12-31',
      courseId: '1',
      priority: 'high'
    }
  ]
};

// Create a comprehensive mock query builder
export const createMockQueryBuilder = (tableName: string) => {
  const mockData = MOCK_HEBREW_DATA[tableName as keyof typeof MOCK_HEBREW_DATA] || [];

  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: mockData.length,
        status: 200,
        statusText: 'OK'
      }),
      neq: vi.fn().mockResolvedValue({ data: [], error: null }),
      gt: vi.fn().mockResolvedValue({ data: [], error: null }),
      gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      lt: vi.fn().mockResolvedValue({ data: [], error: null }),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      like: vi.fn().mockResolvedValue({ data: mockData.slice(0, 1), error: null }),
      ilike: vi.fn().mockResolvedValue({ data: mockData.slice(0, 1), error: null }),
      in: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      contains: vi.fn().mockResolvedValue({ data: mockData.slice(0, 1), error: null }),
      containedBy: vi.fn().mockResolvedValue({ data: [], error: null }),
      rangeGt: vi.fn().mockResolvedValue({ data: [], error: null }),
      rangeLt: vi.fn().mockResolvedValue({ data: [], error: null }),
      rangeGte: vi.fn().mockResolvedValue({ data: [], error: null }),
      rangeLte: vi.fn().mockResolvedValue({ data: [], error: null }),
      rangeAdjacent: vi.fn().mockResolvedValue({ data: [], error: null }),
      overlaps: vi.fn().mockResolvedValue({ data: [], error: null }),
      textSearch: vi.fn().mockResolvedValue({ data: mockData.slice(0, 1), error: null }),
      match: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      not: vi.fn().mockResolvedValue({ data: [], error: null }),
      or: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      filter: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: mockData.slice(0, 10), error: null })
      }),
      limit: vi.fn().mockResolvedValue({ data: mockData.slice(0, 10), error: null }),
      range: vi.fn().mockResolvedValue({
        data: mockData.slice(0, 5),
        error: null,
        count: mockData.length
      }),
      single: vi.fn().mockResolvedValue({
        data: mockData[0] || null,
        error: null
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: mockData[0] || null,
        error: null
      })
    }),

    insert: vi.fn().mockResolvedValue({
      data: {
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        ...mockData[0]
      },
      error: null,
      status: 201,
      statusText: 'Created'
    }),

    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: {
          id: '1',
          updated_at: new Date().toISOString(),
          ...mockData[0]
        },
        error: null,
        status: 200,
        statusText: 'OK'
      }),
      match: vi.fn().mockResolvedValue({
        data: mockData.map(item => ({
          ...item,
          updated_at: new Date().toISOString()
        })),
        error: null
      })
    }),

    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: mockData[0] || {},
        error: null,
        status: 200,
        statusText: 'OK'
      }),
      match: vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      })
    }),

    upsert: vi.fn().mockResolvedValue({
      data: {
        id: '1',
        updated_at: new Date().toISOString(),
        ...mockData[0]
      },
      error: null,
      status: 200,
      statusText: 'OK'
    })
  };
};

// Create the main Supabase client mock
export const createMockSupabaseClient = () => ({
  from: vi.fn().mockImplementation((tableName: string) =>
    createMockQueryBuilder(tableName)
  ),

  // Mock RPC (Remote Procedure Call) functions
  rpc: vi.fn().mockImplementation((functionName: string, params?: any) => {
    // Return appropriate mock data based on function name
    const mockRpcResults: Record<string, any> = {
      'search_hebrew_courses': {
        data: MOCK_HEBREW_DATA.courses.filter(c =>
          c.name.includes(params?.search_term || '')
        ),
        error: null
      },
      'calculate_gpa': {
        data: { gpa: 3.7, total_credits: 120 },
        error: null
      },
      'get_semester_stats': {
        data: {
          total_courses: 5,
          completed: 3,
          average_grade: 85
        },
        error: null
      },
      'validate_hebrew_input': {
        data: { is_valid: true, message: 'קלט תקין' },
        error: null
      }
    };

    return Promise.resolve(
      mockRpcResults[functionName] || { data: null, error: null }
    );
  }),

  // Mock authentication
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@post.bgu.ac.il',
          app_metadata: {},
          user_metadata: {
            name: 'משתמש בדיקה',
            university: 'bgu',
            student_id: '123456789'
          },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      },
      error: null
    }),

    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-id',
            email: 'test@post.bgu.ac.il'
          }
        }
      },
      error: null
    }),

    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user' }, session: {} },
      error: null
    }),

    signOut: vi.fn().mockResolvedValue({ error: null }),

    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  },

  // Mock storage
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-file.pdf' },
        error: null
      }),
      download: vi.fn().mockResolvedValue({
        data: new Blob(['test content']),
        error: null
      }),
      remove: vi.fn().mockResolvedValue({
        data: [{ name: 'test-file.pdf' }],
        error: null
      }),
      list: vi.fn().mockResolvedValue({
        data: [{ name: 'test-file.pdf', updated_at: new Date().toISOString() }],
        error: null
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://mock-storage-url.com/test-file.pdf' }
      })
    })
  },

  // Mock realtime
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' })
    }),
    unsubscribe: vi.fn().mockResolvedValue({ status: 'CLOSED' })
  }),

  removeChannel: vi.fn().mockResolvedValue({ status: 'ok' }),
  removeAllChannels: vi.fn().mockResolvedValue({ status: 'ok' }),
  getChannels: vi.fn().mockReturnValue([])
});

// Export the mock for use in tests
export const mockSupabaseClient = createMockSupabaseClient();

// Mock the entire @supabase/supabase-js module
export const mockSupabaseModule = {
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
  SupabaseClient: vi.fn().mockImplementation(() => mockSupabaseClient)
};

// Default export
export default mockSupabaseClient;