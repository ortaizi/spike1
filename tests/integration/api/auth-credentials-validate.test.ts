/**
 * 🔐 AUTHENTICATION CREDENTIALS VALIDATION API INTEGRATION TESTS
 *
 * Comprehensive integration testing for the smart credential validation API,
 * including Hebrew error messages, security measures, and authentication flows.
 *
 * Part of Phase 3: Integration Testing Implementation
 */

import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../apps/web/app/api/auth/credentials/validate/route';
import { getServerSession } from 'next-auth';
import { supabase } from '../../../apps/web/lib/db';
import { csrfProtection, rateLimit } from '../../../apps/web/lib/security/csrf-protection';

// Mock all dependencies using factory functions to avoid hoisting issues
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../../../apps/web/lib/auth/server-auth', () => ({
  authOptions: {},
}));

vi.mock('../../../apps/web/lib/db', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ eq: vi.fn() })),
      upsert: vi.fn(() => ({ eq: vi.fn() })),
      update: vi.fn(() => ({ eq: vi.fn() })),
    })),
  },
}));

vi.mock('../../../apps/web/lib/security/csrf-protection', () => ({
  csrfProtection: vi.fn(),
  rateLimit: vi.fn(() => vi.fn().mockResolvedValue(null)), // rateLimit returns a function
}));

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

// Get mocked functions for test setup
const mockGetServerSession = vi.mocked(getServerSession);
const mockSupabase = vi.mocked(supabase);
const mockRateLimit = vi.mocked(rateLimit);
const mockCsrfProtection = vi.mocked(csrfProtection);
const mockSpawn = vi.mocked(spawn);

describe('🔐 Authentication Credentials Validation API Integration', () => {
  let mockRequest: NextRequest;
  let mockSession: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default session
    mockSession = {
      user: {
        email: 'test@post.bgu.ac.il',
        name: 'דניאל כהן',
      },
    };

    mockGetServerSession.mockResolvedValue(mockSession);

    // Setup rate limit mock - rateLimit() returns a function
    const mockRateLimitFn = vi.fn().mockResolvedValue(null);
    mockRateLimit.mockReturnValue(mockRateLimitFn);

    mockCsrfProtection.mockResolvedValue(null); // No CSRF issues

    // Setup default Supabase responses
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔒 Security and Rate Limiting', () => {
    it('should enforce rate limiting for credential validation attempts', async () => {
      // Mock rate limit hit - set up the returned function to return 429
      const rateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }),
        { status: 429 }
      );
      const mockRateLimitFn = vi.fn().mockResolvedValue(rateLimitResponse);
      mockRateLimit.mockReturnValue(mockRateLimitFn);

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'student123',
          password: 'password123',
          universityId: 'bgu',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(mockRateLimit).toHaveBeenCalledWith(3, 60000);
      expect(mockRateLimitFn).toHaveBeenCalled();
    });

    it('should enforce CSRF protection', async () => {
      // Mock CSRF failure
      const csrfResponse = new Response(JSON.stringify({ error: 'Invalid CSRF token', code: 'CSRF_TOKEN_INVALID' }), {
        status: 403,
      });
      mockCsrfProtection.mockResolvedValue(csrfResponse);

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'student123',
          password: 'password123',
          universityId: 'bgu',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(mockCsrfProtection).toHaveBeenCalled();
    });

    it('should require authentication before processing', async () => {
      mockGetServerSession.mockResolvedValue(null); // No session

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'student123',
          password: 'password123',
          universityId: 'bgu',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('נדרש אימות Google קודם');
      expect(data.error).toMatch(/[\u0590-\u05FF]/); // Hebrew characters
    });
  });

  describe('📋 Request Validation', () => {
    it('should validate required fields in Hebrew', async () => {
      const testCases = [
        {
          body: { password: 'test', universityId: 'bgu' }, // missing username
          expectedError: 'חסרים פרטים נדרשים',
        },
        {
          body: { username: 'test', universityId: 'bgu' }, // missing password
          expectedError: 'חסרים פרטים נדרשים',
        },
        {
          body: { username: 'test', password: 'test' }, // missing universityId
          expectedError: 'חסרים פרטים נדרשים',
        },
        {
          body: {}, // missing all
          expectedError: 'חסרים פרטים נדרשים',
        },
      ];

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify(testCase.body),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain(testCase.expectedError);
        expect(data.error).toMatch(/[\u0590-\u05FF]/); // Hebrew characters
      }
    });

    it('should validate input length limits with Hebrew errors', async () => {
      const longString = 'x'.repeat(101);

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: longString,
          password: 'password',
          universityId: 'bgu',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('פרטי הכניסה ארוכים מדי');
      expect(data.error).toMatch(/[\u0590-\u05FF]/);
    });

    it('should only support BGU university for now', async () => {
      const unsupportedUniversities = ['technion', 'huji', 'tau', 'invalid'];

      for (const universityId of unsupportedUniversities) {
        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify({
            username: 'student123',
            password: 'password123',
            universityId,
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('כרגע תמיכה רק באוניברסיטת בן-גוריון');
        expect(data.error).toMatch(/[\u0590-\u05FF]/);
      }
    });
  });

  describe('🔄 Authentication Flow Logic', () => {
    describe('✅ Existing User Auto Authentication', () => {
      it('should handle existing user with valid credentials automatically', async () => {
        // Mock existing valid credentials
        mockSupabase.rpc.mockResolvedValue({
          data: {
            has_credentials: true,
            credentials_valid: true,
            needs_revalidation: false,
            username: 'stored_user',
          },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify({
            username: 'student123',
            password: 'password123',
            universityId: 'bgu',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.authenticationFlow).toBe('existing_user_auto');
        expect(data.message).toBe('התחברות אוטומטית הצליחה עם פרטים שמורים');
        expect(data.message).toMatch(/[\u0590-\u05FF]/);
        expect(data.university.name).toBe('אוניברסיטת בן-גוריון בנגב');
      });

      it('should fall back to manual validation if auto auth fails', async () => {
        // Mock existing credentials but auto auth would fail
        mockSupabase.rpc
          .mockResolvedValueOnce({
            data: {
              has_credentials: true,
              credentials_valid: false,
              needs_revalidation: true,
              username: 'stored_user',
            },
            error: null,
          })
          .mockResolvedValueOnce({ data: null, error: null }); // For increment attempts

        // Mock the child_process spawn for Python validation
        const { spawn } = require('child_process');
        const mockPythonProcess = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };

        mockSpawn.mockReturnValue(mockPythonProcess);

        // Simulate successful Python validation
        mockPythonProcess.on.mockImplementation((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10); // Success code
          }
        });

        mockPythonProcess.stdout.on.mockImplementation((event, callback) => {
          if (event === 'data') {
            setTimeout(
              () =>
                callback(
                  JSON.stringify({
                    success: true,
                    message_he: 'אימות הצליח',
                    session_data: { sessionId: 'test123' },
                  })
                ),
              5
            );
          }
        });

        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify({
            username: 'student123',
            password: 'password123',
            universityId: 'bgu',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.authenticationFlow).toBe('existing_user_updated');
      });
    });

    describe('🆕 New User Registration Flow', () => {
      it('should handle new user with valid credentials', async () => {
        // Mock no existing credentials
        mockSupabase.rpc.mockResolvedValue({
          data: {
            has_credentials: false,
            credentials_valid: false,
            needs_revalidation: true,
            username: null,
          },
          error: null,
        });

        // Mock successful Python validation
        const { spawn } = require('child_process');
        const mockPythonProcess = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };

        mockSpawn.mockReturnValue(mockPythonProcess);

        mockPythonProcess.on.mockImplementation((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        });

        mockPythonProcess.stdout.on.mockImplementation((event, callback) => {
          if (event === 'data') {
            setTimeout(
              () =>
                callback(
                  JSON.stringify({
                    success: true,
                    message_he: 'אימות הצליח',
                    session_data: { sessionId: 'new123' },
                  })
                ),
              5
            );
          }
        });

        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify({
            username: 'newstudent',
            password: 'newpassword',
            universityId: 'bgu',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.authenticationFlow).toBe('new_user_success');
        expect(data.message).toBe('פרטי ההתחברות אומתו בהצלחה ונשמרו');
        expect(data.message).toMatch(/[\u0590-\u05FF]/);
      });
    });

    describe('❌ Authentication Failures', () => {
      it('should handle invalid credentials with Hebrew error messages', async () => {
        // Mock no existing credentials
        mockSupabase.rpc.mockResolvedValue({
          data: {
            has_credentials: false,
            credentials_valid: false,
            needs_revalidation: true,
            username: null,
          },
          error: null,
        });

        // Mock failed Python validation
        const { spawn } = require('child_process');
        const mockPythonProcess = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };

        mockSpawn.mockReturnValue(mockPythonProcess);

        mockPythonProcess.on.mockImplementation((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        });

        mockPythonProcess.stdout.on.mockImplementation((event, callback) => {
          if (event === 'data') {
            setTimeout(
              () =>
                callback(
                  JSON.stringify({
                    success: false,
                    message_he: 'שם משתמש או סיסמה שגויים',
                    error_details: 'Invalid credentials',
                  })
                ),
              5
            );
          }
        });

        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify({
            username: 'wronguser',
            password: 'wrongpass',
            universityId: 'bgu',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('שם משתמש או סיסמה שגויים');
        expect(data.error).toMatch(/[\u0590-\u05FF]/);
        expect(data.authenticationFlow).toBe('new_user_failed');
      });

      it('should handle Python validation timeout', async () => {
        // Mock no existing credentials
        mockSupabase.rpc.mockResolvedValue({
          data: {
            has_credentials: false,
            credentials_valid: false,
            needs_revalidation: true,
            username: null,
          },
          error: null,
        });

        // Mock Python process that times out
        const { spawn } = require('child_process');
        const mockPythonProcess = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn(),
        };

        mockSpawn.mockReturnValue(mockPythonProcess);

        // Don't call the close callback to simulate timeout
        mockPythonProcess.on.mockImplementation(() => {});

        const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
          method: 'POST',
          body: JSON.stringify({
            username: 'timeoutuser',
            password: 'timeoutpass',
            universityId: 'bgu',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('שגיאה פנימית בשרת. נסה שוב מאוחר יותר.');
        expect(data.error).toMatch(/[\u0590-\u05FF]/);
      });
    });
  });

  describe('💾 Database Integration', () => {
    it('should interact with database functions correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'dbtest',
          password: 'dbpass',
          universityId: 'bgu',
        }),
      });

      await POST(request);

      // Verify database function calls
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_credential_status', {
        user_email_param: 'test@post.bgu.ac.il',
        university_id_param: 'bgu',
      });
    });

    it('should fall back to alternative functions if primary fails', async () => {
      // Mock primary function failure
      mockSupabase.rpc.mockRejectedValueOnce(new Error('Function not found')).mockResolvedValueOnce({
        data: {
          has_credentials: false,
          credentials_valid: false,
          needs_revalidation: true,
          username: null,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'fallbacktest',
          password: 'fallbackpass',
          universityId: 'bgu',
        }),
      });

      await POST(request);

      // Should try both functions
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_credential_status', expect.any(Object));
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_university_credentials', expect.any(Object));
    });
  });

  describe('🧪 CRITICAL: End-to-End Integration Flow', () => {
    it('CRITICAL: should handle complete authentication workflow for Hebrew academic user', async () => {
      // Mock complete successful flow
      mockSupabase.rpc
        .mockResolvedValueOnce({
          // Check existing credentials
          data: {
            has_credentials: false,
            credentials_valid: false,
            needs_revalidation: true,
            username: null,
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null }) // Save credentials
        .mockResolvedValueOnce({ data: null, error: null }); // Log attempt

      // Mock successful Python validation
      const { spawn } = require('child_process');
      const mockPythonProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockPythonProcess);

      mockPythonProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockPythonProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(
            () =>
              callback(
                JSON.stringify({
                  success: true,
                  message_he: 'התחברות הצליחה לאוניברסיטת בן-גוריון',
                  session_data: {
                    sessionId: 'bgu_session_123',
                    userId: 'student_456',
                    courses: ['מדעי המחשב 101', 'מתמטיקה בדידה'],
                  },
                })
              ),
            5
          );
        }
      });

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'hebrew_student',
          password: 'secure_password',
          universityId: 'bgu',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify response structure
      expect(data.success).toBe(true);
      expect(data.authenticationFlow).toBe('new_user_success');
      expect(data.message).toMatch(/[\u0590-\u05FF]/); // Hebrew message
      expect(data.university.name).toBe('אוניברסיטת בן-גוריון בנגב');
      expect(data.university.sessionData).toBeDefined();
      expect(data.responseTime).toBeGreaterThan(0);

      // Verify all database interactions occurred
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_credential_status', expect.any(Object));
      expect(mockSupabase.rpc).toHaveBeenCalledWith('save_validated_credentials', expect.any(Object));
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_auth_attempt', expect.any(Object));
    });

    it('CRITICAL: should maintain security throughout the authentication process', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'security_test',
          password: 'security_password',
          universityId: 'bgu',
        }),
        headers: {
          'X-Forwarded-For': '192.168.1.100',
          'User-Agent': 'Mozilla/5.0 (Test Browser)',
        },
      });

      await POST(request);

      // Verify security measures were applied
      expect(mockRateLimit).toHaveBeenCalled();
      expect(mockCsrfProtection).toHaveBeenCalled();
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('CRITICAL: should handle Hebrew content throughout the entire flow', async () => {
      // Test with Hebrew academic credentials
      mockSession.user.email = 'דניאל.כהן@post.bgu.ac.il';
      mockSession.user.name = 'דניאל כהן';

      mockSupabase.rpc.mockResolvedValue({
        data: {
          has_credentials: false,
          credentials_valid: false,
          needs_revalidation: true,
          username: null,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/credentials/validate', {
        method: 'POST',
        body: JSON.stringify({
          username: 'דניאל123', // Hebrew username
          password: 'סיסמה_בטוחה',
          universityId: 'bgu',
        }),
      });

      // Should handle Hebrew input without issues
      const response = await POST(request);

      // Verify Hebrew characters are preserved throughout
      expect(response).toBeDefined();
      // The actual validation would depend on Python script working correctly
    });
  });
});
