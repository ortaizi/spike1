/**
 * 🧪 NextAuth Mock Factory for Testing
 *
 * Provides comprehensive mock implementation of NextAuth
 * with Hebrew/academic user data and realistic session handling
 */

import { vi } from 'vitest';

// Mock user data for Hebrew academic platform
export const MOCK_AUTH_DATA = {
  users: {
    authenticated: {
      id: 'auth-user-123',
      name: 'דן כהן',
      email: 'dan.cohen@post.bgu.ac.il',
      image: 'https://example.com/avatar.jpg',
      studentId: '123456789',
      universityId: 'bgu',
      universityName: 'אוניברסיטת בן-גוריון בנגב',
      faculty: 'מדעי הטבע ומתמטיקה',
      department: 'מדעי המחשב',
      yearOfStudy: 2,
      academicYear: '2024',
      semester: 'א',
      provider: 'dual-stage-complete',
      isDualStageComplete: true,
      lastSync: new Date().toISOString(),
      moodleData: {
        courses: [
          {
            id: 'cs101',
            name: 'מבוא למדעי המחשב',
            code: 'CS101',
            semester: 'א',
            grade: 88,
            assignments: [
              {
                id: '1',
                title: 'מטלה 1',
                dueDate: '2024-12-31',
                grade: 90
              }
            ]
          }
        ],
        profile: {
          fullName: 'דן כהן',
          hebrewName: 'דן כהן',
          email: 'dan.cohen@post.bgu.ac.il',
          phone: '050-1234567'
        }
      }
    },
    unauthenticated: null,
    newUser: {
      id: 'new-user-456',
      name: 'רחל לוי',
      email: 'rachel.levy@post.bgu.ac.il',
      studentId: '987654321',
      universityId: 'bgu',
      isDualStageComplete: false,
      provider: 'google'
    }
  },
  sessions: {
    valid: {
      user: {
        id: 'auth-user-123',
        name: 'דן כהן',
        email: 'dan.cohen@post.bgu.ac.il',
        image: 'https://example.com/avatar.jpg',
        studentId: '123456789',
        universityId: 'bgu',
        provider: 'dual-stage-complete'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      sessionToken: 'mock-session-token-123',
      userId: 'auth-user-123'
    },
    expired: null,
    invalid: null
  }
};

// Mock getServerSession function
export const mockGetServerSession = vi.fn().mockImplementation((authOptions?: any) => {
  // Return different session states based on test context
  const testContext = globalThis.__TEST_CONTEXT__ || 'authenticated';

  switch (testContext) {
    case 'authenticated':
      return Promise.resolve(MOCK_AUTH_DATA.sessions.valid);
    case 'unauthenticated':
      return Promise.resolve(null);
    case 'new-user':
      return Promise.resolve({
        ...MOCK_AUTH_DATA.sessions.valid,
        user: MOCK_AUTH_DATA.users.newUser
      });
    case 'expired':
      return Promise.resolve({
        ...MOCK_AUTH_DATA.sessions.valid,
        expires: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      });
    default:
      return Promise.resolve(MOCK_AUTH_DATA.sessions.valid);
  }
});

// Mock useSession hook for client-side
export const mockUseSession = vi.fn().mockImplementation(() => {
  const testContext = globalThis.__TEST_CONTEXT__ || 'authenticated';

  switch (testContext) {
    case 'authenticated':
      return {
        data: MOCK_AUTH_DATA.sessions.valid,
        status: 'authenticated',
        update: vi.fn(),
      };
    case 'loading':
      return {
        data: null,
        status: 'loading',
        update: vi.fn(),
      };
    case 'unauthenticated':
      return {
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      };
    default:
      return {
        data: MOCK_AUTH_DATA.sessions.valid,
        status: 'authenticated',
        update: vi.fn(),
      };
  }
});

// Mock signIn function
export const mockSignIn = vi.fn().mockImplementation(async (provider, options) => {
  if (provider === 'credentials') {
    return {
      error: null,
      status: 200,
      ok: true,
      url: 'http://localhost:3000/dashboard'
    };
  }

  if (provider === 'google') {
    return {
      error: null,
      status: 200,
      ok: true,
      url: 'http://localhost:3000/onboarding'
    };
  }

  return {
    error: 'Unsupported provider',
    status: 400,
    ok: false,
    url: null
  };
});

// Mock signOut function
export const mockSignOut = vi.fn().mockImplementation(async (options) => {
  return {
    error: null,
    status: 200,
    ok: true,
    url: options?.callbackUrl || 'http://localhost:3000'
  };
});

// Mock SessionProvider component
export const mockSessionProvider = vi.fn().mockImplementation(({ children, session }) => {
  return children;
});

// Mock getCsrfToken function
export const mockGetCsrfToken = vi.fn().mockResolvedValue('mock-csrf-token-123');

// Mock getProviders function
export const mockGetProviders = vi.fn().mockResolvedValue({
  google: {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    signinUrl: '/api/auth/signin/google',
    callbackUrl: '/api/auth/callback/google'
  },
  credentials: {
    id: 'credentials',
    name: 'BGU Credentials',
    type: 'credentials',
    signinUrl: '/api/auth/signin/credentials',
    callbackUrl: '/api/auth/callback/credentials'
  }
});

// Helper function to set test context
export const setAuthTestContext = (context: string) => {
  globalThis.__TEST_CONTEXT__ = context;
};

// Helper function to reset mocks
export const resetAuthMocks = () => {
  vi.clearAllMocks();
  globalThis.__TEST_CONTEXT__ = 'authenticated';
};

// Mock the entire next-auth module
export const mockNextAuthModule = {
  getServerSession: mockGetServerSession,
  useSession: mockUseSession,
  signIn: mockSignIn,
  signOut: mockSignOut,
  SessionProvider: mockSessionProvider,
  getCsrfToken: mockGetCsrfToken,
  getProviders: mockGetProviders,
  // Mock NextAuth default export
  default: vi.fn().mockImplementation((req, res, options) => {
    // Mock the NextAuth handler
    return {
      providers: options.providers || [],
      callbacks: options.callbacks || {},
      pages: options.pages || {},
      session: { strategy: 'jwt' },
      jwt: { secret: 'test-secret' }
    };
  })
};

// Mock JWT utilities
export const mockJWT = {
  encode: vi.fn().mockResolvedValue('mock-encoded-jwt'),
  decode: vi.fn().mockResolvedValue({
    sub: 'auth-user-123',
    email: 'dan.cohen@post.bgu.ac.il',
    name: 'דן כהן',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  getToken: vi.fn().mockResolvedValue({
    sub: 'auth-user-123',
    email: 'dan.cohen@post.bgu.ac.il',
    name: 'דן כהן',
    universityId: 'bgu',
    provider: 'dual-stage-complete'
  })
};

// Default export
export default mockNextAuthModule;