import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// ================================================================================================
// 🔧 GLOBAL NEXT.JS MOCKING (BEFORE ANY IMPORTS)
// ================================================================================================

// Mock Next.js server modules globally
vi.mock('next/server', async () => {
  const { NextRequest, NextResponse } = await import('./tests/mocks/next-server.mock');
  return { NextRequest, NextResponse };
});

vi.mock('next/headers', async () => {
  const { headers, cookies, draftMode } = await import('./tests/mocks/next-headers.mock');
  return { headers, cookies, draftMode };
});

// Mock NextAuth globally
vi.mock('next-auth', async () => {
  const mockModule = await import('./tests/mocks/next-auth.mock');
  return mockModule.mockNextAuthModule;
});

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn().mockResolvedValue({
    sub: 'test-user-id',
    email: 'test@post.bgu.ac.il',
    name: 'משתמש בדיקה'
  }),
  encode: vi.fn().mockResolvedValue('mock-jwt-token'),
  decode: vi.fn().mockResolvedValue({ sub: 'test-user-id' })
}));

/**
 * 🌍 GLOBAL TEST SETUP - Spike Academic Platform
 *
 * Global configuration for Hebrew/RTL academic platform testing
 * with comprehensive mocking and environment setup
 */

// ================================================================================================
// 🌍 HEBREW/RTL LOCALE SETUP
// ================================================================================================

// Set Hebrew locale for all tests
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'he-IL',
    languages: ['he-IL', 'he', 'en'],
    userAgent: 'test-agent-hebrew-support',
  },
  writable: true,
});

// Set RTL direction
Object.defineProperty(document, 'dir', {
  value: 'rtl',
  writable: true,
});

// Hebrew date/time locale setup
global.Intl = {
  ...global.Intl,
  DateTimeFormat: class MockDateTimeFormat {
    constructor(locale = 'he-IL', options = {}) {
      return new Intl.DateTimeFormat(locale, options);
    }
  } as any,
};

// ================================================================================================
// 🎓 ACADEMIC PLATFORM ENVIRONMENT SETUP
// ================================================================================================

// Mock academic year and semester (safe environment setup for tests)
vi.stubEnv('ACADEMIC_YEAR', '2024');
vi.stubEnv('CURRENT_SEMESTER', 'א'); // Hebrew first semester
vi.stubEnv('LOCALE', 'he-IL');
vi.stubEnv('TIMEZONE', 'Asia/Jerusalem');
vi.stubEnv('TZ', 'Asia/Jerusalem');

// ================================================================================================
// 🔐 AUTHENTICATION MOCKING
// ================================================================================================

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock NextAuth JWT
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
  encode: vi.fn(),
  decode: vi.fn(),
}));

// ================================================================================================
// 🗄️ SUPABASE MOCKING
// ================================================================================================

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn((tableName) => {
    // Store the inserted data to return it in select/single
    let insertedData = null;

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn((data) => {
        insertedData = Array.isArray(data) ? data[0] : data;
        return mockChain;
      }),
      update: vi.fn((data) => {
        insertedData = { ...insertedData, ...data };
        return mockChain;
      }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      single: vi.fn(() => {
        const resultData = insertedData || { id: `mock-${tableName}-id`, count: 1 };
        return Promise.resolve({ data: resultData, error: null });
      }),
      then: vi.fn((resolve) => {
        const resultData = insertedData ? [insertedData] : [{ id: `mock-${tableName}-id` }];
        return resolve({ data: resultData, error: null });
      }),
    };

    // Make all methods chainable
    Object.keys(mockChain).forEach(key => {
      if (key !== 'single' && key !== 'then' && key !== 'insert' && key !== 'update') {
        mockChain[key].mockImplementation(() => mockChain);
      }
    });

    return mockChain;
  }),
  rpc: vi.fn((functionName, params) => {
    // Mock different RPC functions with appropriate responses
    const mockRpcData = {
      'get_user_credential_status': { status: 'active', has_credentials: true },
      'search_courses_by_name': [{ id: 'mock-course', name: params?.course_name_param || 'מבוא למדעי המחשב' }],
      default: { result: 'mock-rpc-result', function: functionName, params }
    };

    const responseData = mockRpcData[functionName] || mockRpcData.default;
    return Promise.resolve({ data: responseData, error: null });
  }),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// ================================================================================================
// 🔧 SERVICE-ROLE DATABASE MOCKING
// ================================================================================================

// Mock the service-role module to avoid env import issues - all possible paths
vi.mock('apps/web/lib/database/service-role', () => ({
  supabaseAdmin: mockSupabaseClient,
  saveWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: {} }),
  getWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock('../../apps/web/lib/database/service-role', () => ({
  supabaseAdmin: mockSupabaseClient,
  saveWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: {} }),
  getWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock('../../../../lib/database/service-role', () => ({
  supabaseAdmin: mockSupabaseClient,
  saveWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: {} }),
  getWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/database/service-role', () => ({
  supabaseAdmin: mockSupabaseClient,
  saveWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: {} }),
  getWithServiceRole: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

// Mock the env module to avoid import errors - all possible paths
vi.mock('../env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

vi.mock('../../../../lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// ================================================================================================
// 🌐 NEXT.JS MOCKING
// ================================================================================================

// Mock Next.js server module
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url: string, options: any = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
    }
    url: string;
    method: string;
    headers: Map<string, string>;
    clone() { return this; }
    json() { return Promise.resolve({}); }
    formData() { return Promise.resolve(new FormData()); }
  },
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    }),
    next: () => ({
      headers: new Map(),
    }),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// ================================================================================================
// 🎨 COMPONENT MOCKING
// ================================================================================================

// Mock Image component for testing
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Mock Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

// ================================================================================================
// 🌍 GLOBAL MOCKS FOR HEBREW CONTENT
// ================================================================================================

// Mock Hebrew text processing utilities
vi.mock('lib/utils/hebrew', () => ({
  isHebrew: vi.fn((text: string) => /[\u0590-\u05FF]/.test(text)),
  formatHebrewText: vi.fn((text: string) => text),
  getTextDirection: vi.fn((text: string) => (/[\u0590-\u05FF]/.test(text) ? 'rtl' : 'ltr')),
}));

// Mock academic utilities
vi.mock('lib/utils/academic', () => ({
  getCurrentAcademicYear: vi.fn(() => 2024),
  getCurrentSemester: vi.fn(() => 'א'),
  formatGPA: vi.fn((gpa: number) => gpa.toFixed(2)),
  calculateCredits: vi.fn((courses: any[]) => courses.length * 3),
}));

// ================================================================================================
// 🔧 WINDOW AND DOM MOCKING
// ================================================================================================

// Mock window methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ================================================================================================
// 📊 TEST LIFECYCLE HOOKS
// ================================================================================================

// Global setup
beforeAll(() => {
  // Hebrew font loading mock
  Object.defineProperty(document, 'fonts', {
    value: {
      ready: Promise.resolve(),
      load: vi.fn().mockResolvedValue([]),
    },
    writable: true,
  });

  // Mock console methods to reduce noise (if they exist)
  if (console.warn) {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  }
  if (console.error) {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global teardown
afterAll(() => {
  vi.restoreAllMocks();
});

// ================================================================================================
// 🎓 ACADEMIC TEST DATA FACTORIES
// ================================================================================================

// Export test utilities for use in tests
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@bgu.ac.il',
  name: 'בדיקה תלמיד', // Hebrew: Test Student
  university: 'bgu',
  academicYear: 2024,
  semester: 'א',
  ...overrides,
});

export const createMockCourse = (overrides = {}) => ({
  id: 'course-1',
  name: 'מתמטיקה לינארית', // Hebrew: Linear Mathematics
  code: 'MATH-101',
  credits: 3,
  faculty: 'מדעי המחשב', // Hebrew: Computer Science
  semester: 'א',
  year: 2024,
  ...overrides,
});

export const createMockGrade = (overrides = {}) => ({
  id: 'grade-1',
  courseId: 'course-1',
  studentId: 'test-user-id',
  grade: 85,
  credits: 3,
  semester: 'א',
  year: 2024,
  ...overrides,
});

// ================================================================================================
// 🌍 HEBREW LOCALE TEST ENVIRONMENT
// ================================================================================================

// Set up Hebrew testing environment
global.testEnv = {
  locale: 'he-IL',
  direction: 'rtl',
  timezone: 'Asia/Jerusalem',
  academicYear: 2024,
  semester: 'א',
};

console.log('🧪 Vitest setup complete with Hebrew/RTL support for Spike Academic Platform');
