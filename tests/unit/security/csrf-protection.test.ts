/**
 * 🔒 CSRF PROTECTION UNIT TESTS
 *
 * Comprehensive testing for CSRF protection middleware,
 * origin validation, token validation, and rate limiting.
 *
 * Part of Phase 2: Unit Testing Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  csrfProtection,
  fetchWithCsrf,
  generateCsrfToken,
  getClientCsrfToken,
  rateLimit,
  validateCsrfToken,
  validateOrigin,
  withCsrfProtection,
} from '/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts';

// Mock NextAuth
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  getCsrfToken: vi.fn(),
}));

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'mock-csrf-token-32-characters-long'),
    })),
  },
}));

describe('🔒 CSRF Protection', () => {
  let mockGetToken: any;
  let mockGetCsrfToken: any;

  beforeEach(() => {
    // Reset environment variables using vi.stubEnv for test safety
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
    vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');

    // Setup mocks
    const { getToken } = require('next-auth/jwt');
    mockGetToken = getToken as any;
    mockGetToken.mockResolvedValue(null);

    const { getCsrfToken } = require('next-auth/react');
    mockGetCsrfToken = getCsrfToken as any;
    mockGetCsrfToken.mockResolvedValue('mock-csrf-token');

    // Clear console warnings/errors for clean test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('🌐 Origin Validation', () => {
    describe('✅ Valid Origins', () => {
      it('should accept requests from allowed localhost origins in development', () => {
        vi.stubEnv('NODE_ENV', 'development');

        const validOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
        ];

        validOrigins.forEach((origin) => {
          const request = new NextRequest('http://localhost:3000/api/test', {
            headers: { origin },
          });

          const isValid = validateOrigin(request);
          expect(isValid).toBe(true);
        });
      });

      it('should accept requests from NEXTAUTH_URL origin', () => {
        vi.stubEnv('NEXTAUTH_URL', 'https://spike.example.com');

        const request = new NextRequest('https://spike.example.com/api/test', {
          headers: { origin: 'https://spike.example.com' },
        });

        const isValid = validateOrigin(request);
        expect(isValid).toBe(true);
      });

      it('should accept requests with valid referer when origin is missing', () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          headers: { referer: 'http://localhost:3000/dashboard' },
        });

        const isValid = validateOrigin(request);
        expect(isValid).toBe(true);
      });

      it('should handle same-origin requests without origin/referer in development', () => {
        vi.stubEnv('NODE_ENV', 'development');

        const request = new NextRequest('http://localhost:3000/api/test');

        const isValid = validateOrigin(request);
        expect(isValid).toBe(true);
      });
    });

    describe('❌ Invalid Origins', () => {
      it('should reject requests from unauthorized origins', () => {
        const maliciousOrigins = [
          'https://evil-site.com',
          'https://malicious.example',
          'http://phishing-site.net',
          'https://attacker.com',
        ];

        maliciousOrigins.forEach((origin) => {
          const request = new NextRequest('http://localhost:3000/api/test', {
            headers: { origin },
          });

          const isValid = validateOrigin(request);
          expect(isValid).toBe(false);
        });
      });

      it('should reject requests without origin/referer in production', () => {
        vi.stubEnv('NODE_ENV', 'production');

        const request = new NextRequest('https://spike.example.com/api/test');

        const isValid = validateOrigin(request);
        expect(isValid).toBe(false);
      });

      it('should reject requests with malformed origin URLs', () => {
        const malformedOrigins = ['not-a-url', 'http://', 'https://', '://invalid', 'javascript:alert(1)'];

        malformedOrigins.forEach((origin) => {
          const request = new NextRequest('http://localhost:3000/api/test', {
            headers: { origin },
          });

          const isValid = validateOrigin(request);
          expect(isValid).toBe(false);
        });
      });
    });
  });

  describe('🔑 CSRF Token Validation', () => {
    describe('✅ Valid Tokens', () => {
      it('should validate CSRF token from X-CSRF-Token header', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
            'Content-Type': 'application/json',
          },
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(true);
      });

      it('should validate CSRF token from request body (JSON)', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csrfToken: 'valid-csrf-token-32-characters-long',
            data: 'test',
          }),
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(true);
      });

      it('should validate CSRF token from form data', async () => {
        const formData = new FormData();
        formData.append('csrfToken', 'valid-csrf-token-32-characters-long');
        formData.append('data', 'test');

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(true);
      });

      it('should validate CSRF token from NextAuth cookie', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Cookie: 'next-auth.csrf-token=valid-csrf-token-32-characters-long%7Chash; other-cookie=value',
          },
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(true);
      });

      it('should validate CSRF token for authenticated users', async () => {
        mockGetToken.mockResolvedValue({
          sub: 'user-123',
          email: 'test@post.bgu.ac.il',
        });

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': 'valid-csrf-token',
          },
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(true);
      });
    });

    describe('❌ Invalid Tokens', () => {
      it('should reject requests without CSRF token', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(false);
      });

      it('should reject requests with short CSRF tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': 'short-token',
          },
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(false);
      });

      it('should handle token validation errors gracefully', async () => {
        mockGetToken.mockRejectedValue(new Error('Token validation failed'));

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
          },
        });

        const isValid = await validateCsrfToken(request);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('🔐 CSRF Token Generation', () => {
    it('should generate CSRF tokens of correct length', () => {
      const token = generateCsrfToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes as hex = 64 characters
    });

    it('should generate unique tokens', () => {
      const tokens = Array.from({ length: 10 }, () => generateCsrfToken());
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });

  describe('🛡️ CSRF Protection Middleware', () => {
    describe('✅ Safe Methods', () => {
      it('should allow GET requests without CSRF protection', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'GET',
        });

        const response = await csrfProtection(request);
        expect(response).toBeNull(); // Should continue to handler
      });

      it('should allow HEAD requests without CSRF protection', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'HEAD',
        });

        const response = await csrfProtection(request);
        expect(response).toBeNull();
      });

      it('should allow OPTIONS requests without CSRF protection', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'OPTIONS',
        });

        const response = await csrfProtection(request);
        expect(response).toBeNull();
      });
    });

    describe('🔒 Protected Methods', () => {
      it('should block POST requests with invalid origin', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Origin: 'https://evil-site.com',
            'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
          },
        });

        const response = await csrfProtection(request);
        expect(response).toBeInstanceOf(NextResponse);

        if (response) {
          expect(response.status).toBe(403);
          const data = await response.json();
          expect(data.code).toBe('CSRF_ORIGIN_MISMATCH');
        }
      });

      it('should block POST requests without valid CSRF token', async () => {
        vi.stubEnv('NODE_ENV', 'development');

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Origin: 'http://localhost:3000',
          },
        });

        const response = await csrfProtection(request);
        expect(response).toBeInstanceOf(NextResponse);

        if (response) {
          expect(response.status).toBe(403);
          const data = await response.json();
          expect(data.code).toBe('CSRF_TOKEN_INVALID');
        }
      });

      it('should block requests without valid session', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        mockGetToken.mockResolvedValue(null); // No session

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Origin: 'http://localhost:3000',
            'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
          },
        });

        const response = await csrfProtection(request);
        expect(response).toBeInstanceOf(NextResponse);

        if (response) {
          expect(response.status).toBe(401);
          const data = await response.json();
          expect(data.code).toBe('AUTH_REQUIRED');
        }
      });

      it('should allow valid authenticated POST requests', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        mockGetToken.mockResolvedValue({
          sub: 'user-123',
          email: 'test@post.bgu.ac.il',
        });

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Origin: 'http://localhost:3000',
            'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
          },
        });

        const response = await csrfProtection(request);
        expect(response).toBeNull(); // Should continue to handler
      });
    });

    describe('⚙️ Configuration Options', () => {
      it('should skip origin check when configured', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Origin: 'https://evil-site.com',
            'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
          },
        });

        const response = await csrfProtection(request, { skipOriginCheck: true });
        // Should fail on session check instead of origin check
        expect(response?.status).toBe(401); // AUTH_REQUIRED instead of 403
      });

      it('should skip token check when configured', async () => {
        vi.stubEnv('NODE_ENV', 'development');

        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            Origin: 'http://localhost:3000',
            // No CSRF token
          },
        });

        const response = await csrfProtection(request, { skipTokenCheck: true });
        // Should fail on session check instead of token check
        expect(response?.status).toBe(401); // AUTH_REQUIRED instead of 403
      });
    });
  });

  describe('🔄 Higher-Order Function Wrapper', () => {
    it('should wrap API handlers with CSRF protection', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));

      const protectedHandler = withCsrfProtection(mockHandler);

      // Test with invalid request (should be blocked)
      const invalidRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { Origin: 'https://evil-site.com' },
      });

      const response = await protectedHandler(invalidRequest);
      expect(response).toBeInstanceOf(NextResponse);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call original handler for valid requests', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@post.bgu.ac.il',
      });

      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));

      const protectedHandler = withCsrfProtection(mockHandler);

      const validRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:3000',
          'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
        },
      });

      await protectedHandler(validRequest);
      expect(mockHandler).toHaveBeenCalledWith(validRequest);
    });
  });

  describe('🌐 Client-Side CSRF Token Helpers', () => {
    describe('🔑 Get Client CSRF Token', () => {
      it('should get CSRF token from NextAuth in browser environment', async () => {
        // Mock browser environment
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
        });

        mockGetCsrfToken.mockResolvedValue('client-csrf-token');

        const token = await getClientCsrfToken();
        expect(token).toBe('client-csrf-token');
        expect(mockGetCsrfToken).toHaveBeenCalled();

        // Cleanup
        delete (global as any).window;
      });

      it('should return null in server environment', async () => {
        // Ensure we're in server environment
        delete (global as any).window;

        const token = await getClientCsrfToken();
        expect(token).toBeNull();
      });

      it('should handle errors gracefully', async () => {
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
        });

        mockGetCsrfToken.mockRejectedValue(new Error('Failed to get token'));

        const token = await getClientCsrfToken();
        expect(token).toBeNull();

        delete (global as any).window;
      });
    });

    describe('🔄 Fetch with CSRF', () => {
      it('should include CSRF token in fetch requests', async () => {
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
        });

        mockGetCsrfToken.mockResolvedValue('fetch-csrf-token');

        const mockFetch = vi.fn().mockResolvedValue(new Response('{"success": true}', { status: 200 }));
        global.fetch = mockFetch;

        await fetchWithCsrf('/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
          headers: expect.any(Headers),
          credentials: 'same-origin',
        });

        const callArgs = mockFetch.mock.calls[0];
        const headers = callArgs[1].headers as Headers;
        expect(headers.get('X-CSRF-Token')).toBe('fetch-csrf-token');

        delete (global as any).window;
      });
    });
  });

  describe('⚡ Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limit map for clean tests
      const { rateLimitMap } = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts');
      if (rateLimitMap) {
        rateLimitMap.clear();
      }
    });

    it('should allow requests within rate limit', async () => {
      const rateLimit5 = rateLimit(5, 60000); // 5 requests per minute

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });

      // Make 5 requests - all should pass
      for (let i = 0; i < 5; i++) {
        const response = await rateLimit5(request);
        expect(response).toBeNull();
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const rateLimit2 = rateLimit(2, 60000); // 2 requests per minute

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '192.168.1.2' },
      });

      // First 2 requests should pass
      expect(await rateLimit2(request)).toBeNull();
      expect(await rateLimit2(request)).toBeNull();

      // Third request should be blocked
      const response = await rateLimit2(request);
      expect(response).toBeInstanceOf(NextResponse);

      if (response) {
        expect(response.status).toBe(429);
        const data = await response.json();
        expect(data.code).toBe('RATE_LIMIT_EXCEEDED');

        // Check rate limiting headers
        expect(response.headers.get('Retry-After')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Limit')).toBe('2');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      }
    });

    it('should use authenticated user ID for rate limiting', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-456',
        email: 'test@post.bgu.ac.il',
      });

      const rateLimit1 = rateLimit(1, 60000); // 1 request per minute

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      // First request should pass
      expect(await rateLimit1(request)).toBeNull();

      // Second request should be blocked
      const response = await rateLimit1(request);
      expect(response?.status).toBe(429);
    });

    it('should reset rate limit after time window', async () => {
      const rateLimit1 = rateLimit(1, 100); // 1 request per 100ms

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '192.168.1.3' },
      });

      // First request should pass
      expect(await rateLimit1(request)).toBeNull();

      // Second request should be blocked
      expect((await rateLimit1(request))?.status).toBe(429);

      // Wait for window to reset
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Third request should pass after reset
      expect(await rateLimit1(request)).toBeNull();
    });
  });

  describe('🧪 CRITICAL: Security Integration Tests', () => {
    it('CRITICAL: should prevent CSRF attacks from malicious origins', async () => {
      const maliciousRequest = new NextRequest('http://localhost:3000/api/sensitive', {
        method: 'POST',
        headers: {
          Origin: 'https://malicious-site.com',
          'X-CSRF-Token': 'stolen-or-forged-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete-account',
          userId: '123',
        }),
      });

      const response = await csrfProtection(maliciousRequest);
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(403);

      const data = await response?.json();
      expect(data.code).toBe('CSRF_ORIGIN_MISMATCH');
    });

    it('CRITICAL: should prevent requests without proper authentication', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockGetToken.mockResolvedValue(null); // No session

      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:3000',
          'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
        },
      });

      const response = await csrfProtection(request);
      expect(response?.status).toBe(401);

      const data = await response?.json();
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('CRITICAL: should enforce rate limiting to prevent abuse', async () => {
      const strictRateLimit = rateLimit(3, 60000); // Very strict: 3 per minute

      const request = new NextRequest('http://localhost:3000/api/sensitive', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '192.168.1.100' },
      });

      // Exhaust the rate limit
      for (let i = 0; i < 3; i++) {
        expect(await strictRateLimit(request)).toBeNull();
      }

      // Further requests should be blocked
      const response = await strictRateLimit(request);
      expect(response?.status).toBe(429);
    });

    it('CRITICAL: should validate complete security chain for protected operations', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockGetToken.mockResolvedValue({
        sub: 'user-789',
        email: 'authorized@post.bgu.ac.il',
      });

      // Simulate a complete secure request
      const secureRequest = new NextRequest('http://localhost:3000/api/protected-operation', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:3000',
          'X-CSRF-Token': 'valid-csrf-token-32-characters-long',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (legitimate browser)',
        },
        body: JSON.stringify({
          operation: 'update-profile',
          data: { name: 'Updated Name' },
        }),
      });

      // Apply both CSRF protection and rate limiting
      const rateLimitResponse = await rateLimit(10, 60000)(secureRequest);
      expect(rateLimitResponse).toBeNull();

      const csrfResponse = await csrfProtection(secureRequest);
      expect(csrfResponse).toBeNull();

      // Request should pass all security checks
    });
  });
});
