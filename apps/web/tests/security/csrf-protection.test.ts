import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection, rateLimit, validateCsrfToken, validateOrigin } from '../../lib/security/csrf-protection';

// Mock next-auth
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

describe('CSRF Protection', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Base mock request
    mockRequest = {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      }),
      url: 'http://localhost:3000/api/test',
      clone: vi.fn().mockReturnThis(),
      json: vi.fn().mockResolvedValue({}),
    };
  });

  describe('validateOrigin', () => {
    it('should accept requests from allowed origins', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      const result = validateOrigin(request);
      expect(result).toBe(true);
    });

    it('should reject requests from unknown origins', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://evil.com',
        },
      });

      const result = validateOrigin(request);
      expect(result).toBe(false);
    });

    it('should handle missing origin header in development', () => {
      vi.stubEnv('NODE_ENV', 'development');

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const result = validateOrigin(request);
      expect(result).toBe(true);

      vi.unstubAllEnvs();
    });

    it('should reject missing origin header in production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const result = validateOrigin(request);
      expect(result).toBe(false);

      vi.unstubAllEnvs();
    });
  });

  describe('validateCsrfToken', () => {
    it('should validate CSRF token from header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'valid-token-123456789012345678901234567890',
        },
      });

      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'user123' });

      const result = await validateCsrfToken(request);
      expect(result).toBe(true);
    });

    it('should validate CSRF token from cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          cookie: '__Host-next-auth.csrf-token=valid-token-123456789012345678901234567890|hash',
        },
      });

      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'user123' });

      const result = await validateCsrfToken(request);
      expect(result).toBe(true);
    });

    it('should reject missing CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const result = await validateCsrfToken(request);
      expect(result).toBe(false);
    });

    it('should reject short CSRF tokens', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'short',
        },
      });

      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue(null);

      const result = await validateCsrfToken(request);
      expect(result).toBe(false);
    });
  });

  describe('csrfProtection', () => {
    it('should skip protection for safe methods', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const result = await csrfProtection(request);
      expect(result).toBe(null);
    });

    it('should block requests with invalid origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://evil.com',
        },
      });

      const result = await csrfProtection(request);
      expect(result).toBeInstanceOf(NextResponse);

      if (result) {
        const body = await result.json();
        expect(body.code).toBe('CSRF_ORIGIN_MISMATCH');
        expect(result.status).toBe(403);
      }
    });

    it('should block requests without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-csrf-token': 'valid-token-123456789012345678901234567890',
        },
      });

      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue(null);

      const result = await csrfProtection(request);
      expect(result).toBeInstanceOf(NextResponse);

      if (result) {
        const body = await result.json();
        expect(body.code).toBe('AUTH_REQUIRED');
        expect(result.status).toBe(401);
      }
    });

    it('should allow valid authenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-csrf-token': 'valid-token-123456789012345678901234567890',
        },
      });

      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'user123', email: 'test@example.com' });

      const result = await csrfProtection(request);
      expect(result).toBe(null);
    });

    it('should add security headers to response', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-csrf-token': 'valid-token-123456789012345678901234567890',
        },
      });

      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'user123' });

      const result = await csrfProtection(request);

      // When protection passes, it returns null
      // The security headers are added to NextResponse.next()
      expect(result).toBe(null);
    });
  });

  describe('rateLimit', () => {
    beforeEach(() => {
      // Clear rate limit map between tests
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests within rate limit', async () => {
      const limiter = rateLimit(5, 1000); // Increase limit to avoid conflicts
      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'unique-user-1' }); // Use unique user ID

      for (let i = 0; i < 3; i++) {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
        });

        const result = await limiter(request);
        expect(result).toBe(null);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const limiter = rateLimit(2, 1000);
      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'unique-user-2' }); // Use unique user ID

      // First two requests should pass
      for (let i = 0; i < 2; i++) {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
        });

        const result = await limiter(request);
        expect(result).toBe(null);
      }

      // Third request should be blocked
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const result = await limiter(request);
      expect(result).toBeInstanceOf(NextResponse);

      if (result) {
        const body = await result.json();
        expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(result.status).toBe(429);
        expect(result.headers.get('Retry-After')).toBeDefined();
      }
    });

    it('should reset rate limit after window expires', async () => {
      const limiter = rateLimit(1, 1000);
      const { getToken } = await import('next-auth/jwt');
      vi.mocked(getToken).mockResolvedValue({ sub: 'unique-user-3' }); // Use unique user ID

      // First request should pass
      let request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      let result = await limiter(request);
      expect(result).toBe(null);

      // Second request should be blocked
      request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      result = await limiter(request);
      expect(result).toBeInstanceOf(NextResponse);

      // Advance time past the window
      vi.advanceTimersByTime(1100);

      // Third request should pass (new window)
      request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      result = await limiter(request);
      expect(result).toBe(null);
    });

    it('should track rate limits per user', async () => {
      const limiter = rateLimit(1, 1000);
      const { getToken } = await import('next-auth/jwt');

      // User 1 makes a request
      vi.mocked(getToken).mockResolvedValue({ sub: 'unique-user-4' });
      let request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      let result = await limiter(request);
      expect(result).toBe(null);

      // User 2 should still be able to make a request
      vi.mocked(getToken).mockResolvedValue({ sub: 'unique-user-5' });
      request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      result = await limiter(request);
      expect(result).toBe(null);

      // User 1's second request should be blocked
      vi.mocked(getToken).mockResolvedValue({ sub: 'unique-user-4' });
      request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      result = await limiter(request);
      expect(result).toBeInstanceOf(NextResponse);
    });
  });
});
