/**
 * 🔐 AUTHENTICATION MOCKS - Spike Academic Platform
 *
 * Mock utilities for NextAuth.js, university authentication,
 * and Hebrew academic session testing
 */

import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { vi } from 'vitest';
import { createMockAuthUser, createMockStudent } from './academic-data';

// ================================================================================================
// 🎓 UNIVERSITY AUTHENTICATION TYPES
// ================================================================================================

export interface UniversityCredentials {
  university: 'bgu' | 'tau' | 'huji' | 'technion' | 'weizmann';
  username: string;
  password: string;
  studentId?: string;
  faculty?: string;
}

export interface HebrewSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    nameHebrew?: string;
    image?: string;
    university?: string;
    studentId?: string;
    faculty?: string;
    academicYear?: number;
    semester?: 'א' | 'ב' | 'קיץ';
    locale?: string;
  };
  universityCredentials?: {
    university: string;
    hasCredentials: boolean;
    lastSync?: Date;
  };
  expires: string;
}

// ================================================================================================
// 🔐 NEXTAUTH MOCK UTILITIES
// ================================================================================================

/**
 * Create mock NextAuth session with Hebrew support
 */
export const createMockSession = (overrides: Partial<HebrewSession> = {}): HebrewSession => {
  const mockStudent = createMockStudent();
  const mockAuthUser = createMockAuthUser();

  const defaultSession: HebrewSession = {
    user: {
      id: mockAuthUser.id || mockStudent.id,
      email: mockAuthUser.email || mockStudent.email,
      name: mockAuthUser.name || `${mockStudent.firstNameHebrew} ${mockStudent.lastNameHebrew}`,
      nameHebrew: `${mockStudent.firstNameHebrew} ${mockStudent.lastNameHebrew}`,
      image: mockAuthUser.image,
      university: mockStudent.universityId,
      studentId: mockStudent.studentId,
      faculty: mockStudent.facultyId,
      academicYear: 2024,
      semester: 'א',
      locale: 'he-IL',
    },
    universityCredentials: {
      university: mockStudent.universityId,
      hasCredentials: true,
      lastSync: new Date(),
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };

  return { ...defaultSession, ...overrides };
};

/**
 * Create mock JWT token
 */
export const createMockJWT = (overrides: Partial<JWT> = {}): JWT => {
  const session = createMockSession();

  const defaultJWT: JWT = {
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
    nameHebrew: session.user.nameHebrew,
    university: session.user.university,
    studentId: session.user.studentId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    jti: `mock-jwt-${Date.now()}`,
  };

  return { ...defaultJWT, ...overrides };
};

/**
 * Create university-specific session
 */
export const createUniversitySession = (
  university: 'bgu' | 'tau' | 'huji' = 'bgu',
  overrides: Partial<HebrewSession> = {}
): HebrewSession => {
  const universityData = {
    bgu: {
      name: 'בדיקה תלמיד',
      email: 'test@bgu.ac.il',
      university: 'bgu',
    },
    tau: {
      name: 'תלמיד בדיקה',
      email: 'test@tau.ac.il',
      university: 'tau',
    },
    huji: {
      name: 'בוחן סטודנט',
      email: 'test@huji.ac.il',
      university: 'huji',
    },
  };

  const universityConfig = universityData[university];

  return createMockSession({
    user: {
      ...universityConfig,
      university,
    },
    ...overrides,
  });
};

// ================================================================================================
// 🎯 MOCK FUNCTIONS SETUP
// ================================================================================================

/**
 * Mock useSession hook
 */
export const mockUseSession = (
  session: HebrewSession | null = null,
  status: 'authenticated' | 'unauthenticated' | 'loading' = 'unauthenticated'
) => {
  return vi.fn(() => ({
    data: session,
    status,
    update: vi.fn(),
  }));
};

/**
 * Mock getSession function
 */
export const mockGetSession = (session: HebrewSession | null = null) => {
  return vi.fn().mockResolvedValue(session);
};

/**
 * Mock signIn function
 */
export const mockSignIn = (
  mockResult: { ok: boolean; error?: string; url?: string } = { ok: true }
) => {
  return vi.fn().mockResolvedValue(mockResult);
};

/**
 * Mock signOut function
 */
export const mockSignOut = (mockResult: { ok: boolean; url?: string } = { ok: true }) => {
  return vi.fn().mockResolvedValue(mockResult);
};

/**
 * Mock getToken function for JWT
 */
export const mockGetToken = (token: JWT | null = null) => {
  return vi.fn().mockResolvedValue(token);
};

// ================================================================================================
// 🏛️ UNIVERSITY CREDENTIAL MOCKS
// ================================================================================================

/**
 * Create mock university credentials
 */
export const createMockUniversityCredentials = (
  university: 'bgu' | 'tau' | 'huji' = 'bgu',
  overrides: Partial<UniversityCredentials> = {}
): UniversityCredentials => {
  const universityDefaults = {
    bgu: {
      username: 'testuser',
      password: 'TestPassword123!',
      studentId: '123456789',
      faculty: 'Computer Science',
    },
    tau: {
      username: 'tauuser',
      password: 'TAUPassword123!',
      studentId: '987654321',
      faculty: 'Engineering',
    },
    huji: {
      username: 'hujiuser',
      password: 'HUJIPassword123!',
      studentId: '456789123',
      faculty: 'Mathematics',
    },
  };

  return {
    university,
    ...universityDefaults[university],
    ...overrides,
  };
};

/**
 * Mock university authentication API
 */
export const mockUniversityAuth = {
  validateCredentials: vi.fn().mockResolvedValue({
    valid: true,
    studentData: createMockStudent(),
  }),

  syncWithMoodle: vi.fn().mockResolvedValue({
    success: true,
    coursesFound: 5,
    gradesUpdated: 3,
    lastSync: new Date(),
  }),

  getStudentInfo: vi.fn().mockResolvedValue({
    id: '123456789',
    name: 'בדיקה תלמיד',
    email: 'test@bgu.ac.il',
    faculty: 'מדעי המחשב',
    year: 3,
    status: 'active',
  }),
};

// ================================================================================================
// 🧪 TEST AUTHENTICATION SCENARIOS
// ================================================================================================

/**
 * Authentication test scenarios
 */
export const AuthTestScenarios = {
  // No authentication
  unauthenticated: {
    session: null,
    status: 'unauthenticated' as const,
  },

  // Loading state
  loading: {
    session: null,
    status: 'loading' as const,
  },

  // BGU student
  bguStudent: {
    session: createUniversitySession('bgu'),
    status: 'authenticated' as const,
  },

  // TAU student
  tauStudent: {
    session: createUniversitySession('tau'),
    status: 'authenticated' as const,
  },

  // Hebrew University student
  hujiStudent: {
    session: createUniversitySession('huji'),
    status: 'authenticated' as const,
  },

  // Student without university credentials
  noCredentials: {
    session: createMockSession({
      universityCredentials: {
        university: 'bgu',
        hasCredentials: false,
      },
    }),
    status: 'authenticated' as const,
  },

  // Session about to expire
  expiringSoon: {
    session: createMockSession({
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    }),
    status: 'authenticated' as const,
  },

  // Admin user
  admin: {
    session: createMockSession({
      user: {
        id: 'admin-user',
        email: 'admin@bgu.ac.il',
        name: 'מנהל מערכת',
        nameHebrew: 'מנהל מערכת',
        university: 'bgu',
        role: 'admin',
      },
    }),
    status: 'authenticated' as const,
  },
};

// ================================================================================================
// 🎯 MOCK PROVIDERS SETUP
// ================================================================================================

/**
 * Setup NextAuth mocks for testing
 */
export const setupNextAuthMocks = (
  scenario: keyof typeof AuthTestScenarios = 'unauthenticated'
) => {
  const { session, status } = AuthTestScenarios[scenario];

  // Mock useSession
  vi.mock('next-auth/react', () => ({
    useSession: mockUseSession(session, status),
    signIn: mockSignIn(),
    signOut: mockSignOut(),
    getSession: mockGetSession(session),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  // Mock JWT functions
  vi.mock('next-auth/jwt', () => ({
    getToken: mockGetToken(session ? createMockJWT({ sub: session.user.id }) : null),
    encode: vi.fn(),
    decode: vi.fn(),
  }));

  return { session, status };
};

/**
 * Setup university authentication mocks
 */
export const setupUniversityMocks = (university: 'bgu' | 'tau' | 'huji' = 'bgu') => {
  const credentials = createMockUniversityCredentials(university);

  // Mock university API endpoints
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/auth/university/validate')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            studentData: createMockStudent({ universityId: university }),
          }),
      });
    }

    if (url.includes('/api/university/sync')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            coursesFound: 5,
            gradesUpdated: 3,
            lastSync: new Date(),
          }),
      });
    }

    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    });
  });

  return { credentials, university };
};

// ================================================================================================
// 🧹 CLEANUP UTILITIES
// ================================================================================================

/**
 * Reset all authentication mocks
 */
export const resetAuthMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();

  // Reset global fetch if it was mocked
  if (vi.isMockFunction(global.fetch)) {
    vi.restoreAllMocks();
  }
};

/**
 * Clear session storage
 */
export const clearSessionStorage = () => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.clear();
    window.localStorage.clear();
  }
};

// ================================================================================================
// 📝 USAGE EXAMPLES
// ================================================================================================

/*
// Basic authentication testing
import { setupNextAuthMocks, AuthTestScenarios } from '@/tests/utils/auth-mocks';

test('renders for authenticated BGU student', () => {
  setupNextAuthMocks('bguStudent');

  render(<ProtectedComponent />);
  expect(screen.getByText('ברוך הבא')).toBeInTheDocument();
});

// Custom session testing
import { createUniversitySession } from '@/tests/utils/auth-mocks';

test('displays university-specific content', () => {
  const session = createUniversitySession('bgu', {
    user: { name: 'דוד כהן' }
  });

  render(<Dashboard />, {
    session,
  });
});

// JWT testing
import { createMockJWT, mockGetToken } from '@/tests/utils/auth-mocks';

test('validates JWT token', async () => {
  const token = createMockJWT({ university: 'bgu' });
  mockGetToken(token);

  const result = await validateToken();
  expect(result.valid).toBe(true);
});
*/

export {
  AuthTestScenarios,
  clearSessionStorage,
  createMockJWT,
  createMockSession,
  createUniversitySession,
  resetAuthMocks,
  setupNextAuthMocks,
  setupUniversityMocks,
};
