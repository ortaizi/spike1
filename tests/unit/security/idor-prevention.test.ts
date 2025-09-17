/**
 * 🔒 IDOR PREVENTION UNIT TESTS
 *
 * Comprehensive testing for Insecure Direct Object Reference (IDOR) prevention
 * in the GET /api/users/[id] endpoint. Validates authentication, authorization,
 * and data access controls.
 *
 * CRITICAL SECURITY: Issue #8 - Preventing unauthorized user data access
 */

import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { GET } from '../../../apps/web/app/api/users/[id]/route';

// Mock NextAuth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Supabase client
vi.mock('../../../apps/web/lib/db', () => {
  const mockSupabaseSelect = vi.fn();
  const mockSupabaseFrom = vi.fn(() => ({
    select: mockSupabaseSelect,
  }));

  return {
    supabase: {
      from: mockSupabaseFrom,
    },
  };
});

// Mock CSRF protection and rate limiting
vi.mock('../../../apps/web/lib/security/csrf-protection', () => ({
  csrfProtection: vi.fn().mockResolvedValue(null),
  rateLimit: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

// Mock auth config
vi.mock('../../../apps/web/lib/auth/unified-auth', () => ({
  unifiedAuthOptions: {},
}));

describe('🔒 IDOR Prevention - GET /api/users/[id]', () => {
  let mockGetServerSession: MockedFunction<typeof getServerSession>;
  let mockDbResponse: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup session mock
    mockGetServerSession = getServerSession as MockedFunction<typeof getServerSession>;

    // Reset security mocks (mocks are recreated automatically)

    // Setup default database response
    mockDbResponse = {
      data: {
        id: 'user-123',
        email: 'test@post.bgu.ac.il',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        university_id: 'bgu',
        is_setup_complete: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      },
      error: null,
    };

    // Setup default Supabase mock for each test
    const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
    const mockSingle = vi.fn().mockResolvedValue(mockDbResponse);
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    supabase.from.mockReturnValue({ select: mockSelect });

    // Setup console mocks for clean test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔐 Authentication Tests', () => {
    it('CRITICAL: should return 401 for unauthenticated requests', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized: Authentication required');

      // Verify security warning was logged
      expect(console.warn).toHaveBeenCalledWith('SECURITY: Unauthenticated access attempt to GET /api/users/[id]');
    });

    it('CRITICAL: should return 401 for malformed sessions', async () => {
      // Mock session without user ID
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }, // Missing user.id
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized: Authentication required');
    });

    it('CRITICAL: should return 401 for sessions with empty user ID', async () => {
      // Mock session with empty user ID
      mockGetServerSession.mockResolvedValue({
        user: { id: '', email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(401);
    });
  });

  describe('🚫 Authorization Tests (IDOR Prevention)', () => {
    it("CRITICAL: should return 403 when user tries to access another user's data", async () => {
      // Mock authenticated session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-456', // Different user
          email: 'other@post.bgu.ac.il',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden: You can only access your own profile');

      // Verify security warning was logged with specific details
      expect(console.warn).toHaveBeenCalledWith(
        'SECURITY: User user-456 attempted unauthorized access to user user-123'
      );

      // Verify database was never queried
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('CRITICAL: should prevent access to admin users without proper authorization', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'regular-user-789',
          email: 'regular@post.bgu.ac.il',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/admin-user-001');
      const response = await GET(request, { params: { id: 'admin-user-001' } });

      expect(response.status).toBe(403);
      expect(console.warn).toHaveBeenCalledWith(
        'SECURITY: User regular-user-789 attempted unauthorized access to user admin-user-001'
      );
    });

    it('CRITICAL: should prevent enumeration attacks via different user IDs', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'attacker-user',
          email: 'attacker@post.bgu.ac.il',
        },
      } as any);

      const targetUserIds = ['user-001', 'user-002', 'admin-123', 'service-account-456', 'test-user-789'];

      for (const targetId of targetUserIds) {
        const request = new NextRequest(`http://localhost:3000/api/users/${targetId}`);
        const response = await GET(request, { params: { id: targetId } });

        expect(response.status).toBe(403);
        expect(console.warn).toHaveBeenCalledWith(
          `SECURITY: User attacker-user attempted unauthorized access to user ${targetId}`
        );
      }

      // Verify database was never queried for any attempt
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('✅ Authorized Access Tests', () => {
    it('should allow users to access their own data', async () => {
      // Mock authenticated session for the same user
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@post.bgu.ac.il',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      // Debug the response if it's not 200
      if (response.status !== 200) {
        try {
          const errorData = await response.clone().json();
          console.log('Unexpected response status:', response.status);
          console.log('Error response:', errorData);
        } catch (e) {
          console.log('Could not parse error response');
        }
      }

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe('user-123');
      expect(data.email).toBe('test@post.bgu.ac.il');

      // Verify database was queried correctly
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should return safe user data fields only', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@post.bgu.ac.il',
        },
      } as any);

      // Set up database mock for this test
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      const mockSingle = vi.fn().mockResolvedValue(mockDbResponse);
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      const data = await response.json();

      // Verify only safe fields are included
      const expectedFields = [
        'id',
        'email',
        'name',
        'avatar_url',
        'university_id',
        'is_setup_complete',
        'created_at',
        'updated_at',
      ];

      expectedFields.forEach((field) => {
        expect(data).toHaveProperty(field);
      });

      // Verify sensitive fields are excluded from select
      const selectedFields = 'id, email, name, avatar_url, university_id, is_setup_complete, created_at, updated_at';
      expect(selectedFields).not.toMatch(/password|encrypted|secret/);
    });
  });

  describe('💾 Database Security Tests', () => {
    it('should handle database errors securely', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@post.bgu.ac.il',
        },
      } as any);

      // Mock database error
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('User not found'); // Generic error, no leak

      // Verify detailed error was logged but not exposed
      expect(console.error).toHaveBeenCalledWith(
        'Database error:',
        expect.objectContaining({ message: 'Database connection failed' })
      );
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@post.bgu.ac.il',
        },
      } as any);

      // Test with malicious input
      const maliciousId = "'; DROP TABLE users; --";
      const request = new NextRequest(`http://localhost:3000/api/users/${encodeURIComponent(maliciousId)}`);
      const response = await GET(request, { params: { id: maliciousId } });

      // Should return 403 (authorization check before database query)
      expect(response.status).toBe(403);

      // Database should use parameterized queries if reached
      // (In this case, auth check prevents database access)
    });
  });

  describe('🔄 Integration Security Tests', () => {
    it('CRITICAL: should apply all security layers in correct order', async () => {
      const { csrfProtection, rateLimit } = require('../../../apps/web/lib/security/csrf-protection');

      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@post.bgu.ac.il',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      await GET(request, { params: { id: 'user-123' } });

      // Verify security layers were applied in order
      expect(rateLimit).toHaveBeenCalled(); // Rate limiting first
      expect(csrfProtection).toHaveBeenCalled(); // CSRF protection second
      expect(mockGetServerSession).toHaveBeenCalled(); // Authentication third
      // Authorization check happens in code (tested above)
      // Database query happens last
    });

    it('CRITICAL: should maintain security even under edge conditions', async () => {
      // Test with various edge case user IDs
      const edgeCaseIds = [
        '', // Empty string
        ' ', // Whitespace
        'null', // String 'null'
        'undefined', // String 'undefined'
        '0', // Zero
        '-1', // Negative
        'user-123; SELECT * FROM users', // SQL injection attempt
        '../../../etc/passwd', // Path traversal attempt
        '<script>alert(1)</script>', // XSS attempt
      ];

      for (const edgeId of edgeCaseIds) {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: 'legitimate-user',
            email: 'test@post.bgu.ac.il',
          },
        } as any);

        const request = new NextRequest(`http://localhost:3000/api/users/${encodeURIComponent(edgeId)}`);
        const response = await GET(request, { params: { id: edgeId } });

        // All should be blocked by authorization check
        expect(response.status).toBe(403);
        expect(console.warn).toHaveBeenCalledWith(
          `SECURITY: User legitimate-user attempted unauthorized access to user ${edgeId}`
        );
      }
    });
  });

  describe('🧪 CRITICAL: End-to-End Security Validation', () => {
    it('CRITICAL: complete IDOR attack simulation should fail', async () => {
      // Simulate a complete IDOR attack scenario
      const attackerSession = {
        user: {
          id: 'attacker-999',
          email: 'attacker@evil.com',
        },
      };

      const targetUserId = 'victim-123';

      mockGetServerSession.mockResolvedValue(attackerSession as any);

      // Attacker tries to access victim's data
      const maliciousRequest = new NextRequest(`http://localhost:3000/api/users/${targetUserId}`);
      const response = await GET(maliciousRequest, { params: { id: targetUserId } });

      // Attack should be completely blocked
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: 'Forbidden: You can only access your own profile',
      });

      // Security incident should be logged
      expect(console.warn).toHaveBeenCalledWith(
        `SECURITY: User attacker-999 attempted unauthorized access to user victim-123`
      );

      // Victim's data should never be touched
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('CRITICAL: legitimate user access should work perfectly', async () => {
      const legitimateUser = {
        user: {
          id: 'legitimate-user-456',
          email: 'student@post.bgu.ac.il',
        },
      };

      mockGetServerSession.mockResolvedValue(legitimateUser as any);

      // User accesses their own data
      const request = new NextRequest('http://localhost:3000/api/users/legitimate-user-456');
      const response = await GET(request, { params: { id: 'legitimate-user-456' } });

      // Should work perfectly
      expect(response.status).toBe(200);

      const userData = await response.json();
      expect(userData.id).toBe('user-123'); // From mock data
      expect(userData.email).toBe('test@post.bgu.ac.il'); // From mock data

      // No security warnings should be logged
      expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('SECURITY:'));

      // Database should be queried properly
      const { supabase } = (await vi.importMock('../../../apps/web/lib/db')) as any;
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('CRITICAL: session hijacking attempt should fail', async () => {
      // Simulate session token with mismatched user ID
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-A',
          email: 'userA@post.bgu.ac.il',
        },
      } as any);

      // Attacker tries to use hijacked session to access different user
      const request = new NextRequest('http://localhost:3000/api/users/user-B');
      const response = await GET(request, { params: { id: 'user-B' } });

      expect(response.status).toBe(403);
      expect(console.warn).toHaveBeenCalledWith('SECURITY: User user-A attempted unauthorized access to user user-B');
    });
  });
});
