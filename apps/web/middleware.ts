import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Enhanced Middleware for Dual-Stage Authentication System
 * Handles routing based on authentication stage completion
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  
  console.log(`🛡️ Middleware: ${pathname}`);
  
  // Skip middleware for public routes and static files
  const publicRoutes = [
    '/api', // All API routes handle their own auth
    '/_next', // Next.js static files
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/auth/signin', // Google OAuth entry point
    '/auth/error', // Auth error page
    '/', // Landing page (if exists)
  ];
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  try {
    // Get JWT token from NextAuth
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
    });
    
    console.log(`🎫 Token status: ${token ? 'present' : 'missing'}, provider: ${token?.provider}, dual-stage: ${token?.['isDualStageComplete']}`);
    
    // No token - redirect to signin
    if (!token) {
      console.log(`🔄 No token, redirecting to signin from ${pathname}`);
      url.pathname = '/auth/signin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    
    // Token exists - determine routing based on dual-stage completion
    const isDualStageComplete = token['isDualStageComplete'] === true;
    const isGoogleProvider = token.provider === 'google';
    const isDualStageProvider = token.provider === 'university-credentials';
    
    // === ROUTE PROTECTION LOGIC ===
    
    // Auth flow routes
    if (pathname.startsWith('/auth/')) {
      if (pathname === '/auth/signin') {
        // Already authenticated - redirect based on completion status
        if (isDualStageComplete) {
          console.log('🔄 Already dual-stage complete, redirecting to dashboard');
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        } else if (isGoogleProvider) {
          console.log('🔄 Google complete, redirecting to moodle setup');
          url.pathname = '/auth/moodle-setup';
          return NextResponse.redirect(url);
        }
      }
      
      if (pathname === '/auth/moodle-setup') {
        // Must have Google auth to access moodle setup
        if (!token || (!isGoogleProvider && !isDualStageProvider)) {
          console.log('🔄 No Google auth for moodle setup, redirecting to signin');
          url.pathname = '/auth/signin';
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
            url.pathname = '/auth/moodle-setup';
            return NextResponse.redirect(url);
          } else {
            url.pathname = '/auth/signin';
            return NextResponse.redirect(url);
          }
        }
      }
      
      // Allow access to auth routes
      return NextResponse.next();
    }
    
    // Onboarding route
    if (pathname.startsWith('/onboarding')) {
      // Must have at least Google auth for onboarding
      if (!token) {
        console.log('🔄 Onboarding requires auth');
        url.pathname = '/auth/signin';
        return NextResponse.redirect(url);
      }
      
      // Allow access to onboarding
      return NextResponse.next();
    }
    
    // Protected app routes (dashboard, courses, etc.)
    const protectedRoutes = ['/dashboard', '/courses', '/assignments', '/profile', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute) {
      // Must have completed dual-stage authentication
      if (!isDualStageComplete) {
        console.log('🔄 Protected route requires dual-stage complete');
        
        if (isGoogleProvider) {
          // Google complete but university pending
          console.log('🔄 Google complete, redirecting to moodle setup');
          url.pathname = '/auth/moodle-setup';
          return NextResponse.redirect(url);
        } else {
          // No authentication at all
          console.log('🔄 No auth, redirecting to signin');
          url.pathname = '/auth/signin';
          return NextResponse.redirect(url);
        }
      }
      
      // Check if credentials are still valid (optional - can be handled by session refresh)
      if (token['credentialsValid'] === false) {
        console.log('🔄 Credentials expired, redirecting to moodle setup');
        url.pathname = '/auth/moodle-setup';
        url.search = '?expired=true';
        return NextResponse.redirect(url);
      }
      
      // Allow access to protected routes
      console.log('✅ Access granted to protected route');
      return NextResponse.next();
    }
    
    // Default behavior for other routes
    return NextResponse.next();
    
  } catch (error) {
    console.error('❌ Middleware error:', error);
    
    // On error, redirect to signin for safety
    url.pathname = '/auth/signin';
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