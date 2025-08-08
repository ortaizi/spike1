import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for auth routes and static files
  if (pathname.startsWith('/api/auth') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico') ||
      pathname === '/auth/signin' ||
      pathname === '/auth/error') {
    return NextResponse.next()
  }
  
  // Check if user is authenticated
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // If not authenticated and trying to access protected routes, redirect to signin
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/user'))) {
    const signinUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(signinUrl)
  }
  
  // If authenticated and trying to access dashboard, allow access
  if (token && pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 