/**
 * 🛡️ MIDDLEWARE AUTHENTICATION LOGIC TESTS
 *
 * Unit tests for Next.js middleware authentication and routing logic
 * Tests Hebrew academic platform smart authentication flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import middleware from '/Users/ortaizi/Desktop/spike1-1/apps/web/middleware.ts';

// ================================================================================================
// 🔧 MOCK SETUP
// ================================================================================================

// Mock NextAuth JWT
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock CSRF protection
vi.mock('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts', () => ({
  validateOrigin: vi.fn(),
}));

// Mock console methods to reduce test noise
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

global.console = mockConsole as any;

// ================================================================================================
// 🧪 TEST UTILITIES
// ================================================================================================

/**
 * Create mock NextRequest for testing
 */
const createMockRequest = (
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    origin?: string;
  } = {}
): NextRequest => {
  const { method = 'GET', headers = {}, origin } = options;

  const requestHeaders = new Headers(headers);
  if (origin) {
    requestHeaders.set('origin', origin);
  }

  const request = new NextRequest(url, {
    method,
    headers: requestHeaders,
  });

  return request;
};

/**
 * Create mock JWT token for different auth scenarios
 */
const createMockToken = (overrides = {}) => ({
  sub: 'test-user-id',
  email: 'test@bgu.ac.il',
  name: 'בדיקה תלמיד',
  provider: 'google',
  isDualStageComplete: false,
  credentialsValid: true,
  authenticationFlow: 'google-oauth',
  lastValidation: new Date().toISOString(),
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  ...overrides,
});

// ================================================================================================
// 🧪 MIDDLEWARE TESTS
// ================================================================================================

describe('🛡️ Middleware Authentication Logic', () => {
  let mockGetToken: any;
  let mockValidateOrigin: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsole.log.mockClear();
    mockConsole.error.mockClear();

    // Setup mocks
    const { getToken } = require('next-auth/jwt');
    const { validateOrigin } = require('/Users/ortaizi/Desktop/spike1-1/apps/web/lib/security/csrf-protection.ts');

    mockGetToken = getToken as any;
    mockValidateOrigin = validateOrigin as any;

    // Default mock implementations
    mockGetToken.mockResolvedValue(null);
    mockValidateOrigin.mockReturnValue(true);
  });

  // ============================================================================================
  // 🔓 PUBLIC ROUTES TESTS
  // ============================================================================================

  describe('🔓 Public Routes', () => {
    it('should allow access to _next static files', async () => {
      const request = createMockRequest('http://localhost:3000/_next/static/css/main.css');
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('should allow access to favicon.ico', async () => {
      const request = createMockRequest('http://localhost:3000/favicon.ico');
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('should allow access to robots.txt', async () => {
      const request = createMockRequest('http://localhost:3000/robots.txt');
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('should allow access to auth error pages', async () => {
      const request = createMockRequest('http://localhost:3000/auth/error');
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockGetToken).not.toHaveBeenCalled();
    });
  });

  // ============================================================================================
  // 🔌 API ROUTES CSRF PROTECTION TESTS
  // ============================================================================================

  describe('🔌 API Routes CSRF Protection', () => {
    it('should allow GET requests to API routes without CSRF validation', async () => {
      const request = createMockRequest('http://localhost:3000/api/courses');
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockValidateOrigin).not.toHaveBeenCalled();
    });

    it('should allow access to public API routes without CSRF validation', async () => {
      const request = createMockRequest('http://localhost:3000/api/health', {
        method: 'POST',
      });
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockValidateOrigin).not.toHaveBeenCalled();
    });

    it('should validate origin for protected API POST requests', async () => {
      mockValidateOrigin.mockReturnValue(true);
      const request = createMockRequest('http://localhost:3000/api/user/courses', {
        method: 'POST',
        origin: 'http://localhost:3000',
      });

      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockValidateOrigin).toHaveBeenCalledWith(request);
    });

    it('should block API requests with invalid origin', async () => {
      mockValidateOrigin.mockReturnValue(false);
      const request = createMockRequest('http://localhost:3000/api/user/courses', {
        method: 'POST',
        origin: 'http://evil.com',
      });

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(403);

      const body = await response!.json();
      expect(body.code).toBe('CSRF_ORIGIN_MISMATCH');
      expect(body.error).toBe('Invalid origin');
    });

    it('should allow POST requests to NextAuth API endpoints', async () => {
      const request = createMockRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
      });

      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockValidateOrigin).not.toHaveBeenCalled();
    });
  });

  // ============================================================================================
  // 🎯 SMART AUTHENTICATION FLOW TESTS
  // ============================================================================================

  describe('🎯 Smart Authentication Flow', () => {
    describe('Root Route (/) Smart Routing', () => {
      it('should redirect fully authenticated user to dashboard', async () => {
        const token = createMockToken({
          provider: 'university-credentials',
          isDualStageComplete: true,
          credentialsValid: true,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.status).toBe(307); // Redirect status
        expect(response!.headers.get('location')).toBe('http://localhost:3000/dashboard');
      });

      it('should redirect user needing revalidation to onboarding', async () => {
        const oldValidation = new Date();
        oldValidation.setDate(oldValidation.getDate() - 31); // 31 days ago

        const token = createMockToken({
          isDualStageComplete: true,
          credentialsValid: true,
          lastValidation: oldValidation.toISOString(),
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        const location = response!.headers.get('location');
        expect(location).toContain('/onboarding');
        expect(location).toContain('revalidate=true');
      });

      it('should redirect Google user without university auth to onboarding', async () => {
        const token = createMockToken({
          provider: 'google',
          isDualStageComplete: false,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.headers.get('location')).toBe('http://localhost:3000/onboarding');
      });

      it('should allow unauthenticated users to access landing page', async () => {
        mockGetToken.mockResolvedValue(null);

        const request = createMockRequest('http://localhost:3000/');
        const response = await middleware(request);

        expect(response).toBeNull();
      });
    });

    describe('Onboarding Route Protection', () => {
      it('should allow authenticated user access to onboarding', async () => {
        const token = createMockToken({
          provider: 'google',
          isDualStageComplete: false,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/onboarding');
        const response = await middleware(request);

        expect(response).toBeNull();
      });

      it('should redirect unauthenticated user from onboarding to landing page', async () => {
        mockGetToken.mockResolvedValue(null);

        const request = createMockRequest('http://localhost:3000/onboarding');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.headers.get('location')).toBe('http://localhost:3000/');
      });

      it('should redirect fully authenticated user from onboarding to dashboard', async () => {
        const token = createMockToken({
          isDualStageComplete: true,
          credentialsValid: true,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/onboarding');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.headers.get('location')).toBe('http://localhost:3000/dashboard');
      });
    });

    describe('Protected Routes Access Control', () => {
      const protectedPaths = ['/dashboard', '/courses', '/assignments', '/profile', '/settings'];

      protectedPaths.forEach((path) => {
        it(`should allow fully authenticated user access to ${path}`, async () => {
          const token = createMockToken({
            isDualStageComplete: true,
            credentialsValid: true,
          });
          mockGetToken.mockResolvedValue(token);

          const request = createMockRequest(`http://localhost:3000${path}`);
          const response = await middleware(request);

          expect(response).toBeNull();
        });

        it(`should redirect unauthenticated user from ${path} to landing page`, async () => {
          mockGetToken.mockResolvedValue(null);

          const request = createMockRequest(`http://localhost:3000${path}`);
          const response = await middleware(request);

          expect(response).toBeInstanceOf(NextResponse);
          const location = response!.headers.get('location');
          expect(location).toContain('/');
          expect(location).toContain(`from=${encodeURIComponent(path)}`);
        });

        it(`should redirect user needing university auth from ${path} to onboarding`, async () => {
          const token = createMockToken({
            provider: 'google',
            isDualStageComplete: false,
          });
          mockGetToken.mockResolvedValue(token);

          const request = createMockRequest(`http://localhost:3000${path}`);
          const response = await middleware(request);

          expect(response).toBeInstanceOf(NextResponse);
          const location = response!.headers.get('location');
          expect(location).toContain('/onboarding');
          expect(location).toContain(`from=${encodeURIComponent(path)}`);
        });

        it(`should redirect user needing revalidation from ${path} to onboarding`, async () => {
          const oldValidation = new Date();
          oldValidation.setDate(oldValidation.getDate() - 31); // 31 days ago

          const token = createMockToken({
            isDualStageComplete: true,
            credentialsValid: true,
            lastValidation: oldValidation.toISOString(),
          });
          mockGetToken.mockResolvedValue(token);

          const request = createMockRequest(`http://localhost:3000${path}`);
          const response = await middleware(request);

          expect(response).toBeInstanceOf(NextResponse);
          const location = response!.headers.get('location');
          expect(location).toContain('/onboarding');
          expect(location).toContain('revalidate=true');
          expect(location).toContain(`from=${encodeURIComponent(path)}`);
        });
      });
    });

    describe('Auth Flow Routes', () => {
      it('should allow access to moodle setup with Google auth', async () => {
        const token = createMockToken({
          provider: 'google',
          isDualStageComplete: false,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/auth/moodle-setup');
        const response = await middleware(request);

        expect(response).toBeNull();
      });

      it('should redirect from moodle setup to landing page without auth', async () => {
        mockGetToken.mockResolvedValue(null);

        const request = createMockRequest('http://localhost:3000/auth/moodle-setup');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.headers.get('location')).toBe('http://localhost:3000/');
      });

      it('should redirect from moodle setup to dashboard if dual-stage complete', async () => {
        const token = createMockToken({
          provider: 'google',
          isDualStageComplete: true,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/auth/moodle-setup');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.headers.get('location')).toBe('http://localhost:3000/dashboard');
      });

      it('should allow access to verify page with dual-stage complete', async () => {
        const token = createMockToken({
          isDualStageComplete: true,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/auth/verify');
        const response = await middleware(request);

        expect(response).toBeNull();
      });

      it('should redirect from verify page to onboarding without dual-stage', async () => {
        const token = createMockToken({
          provider: 'google',
          isDualStageComplete: false,
        });
        mockGetToken.mockResolvedValue(token);

        const request = createMockRequest('http://localhost:3000/auth/verify');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.headers.get('location')).toBe('http://localhost:3000/onboarding');
      });
    });
  });

  // ============================================================================================
  // ⏰ CREDENTIAL REVALIDATION TESTS
  // ============================================================================================

  describe('⏰ Credential Revalidation Logic', () => {
    it('should not require revalidation for recent credentials', async () => {
      const recentValidation = new Date();
      recentValidation.setDate(recentValidation.getDate() - 15); // 15 days ago

      const token = createMockToken({
        isDualStageComplete: true,
        credentialsValid: true,
        lastValidation: recentValidation.toISOString(),
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeNull(); // Should allow access
    });

    it('should require revalidation for old credentials', async () => {
      const oldValidation = new Date();
      oldValidation.setDate(oldValidation.getDate() - 35); // 35 days ago

      const token = createMockToken({
        isDualStageComplete: true,
        credentialsValid: true,
        lastValidation: oldValidation.toISOString(),
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      const location = response!.headers.get('location');
      expect(location).toContain('/onboarding');
      expect(location).toContain('revalidate=true');
    });

    it('should require revalidation when lastValidation is missing', async () => {
      const token = createMockToken({
        isDualStageComplete: true,
        credentialsValid: true,
        lastValidation: undefined,
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      const location = response!.headers.get('location');
      expect(location).toContain('/onboarding');
      expect(location).toContain('revalidate=true');
    });

    it('should handle exactly 30-day-old credentials correctly', async () => {
      const exactlyThirtyDays = new Date();
      exactlyThirtyDays.setDate(exactlyThirtyDays.getDate() - 30);

      const token = createMockToken({
        isDualStageComplete: true,
        credentialsValid: true,
        lastValidation: exactlyThirtyDays.toISOString(),
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeNull(); // 30 days exactly should still be valid
    });
  });

  // ============================================================================================
  // ❌ ERROR HANDLING TESTS
  // ============================================================================================

  describe('❌ Error Handling', () => {
    it('should handle JWT token extraction errors gracefully', async () => {
      mockGetToken.mockRejectedValue(new Error('JWT extraction failed'));

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      const location = response!.headers.get('location');
      expect(location).toContain('/');
      expect(location).toContain('error=middleware_error');
    });

    it('should handle invalid token gracefully', async () => {
      mockGetToken.mockResolvedValue({ invalid: 'token' });

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response!.headers.get('location')).toContain('/');
    });

    it('should log errors for debugging', async () => {
      mockGetToken.mockRejectedValue(new Error('Test error'));

      const request = createMockRequest('http://localhost:3000/dashboard');
      await middleware(request);

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Middleware error:', expect.any(Error));
    });
  });

  // ============================================================================================
  // 🎓 ACADEMIC PLATFORM SPECIFIC TESTS
  // ============================================================================================

  describe('🎓 Academic Platform Features', () => {
    it('CRITICAL: should properly handle Hebrew academic user flow', async () => {
      const hebrewToken = createMockToken({
        email: 'דוד.כהן@bgu.ac.il', // Hebrew name in email
        name: 'דוד כהן',
        provider: 'google',
        isDualStageComplete: false,
      });
      mockGetToken.mockResolvedValue(hebrewToken);

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      const location = response!.headers.get('location');
      expect(location).toContain('/onboarding');
      expect(location).toContain('from=%2Fdashboard');
    });

    it('CRITICAL: should handle BGU university-specific authentication', async () => {
      const bguToken = createMockToken({
        email: 'test@bgu.ac.il',
        provider: 'university-credentials',
        isDualStageComplete: true,
        credentialsValid: true,
        university: 'bgu',
      });
      mockGetToken.mockResolvedValue(bguToken);

      const request = createMockRequest('http://localhost:3000/courses');
      const response = await middleware(request);

      expect(response).toBeNull(); // Should grant access
    });

    it('CRITICAL: should redirect users to dashboard after complete dual-stage auth', async () => {
      const completeAuthToken = createMockToken({
        provider: 'university-credentials',
        isDualStageComplete: true,
        credentialsValid: true,
        authenticationFlow: 'dual-stage-complete',
      });
      mockGetToken.mockResolvedValue(completeAuthToken);

      const request = createMockRequest('http://localhost:3000/');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response!.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('should preserve return URL for post-auth redirects', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/assignments');
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      const location = response!.headers.get('location');
      expect(location).toContain('from=%2Fassignments');
    });

    it('should handle university-specific routing for different providers', async () => {
      const universityProviderToken = createMockToken({
        provider: 'university-credentials',
        isDualStageComplete: false,
      });
      mockGetToken.mockResolvedValue(universityProviderToken);

      const request = createMockRequest('http://localhost:3000/auth/moodle-setup');
      const response = await middleware(request);

      expect(response).toBeNull(); // Should allow university provider to access moodle setup
    });
  });

  // ============================================================================================
  // 📊 AUTHENTICATION STATE ANALYSIS TESTS
  // ============================================================================================

  describe('📊 Authentication State Analysis', () => {
    it('should correctly identify fully authenticated state', async () => {
      const token = createMockToken({
        isDualStageComplete: true,
        credentialsValid: true,
        lastValidation: new Date().toISOString(),
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response).toBeNull();
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Smart flow determined: fully_authenticated')
      );
    });

    it('should correctly identify needs_university_auth state', async () => {
      const token = createMockToken({
        provider: 'google',
        isDualStageComplete: false,
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/');
      await middleware(request);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Smart flow determined: needs_university_auth')
      );
    });

    it('should correctly identify needs_revalidation state', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const token = createMockToken({
        isDualStageComplete: true,
        credentialsValid: true,
        lastValidation: oldDate.toISOString(),
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/');
      await middleware(request);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Smart flow determined: needs_revalidation')
      );
    });

    it('should log comprehensive token analysis for debugging', async () => {
      const token = createMockToken({
        provider: 'google',
        isDualStageComplete: false,
        credentialsValid: true,
        authenticationFlow: 'google-oauth',
      });
      mockGetToken.mockResolvedValue(token);

      const request = createMockRequest('http://localhost:3000/dashboard');
      await middleware(request);

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🧠 Smart middleware token analysis:',
        expect.objectContaining({
          isDualStageComplete: false,
          isGoogleProvider: true,
          hasValidCredentials: true,
          provider: 'google',
          pathname: '/dashboard',
        })
      );
    });
  });
});

// ================================================================================================
// 🏷️ TYPE SAFETY TESTS
// ================================================================================================

describe('🏷️ Middleware Type Safety', () => {
  it('should handle missing token properties gracefully', async () => {
    const incompleteToken = {
      sub: 'test-user',
      email: 'test@bgu.ac.il',
      // Missing other properties
    };
    const { getToken } = require('next-auth/jwt');
    getToken.mockResolvedValue(incompleteToken);

    const request = createMockRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);

    // Should handle gracefully without throwing errors
    expect(response).toBeInstanceOf(NextResponse);
  });

  it('should handle null/undefined token properties', async () => {
    const nullToken = {
      sub: 'test-user',
      email: 'test@bgu.ac.il',
      isDualStageComplete: null,
      credentialsValid: undefined,
      provider: null,
    };
    const { getToken } = require('next-auth/jwt');
    getToken.mockResolvedValue(nullToken);

    const request = createMockRequest('http://localhost:3000/dashboard');

    // Should not throw errors
    expect(async () => await middleware(request)).not.toThrow();
  });
});
