/**
 * 🎓 ONBOARDING API LOGIC TESTS
 *
 * Unit tests for Hebrew academic platform onboarding API
 * Tests user creation, university validation, and credential management
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ================================================================================================
// 🔧 MOCK SETUP (MUST BE FIRST - BEFORE ANY IMPORTS)
// ================================================================================================

// Mock Next.js modules first to prevent import issues
vi.mock('next/server', async () => {
  const { NextRequest, NextResponse } = await import('../mocks/next-server.mock');
  return { NextRequest, NextResponse };
});

// Import mock factories after mocking the modules
import { mockNextAuthModule } from '../mocks/next-auth.mock';
import { mockSupabaseClient } from '../mocks/supabase.mock';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextAuth with factory
vi.mock('next-auth', () => mockNextAuthModule);

// Mock environment variables
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/env.ts', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Mock unified auth options
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/auth/unified-auth.ts', () => ({
  unifiedAuthOptions: {},
}));

// Mock Supabase admin client with comprehensive factory
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/database/service-role.ts', () => ({
  supabaseAdmin: mockSupabaseClient,
}));

// Mock the problematic CSRF protection file directly
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts', () => ({
  csrfProtection: vi.fn().mockImplementation((req, res, next) => next()),
  validateCsrfToken: vi.fn().mockReturnValue(true),
  generateCsrfToken: vi.fn().mockReturnValue('mock-csrf-token'),
  rateLimit: vi.fn().mockImplementation((req, res, next) => next()),
}));

// Mock university utils
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/university-utils.ts', () => ({
  extractDataFromEmail: vi.fn(),
}));

// Mock CSRF protection - both absolute and relative paths
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts', () => ({
  csrfProtection: vi.fn().mockResolvedValue(null),
  rateLimit: vi.fn().mockReturnValue(vi.fn().mockResolvedValue(null)),
  validateOrigin: vi.fn().mockReturnValue(true),
  validateCsrfToken: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../../lib/security/csrf-protection', () => ({
  csrfProtection: vi.fn().mockResolvedValue(null),
  rateLimit: vi.fn().mockReturnValue(vi.fn().mockResolvedValue(null)),
  validateOrigin: vi.fn().mockReturnValue(true),
  validateCsrfToken: vi.fn().mockResolvedValue(true),
}));

// Mock Zod for schema validation
vi.mock('zod', () => ({
  z: {
    object: vi.fn(() => ({
      parse: vi.fn(),
    })),
    boolean: vi.fn(() => ({
      default: vi.fn(),
      optional: vi.fn(),
    })),
    string: vi.fn(() => ({
      optional: vi.fn(),
    })),
  },
}));

// Mock the env module at the exact relative path that service-role.ts imports
vi.mock('../../../../lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Mock the service-role module at the exact relative path that route.ts imports
vi.mock('../../../../lib/database/service-role', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock console to reduce test noise
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};
global.console = mockConsole as any;

// ================================================================================================
// 📦 IMPORT API ROUTES
// ================================================================================================

// Import API routes
import { GET, PATCH, POST } from '/Users/ortaizi/Desktop/spike1-1/apps/web/app/api/user/onboarding/route.ts';

// ================================================================================================
// 🧪 TEST UTILITIES
// ================================================================================================

/**
 * Create mock NextRequest for API testing
 */
const createMockRequest = (body?: any, headers: Record<string, string> = {}): NextRequest => {
  const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Mock request.json() method
  (request as any).json = vi.fn().mockResolvedValue(body || {});

  return request;
};

/**
 * Create mock session for different auth scenarios
 */
const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@bgu.ac.il',
    name: 'בדיקה תלמיד',
    ...overrides,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Create mock university data
 */
const createMockUniversityData = (overrides = {}) => ({
  isValidUniversityEmail: true,
  university: {
    id: 'bgu',
    nameHe: 'אוניברסיטת בן גוריון בנגב',
    nameEn: 'Ben Gurion University of the Negev',
    domain: 'bgu.ac.il',
  },
  username: 'testuser',
  ...overrides,
});

/**
 * Create mock user data
 */
const createMockUser = (overrides = {}) => ({
  id: 'user-id-123',
  email: 'test@bgu.ac.il',
  name: 'בדיקה תלמיד',
  google_id: 'test-user-id',
  university_id: 'bgu',
  is_setup_complete: false,
  preferences: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// ================================================================================================
// 🧪 ONBOARDING API TESTS
// ================================================================================================

describe('🎓 Onboarding API Logic', () => {
  let mockGetServerSession: any;
  let mockSupabaseAdmin: any;
  let mockExtractDataFromEmail: any;
  let mockCsrfProtection: any;
  let mockRateLimit: any;
  let mockZodParse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsole.log.mockClear();
    mockConsole.error.mockClear();

    // Setup mocks
    const { getServerSession } = require('next-auth');
    const { supabaseAdmin } = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/database/service-role.ts');
    const { extractDataFromEmail } = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/university-utils.ts');
    const { csrfProtection, rateLimit } = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts');
    const { z } = require('zod');

    mockGetServerSession = getServerSession;
    mockSupabaseAdmin = supabaseAdmin;
    mockExtractDataFromEmail = extractDataFromEmail;
    mockCsrfProtection = csrfProtection;
    mockRateLimit = rateLimit;

    // Setup Zod mocking
    mockZodParse = vi.fn();
    z.object.mockReturnValue({ parse: mockZodParse });
    z.boolean.mockReturnValue({ default: vi.fn().mockReturnThis(), optional: vi.fn().mockReturnThis() });
    z.string.mockReturnValue({ optional: vi.fn().mockReturnThis() });

    // Default mock implementations
    mockGetServerSession.mockResolvedValue(createMockSession());
    mockExtractDataFromEmail.mockResolvedValue(createMockUniversityData());
    mockCsrfProtection.mockResolvedValue(null);
    mockRateLimit.mockReturnValue(vi.fn().mockResolvedValue(null));
    mockZodParse.mockReturnValue({ onboardingCompleted: true });

    // Setup Supabase mocks
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: createMockUser(), error: null });
  });

  // ============================================================================================
  // 📋 GET ENDPOINT TESTS - Onboarding Status Check
  // ============================================================================================

  describe('📋 GET /api/user/onboarding - Status Check', () => {
    it('should return unauthorized for missing session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('לא מורשה');
      expect(response.status).toBe(401);
    });

    it('should return unauthorized for session without email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'test-id' }, // Missing email
      });

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('לא מורשה');
      expect(response.status).toBe(401);
    });

    it('should handle unsupported university email', async () => {
      mockExtractDataFromEmail.mockResolvedValue({
        isValidUniversityEmail: false,
        university: null,
      });

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.onboardingCompleted).toBe(false);
      expect(body.error).toBe('כתובת האימייל לא שייכת לאוניברסיטה נתמכת');
      expect(body.userInfo.universitySupported).toBe(false);
    });

    it('CRITICAL: should create new user for first-time BGU student', async () => {
      const session = createMockSession({ email: 'newstudent@bgu.ac.il' });
      mockGetServerSession.mockResolvedValue(session);

      // Mock user not found initially
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // User not found
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      // Mock successful user creation
      const newUser = createMockUser({ email: 'newstudent@bgu.ac.il' });
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: newUser, error: null });

      const response = await GET();

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('get_or_create_user_by_google_id', {
        email_param: 'newstudent@bgu.ac.il',
        google_id_param: 'test-user-id',
        name_param: 'בדיקה תלמיד',
      });

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.onboardingCompleted).toBe(false);
      expect(body.userInfo.universitySupported).toBe(true);
    });

    it('should return existing user onboarding status', async () => {
      const existingUser = createMockUser({ is_setup_complete: true });
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingUser, error: null }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.onboardingCompleted).toBe(true);
      expect(body.userInfo.setupComplete).toBe(true);
    });

    it('should check credential status for existing user', async () => {
      const user = createMockUser();
      const credentials = {
        university_username: 'testuser',
        encrypted_password: 'encrypted_password',
        university_id: 'bgu',
        is_active: true,
        is_verified: true,
        last_verified_at: new Date().toISOString(),
      };

      // Mock user query
      const userQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: user, error: null }),
      };

      // Mock credentials query
      const credentialsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: credentials, error: null }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(userQueryBuilder) // First call for users table
        .mockReturnValueOnce(credentialsQueryBuilder); // Second call for credentials table

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.userInfo.hasValidCredentials).toBe(true);
      expect(body.userInfo.needsRevalidation).toBe(false);
    });

    it('should detect credentials needing revalidation', async () => {
      const user = createMockUser();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31); // 31 days ago

      const credentials = {
        university_username: 'testuser',
        is_active: true,
        is_verified: true,
        last_verified_at: oldDate.toISOString(),
      };

      const userQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: user, error: null }),
      };

      const credentialsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: credentials, error: null }),
      };

      mockSupabaseAdmin.from.mockReturnValueOnce(userQueryBuilder).mockReturnValueOnce(credentialsQueryBuilder);

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.userInfo.hasValidCredentials).toBe(true);
      expect(body.userInfo.needsRevalidation).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST000', message: 'Database error' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('שגיאה בטעינת נתוני משתמש');
      expect(response.status).toBe(500);
    });

    it('should handle user creation errors', async () => {
      // Mock user not found
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      // Mock user creation failure
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Creation failed' },
      });

      const response = await GET();

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('שגיאה ביצירת משתמש');
      expect(response.status).toBe(500);
    });
  });

  // ============================================================================================
  // ✅ POST ENDPOINT TESTS - Complete Onboarding
  // ============================================================================================

  describe('✅ POST /api/user/onboarding - Complete Onboarding', () => {
    beforeEach(() => {
      // Mock successful CSRF protection and rate limiting
      mockCsrfProtection.mockResolvedValue(null);
      mockRateLimit.mockReturnValue(vi.fn().mockResolvedValue(null));
    });

    it('should apply rate limiting', async () => {
      const rateLimitFn = vi.fn().mockResolvedValue(null);
      mockRateLimit.mockReturnValue(rateLimitFn);

      const request = createMockRequest({ onboardingCompleted: true });
      await POST(request);

      expect(mockRateLimit).toHaveBeenCalledWith(20, 60000);
      expect(rateLimitFn).toHaveBeenCalledWith(request);
    });

    it('should block requests when rate limited', async () => {
      const rateLimitResponse = new NextResponse('Rate limited', { status: 429 });
      mockRateLimit.mockReturnValue(vi.fn().mockResolvedValue(rateLimitResponse));

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(response).toBe(rateLimitResponse);
    });

    it('should apply CSRF protection', async () => {
      const request = createMockRequest({ onboardingCompleted: true });
      await POST(request);

      expect(mockCsrfProtection).toHaveBeenCalledWith(request);
    });

    it('should block requests failing CSRF protection', async () => {
      const csrfResponse = new NextResponse('CSRF failed', { status: 403 });
      mockCsrfProtection.mockResolvedValue(csrfResponse);

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(response).toBe(csrfResponse);
    });

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('לא מורשה');
      expect(response.status).toBe(401);
    });

    it('should validate request body with Zod schema', async () => {
      const requestBody = { onboardingCompleted: true };
      mockZodParse.mockReturnValue(requestBody);

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockZodParse).toHaveBeenCalledWith(requestBody);
    });

    it('should reject unsupported university email', async () => {
      mockExtractDataFromEmail.mockResolvedValue({
        isValidUniversityEmail: false,
        university: null,
      });

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('כתובת האימייל לא שייכת לאוניברסיטה נתמכת');
      expect(response.status).toBe(400);
    });

    it('CRITICAL: should verify credentials before completing onboarding', async () => {
      // Mock credential status check
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: {
          has_credentials: false,
          needs_revalidation: false,
        },
        error: null,
      });

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('get_user_credential_status', {
        user_email_param: 'test@bgu.ac.il',
        university_id_param: 'bgu',
      });

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('יש להזין ולאמת את נתוני האוניברסיטה תחילה');
      expect(response.status).toBe(400);
    });

    it('should reject if credentials need revalidation', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: {
          has_credentials: true,
          needs_revalidation: true,
        },
        error: null,
      });

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('יש להזין ולאמת את נתוני האוניברסיטה תחילה');
    });

    it('CRITICAL: should complete onboarding successfully for valid BGU student', async () => {
      // Mock valid credentials
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: {
          has_credentials: true,
          needs_revalidation: false,
        },
        error: null,
      });

      // Mock successful user update
      const updatedUser = createMockUser({
        is_setup_complete: true,
        preferences: {
          onboardingCompleted: true,
          universityCredentialsSaved: true,
        },
      });

      const mockQueryBuilder = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedUser, error: null }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@bgu.ac.il',
          name: 'בדיקה תלמיד',
          google_id: 'test-user-id',
          university_id: 'bgu',
          is_setup_complete: true,
          preferences: expect.objectContaining({
            onboardingCompleted: true,
            universityCredentialsSaved: true,
          }),
        }),
        { onConflict: 'email' }
      );

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('ברוכים הבאים ל-Spike! החשבון שלך מוכן לשימוש');
      expect(body.user.onboardingCompleted).toBe(true);
    });

    it('should handle database update errors', async () => {
      // Mock valid credentials
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: { has_credentials: true, needs_revalidation: false },
      });

      // Mock database error
      const mockQueryBuilder = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('שגיאה בעדכון המשתמש');
      expect(response.status).toBe(500);
    });

    it('should handle Zod validation errors', async () => {
      const zodError = new (require('zod').ZodError)([{ message: 'Invalid data', path: ['onboardingCompleted'] }]);
      mockZodParse.mockImplementation(() => {
        throw zodError;
      });

      const request = createMockRequest({ invalid: 'data' });
      const response = await POST(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('נתונים לא תקינים');
      expect(response.status).toBe(400);
    });

    it('should return Hebrew success message with university details', async () => {
      // Mock valid flow
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: { has_credentials: true, needs_revalidation: false },
      });

      const updatedUser = createMockUser({ is_setup_complete: true });
      const mockQueryBuilder = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedUser, error: null }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      const body = await response.json();
      expect(body.user.university).toBe('אוניברסיטת בן גוריון בנגב');
      expect(body.user.universityId).toBe('bgu');
      expect(body.user.username).toBe('testuser');
    });
  });

  // ============================================================================================
  // 🔄 PATCH ENDPOINT TESTS - Update University Credentials
  // ============================================================================================

  describe('🔄 PATCH /api/user/onboarding - Update Credentials', () => {
    beforeEach(() => {
      mockCsrfProtection.mockResolvedValue(null);
      mockRateLimit.mockReturnValue(vi.fn().mockResolvedValue(null));
    });

    it('should apply rate limiting and CSRF protection', async () => {
      const request = createMockRequest({
        universityCredentialsSaved: true,
        university: 'bgu',
      });
      await PATCH(request);

      expect(mockRateLimit).toHaveBeenCalledWith(20, 60000);
      expect(mockCsrfProtection).toHaveBeenCalledWith(request);
    });

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({ universityCredentialsSaved: true });
      const response = await PATCH(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('לא מורשה');
      expect(response.status).toBe(401);
    });

    it('should handle mock mode when Supabase not configured', async () => {
      // Mock environment variables with placeholder values
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-key',
      };

      const request = createMockRequest({
        universityCredentialsSaved: true,
        university: 'bgu',
      });
      const response = await PATCH(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('פרטי האוניברסיטה עודכנו בהצלחה');
      expect(body.user.id).toBe('mock_user_id');

      // Restore environment
      process.env = originalEnv;
    });

    it('should update university credentials in database', async () => {
      const updatedUser = createMockUser({
        university_credentials_saved: true,
        university: 'bgu',
        last_credentials_update: new Date().toISOString(),
      });

      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedUser, error: null }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const requestBody = {
        universityCredentialsSaved: true,
        university: 'bgu',
        lastCredentialsUpdate: new Date().toISOString(),
      };

      const request = createMockRequest(requestBody);
      const response = await PATCH(request);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          university_credentials_saved: true,
          university: 'bgu',
          last_credentials_update: requestBody.lastCredentialsUpdate,
        })
      );

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('google_id', 'test-user-id');

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.user.universityCredentialsSaved).toBe(true);
    });

    it('should handle partial credential updates', async () => {
      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createMockUser(), error: null }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const request = createMockRequest({
        universityCredentialsSaved: true,
        // Only updating credentials saved status, not university
      });
      await PATCH(request);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        university_credentials_saved: true,
      });
    });

    it('should handle database update errors', async () => {
      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const request = createMockRequest({ universityCredentialsSaved: true });
      const response = await PATCH(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('שגיאה בעדכון פרטי האוניברסיטה');
      expect(response.status).toBe(500);
    });

    it('should handle Zod validation errors for credentials update', async () => {
      const zodError = new (require('zod').ZodError)([{ message: 'Invalid university format', path: ['university'] }]);
      mockZodParse.mockImplementation(() => {
        throw zodError;
      });

      const request = createMockRequest({ invalidData: true });
      const response = await PATCH(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('נתונים לא תקינים');
      expect(response.status).toBe(400);
    });
  });

  // ============================================================================================
  // 🎓 ACADEMIC PLATFORM SPECIFIC TESTS
  // ============================================================================================

  describe('🎓 Academic Platform Hebrew Features', () => {
    it('CRITICAL: should handle Hebrew names in user creation', async () => {
      const hebrewSession = createMockSession({
        name: 'דוד כהן בן אברהם',
        email: 'david.cohen@bgu.ac.il',
      });
      mockGetServerSession.mockResolvedValue(hebrewSession);

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const newUser = createMockUser({
        name: 'דוד כהן בן אברהם',
        email: 'david.cohen@bgu.ac.il',
      });
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: newUser, error: null });

      await GET();

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('get_or_create_user_by_google_id', {
        email_param: 'david.cohen@bgu.ac.il',
        google_id_param: 'test-user-id',
        name_param: 'דוד כהן בן אברהם',
      });
    });

    it('should return Hebrew university names', async () => {
      const universityData = createMockUniversityData({
        university: {
          id: 'bgu',
          nameHe: 'אוניברסיטת בן גוריון בנגב',
          nameEn: 'Ben Gurion University of the Negev',
          domain: 'bgu.ac.il',
        },
      });
      mockExtractDataFromEmail.mockResolvedValue(universityData);

      const response = await GET();
      const body = await response.json();

      expect(body.userInfo.university).toBe('אוניברסיטת בן גוריון בנגב');
      expect(body.userInfo.universityId).toBe('bgu');
    });

    it('should handle different Israeli universities', async () => {
      const tauData = createMockUniversityData({
        university: {
          id: 'tau',
          nameHe: 'אוניברסיטת תל אביב',
          nameEn: 'Tel Aviv University',
          domain: 'tau.ac.il',
        },
      });

      mockExtractDataFromEmail.mockResolvedValue(tauData);
      mockGetServerSession.mockResolvedValue(
        createMockSession({
          email: 'student@tau.ac.il',
        })
      );

      const response = await GET();
      const body = await response.json();

      expect(body.userInfo.university).toBe('אוניברסיטת תל אביב');
      expect(body.userInfo.universityId).toBe('tau');
    });

    it('should return all Hebrew error messages', async () => {
      const testCases = [
        {
          scenario: 'unauthorized',
          setup: () => mockGetServerSession.mockResolvedValue(null),
          expectedError: 'לא מורשה',
        },
        {
          scenario: 'unsupported university',
          setup: () =>
            mockExtractDataFromEmail.mockResolvedValue({
              isValidUniversityEmail: false,
              university: null,
            }),
          expectedError: 'כתובת האימייל לא שייכת לאוניברסיטה נתמכת',
        },
        {
          scenario: 'database error',
          setup: () => {
            const mockQueryBuilder = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST000', message: 'Database error' },
              }),
            };
            mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);
          },
          expectedError: 'שגיאה בטעינת נתוני משתמש',
        },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        mockGetServerSession.mockResolvedValue(createMockSession());
        mockExtractDataFromEmail.mockResolvedValue(createMockUniversityData());

        testCase.setup();

        const response = await GET();
        const body = await response.json();

        expect(body.error).toBe(testCase.expectedError);
      }
    });

    it('CRITICAL: should set correct Hebrew academic preferences', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: { has_credentials: true, needs_revalidation: false },
      });

      const mockQueryBuilder = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createMockUser({ is_setup_complete: true }),
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQueryBuilder);

      const request = createMockRequest({ onboardingCompleted: true });
      await POST(request);

      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.objectContaining({
            onboardingCompleted: true,
            universityCredentialsSaved: true,
            lastCredentialsUpdate: expect.any(String),
          }),
        }),
        { onConflict: 'email' }
      );
    });
  });

  // ============================================================================================
  // 🛡️ SECURITY TESTS
  // ============================================================================================

  describe('🛡️ Security & Error Handling', () => {
    it('should log all errors for monitoring', async () => {
      const error = new Error('Test error');
      mockGetServerSession.mockRejectedValue(error);

      const request = createMockRequest({ onboardingCompleted: true });
      await POST(request);

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Onboarding API error:', error);
    });

    it('should not expose sensitive error details to clients', async () => {
      mockSupabaseAdmin.rpc.mockRejectedValue(new Error('Database connection string exposed'));

      const request = createMockRequest({ onboardingCompleted: true });
      const response = await POST(request);

      const body = await response.json();
      expect(body.error).toBe('שגיאה פנימית בשרת');
      expect(body.error).not.toContain('Database connection');
    });

    it('should handle malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json{',
      });

      // Mock request.json() to throw
      (request as any).json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(request);

      expect(response).toBeInstanceOf(NextResponse);
      const body = await response.json();
      expect(body.error).toBe('שגיאה פנימית בשרת');
    });

    it('should validate all input fields properly', async () => {
      const maliciousInput = {
        onboardingCompleted: true,
        maliciousField: '<script>alert("xss")</script>',
        university: 'bgu; DROP TABLE users;--',
      };

      // Zod should filter out unknown fields
      mockZodParse.mockReturnValue({ onboardingCompleted: true });

      const request = createMockRequest(maliciousInput);
      await POST(request);

      // Verify only allowed fields are parsed
      expect(mockZodParse).toHaveBeenCalledWith(maliciousInput);
    });
  });
});

// ================================================================================================
// 🧪 INTEGRATION TESTS
// ================================================================================================

describe('🧪 Onboarding Flow Integration', () => {
  it('CRITICAL: should complete full BGU student onboarding flow', async () => {
    // This integration test simulates the complete flow:
    // 1. New BGU student checks onboarding status
    // 2. User is created in database
    // 3. User sets up university credentials
    // 4. User completes onboarding

    const mockGetServerSession = require('next-auth').getServerSession;
    const mockSupabaseAdmin = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/database/service-role.ts').supabaseAdmin;
    const mockExtractDataFromEmail = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/university-utils.ts').extractDataFromEmail;

    // Setup common mocks
    const session = createMockSession({ email: 'newstudent@bgu.ac.il' });
    const universityData = createMockUniversityData();

    mockGetServerSession.mockResolvedValue(session);
    mockExtractDataFromEmail.mockResolvedValue(universityData);

    // Step 1: Initial status check - user doesn't exist
    const userNotFoundBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };
    mockSupabaseAdmin.from.mockReturnValue(userNotFoundBuilder);

    const newUser = createMockUser({
      email: 'newstudent@bgu.ac.il',
      is_setup_complete: false,
    });
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: newUser, error: null });

    const statusResponse = await GET();
    const statusBody = await statusResponse.json();

    expect(statusBody.onboardingCompleted).toBe(false);
    expect(statusBody.userInfo.universitySupported).toBe(true);

    // Step 2: Complete onboarding
    mockSupabaseAdmin.rpc
      .mockResolvedValueOnce({ data: newUser, error: null }) // User creation
      .mockResolvedValueOnce({
        // Credential status check
        data: { has_credentials: true, needs_revalidation: false },
        error: null,
      });

    const completedUser = createMockUser({
      email: 'newstudent@bgu.ac.il',
      is_setup_complete: true,
    });

    const completeBuilder = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: completedUser, error: null }),
    };
    mockSupabaseAdmin.from.mockReturnValue(completeBuilder);

    const completeRequest = createMockRequest({ onboardingCompleted: true });
    const completeResponse = await POST(completeRequest);
    const completeBody = await completeResponse.json();

    expect(completeBody.success).toBe(true);
    expect(completeBody.user.onboardingCompleted).toBe(true);
    expect(completeBody.message).toBe('ברוכים הבאים ל-Spike! החשבון שלך מוכן לשימוש');

    // Verify the flow progression
    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith(
      'get_or_create_user_by_google_id',
      expect.objectContaining({
        email_param: 'newstudent@bgu.ac.il',
      })
    );

    expect(completeBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newstudent@bgu.ac.il',
        is_setup_complete: true,
      }),
      { onConflict: 'email' }
    );
  });
});
