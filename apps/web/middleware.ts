import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateOrigin } from "./lib/security/csrf-protection";

/**
 * Smart Authentication Middleware for Spike Platform
 * Handles intelligent routing based on credential status and authentication flow
 * Integrates with the smart authentication system
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  
  console.log(`🛡️ Smart Middleware: ENABLED - Processing ${pathname}`);

  // Skip middleware for public routes and static files
  const publicRoutes = [
    '/_next', // Next.js static files
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/auth/error', // Auth error page
  ];

  // API routes need origin validation for CSRF protection
  if (pathname.startsWith('/api')) {
    // Skip CSRF for specific public API endpoints
    const publicApiRoutes = [
      '/api/health',
      '/api/universities',
      '/api/auth/csrf', // NextAuth CSRF endpoint
      '/api/auth/providers', // NextAuth providers
      '/api/auth/session', // Session checks
    ];

    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route));

    // For protected API routes, validate origin
    if (!isPublicApi && request.method !== 'GET') {
      const isValidOrigin = validateOrigin(request);
      if (!isValidOrigin) {
        console.log(`🚫 CSRF: Invalid origin for ${pathname}`);
        return NextResponse.json(
          { error: 'Invalid origin', code: 'CSRF_ORIGIN_MISMATCH' },
          { status: 403 }
        );
      }
    }

    // Let API routes handle their own auth and CSRF token validation
    return NextResponse.next();
  }
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    console.log(`🔓 Public route detected: ${pathname}`);
    return NextResponse.next();
  }
  
  console.log(`🔒 Protected route processing: ${pathname}`);
  
  try {
    // Get JWT token from NextAuth
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
    });
    
    console.log(`🎫 Token extraction attempt: ${token ? 'SUCCESS' : 'FAILED'}`);
    
    if (token) {
      console.log(`🔍 Token details:`, {
        provider: token.provider,
        isDualStageComplete: token['isDualStageComplete'],
        credentialsValid: token['credentialsValid'],
        email: token.email,
        sub: token.sub
      });
    } else {
      console.log(`🚫 No token found - this might be the cause of auth issues`);
    }
    
    // Enhanced token analysis for smart authentication (with null safety)
    const isDualStageComplete = token?.['isDualStageComplete'] === true;
    const isGoogleProvider = token?.provider === 'google';
    const isDualStageProvider = token?.provider === 'university-credentials';
    const hasValidCredentials = token?.['credentialsValid'] !== false;
    const authenticationFlow = token?.['authenticationFlow'] as string || 'unknown';
    const lastValidation = token?.['lastValidation'] as string;
    
    console.log('🧠 Smart middleware token analysis:', {
      isDualStageComplete,
      isGoogleProvider,
      isDualStageProvider,
      hasValidCredentials,
      authenticationFlow,
      lastValidation,
      provider: token?.provider,
      pathname
    });

    // Helper function to check if credentials need revalidation
    const needsCredentialRevalidation = () => {
      if (!lastValidation) return true;
      
      const validationDate = new Date(lastValidation);
      const now = new Date();
      const daysSinceValidation = (now.getTime() - validationDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Require revalidation after 30 days
      return daysSinceValidation > 30;
    };

    // Determine smart routing flow
    const determineSmartFlow = () => {
      if (!token) return 'no_auth';
      if (isDualStageComplete && hasValidCredentials && !needsCredentialRevalidation()) return 'fully_authenticated';
      if (isDualStageComplete && (!hasValidCredentials || needsCredentialRevalidation())) return 'needs_revalidation';
      if (isGoogleProvider && !isDualStageComplete) return 'needs_university_auth';
      return 'partial_auth';
    };

    const smartFlow = determineSmartFlow();
    console.log(`🚀 Smart flow determined: ${smartFlow}`);
    
    // === SMART ROUTE PROTECTION LOGIC ===
    
    // Auth flow routes
    if (pathname.startsWith('/auth/')) {
      
      if (pathname === '/auth/moodle-setup') {
        // Must have Google auth to access moodle setup
        if (!token || (!isGoogleProvider && !isDualStageProvider)) {
          console.log('🔄 No Google auth for moodle setup, redirecting to landing page');
          url.pathname = '/';
          return NextResponse.redirect(url);
        }
        
        // Already completed dual-stage - redirect to dashboard
        if (isDualStageComplete) {
          console.log('🔄 Dual-stage complete, redirecting to dashboard');
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      }
      
      if (pathname === '/auth/verify') {
        // Must have completed dual-stage auth to see verification
        if (!isDualStageComplete) {
          console.log('🔄 Verification requires dual-stage complete');
          if (isGoogleProvider) {
            url.pathname = '/onboarding';
            return NextResponse.redirect(url);
          } else {
            url.pathname = '/';
            return NextResponse.redirect(url);
          }
        }
      }
      
      // Allow access to auth routes
      return NextResponse.next();
    }
    
    // Onboarding route - allow access if user has Google auth
    if (pathname.startsWith('/onboarding')) {
      // Must have at least Google auth for onboarding
      if (!token) {
        console.log('🔄 Onboarding requires auth');
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
      
      // If already fully authenticated, redirect to dashboard
      if (smartFlow === 'fully_authenticated') {
        console.log('🔄 Already fully authenticated, redirecting from onboarding to dashboard');
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      
      // Allow access to onboarding
      console.log('✅ Allowing access to onboarding');
      return NextResponse.next();
    }
    
    // Smart root route handling
    if (pathname === '/') {
      console.log(`🏠 Root route with smart flow: ${smartFlow}`);
      
      switch (smartFlow) {
        case 'fully_authenticated':
          console.log('🔄 Fully authenticated, redirecting to dashboard');
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
          
        case 'needs_revalidation':
          console.log('🔄 Credentials need revalidation, redirecting to onboarding');
          url.pathname = '/onboarding';
          url.search = '?revalidate=true';
          return NextResponse.redirect(url);
          
        case 'needs_university_auth':
          console.log('🔄 Google complete but needs university auth, redirecting to onboarding');
          url.pathname = '/onboarding';
          return NextResponse.redirect(url);
          
        case 'no_auth':
        default:
          console.log('🔄 No authentication, allowing access to landing page');
          return NextResponse.next();
      }
    }
    
    // Protected app routes (dashboard, courses, etc.)
    const protectedRoutes = ['/dashboard', '/courses', '/assignments', '/profile', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute) {
      console.log(`🔒 Accessing protected route ${pathname} with smart flow: ${smartFlow}`);
      
      switch (smartFlow) {
        case 'fully_authenticated':
          console.log('✅ Full authentication verified, granting access to protected route');
          return NextResponse.next();
          
        case 'needs_revalidation':
          console.log('🔄 Credentials need revalidation, redirecting to onboarding');
          url.pathname = '/onboarding';
          url.search = '?revalidate=true&from=' + encodeURIComponent(pathname);
          return NextResponse.redirect(url);
          
        case 'needs_university_auth':
          console.log('🔄 Google complete but needs university auth, redirecting to onboarding');
          url.pathname = '/onboarding';
          url.search = '?from=' + encodeURIComponent(pathname);
          return NextResponse.redirect(url);
          
        case 'partial_auth':
          console.log('🔄 Partial authentication, redirecting to complete setup');
          if (isGoogleProvider) {
            url.pathname = '/onboarding';
            url.search = '?from=' + encodeURIComponent(pathname);
          } else {
            url.pathname = '/';
            url.search = '?from=' + encodeURIComponent(pathname);
          }
          return NextResponse.redirect(url);
          
        case 'no_auth':
        default:
          console.log('🔄 No authentication, redirecting to landing page');
          url.pathname = '/';
          url.search = '?from=' + encodeURIComponent(pathname);
          return NextResponse.redirect(url);
      }
    }
    
    // Default behavior for other routes
    return NextResponse.next();
    
  } catch (error) {
    console.error('❌ Middleware error:', error);
    
    // On error, redirect to landing page for safety
    url.pathname = '/';
    url.search = '?error=middleware_error';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, etc. (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}; 