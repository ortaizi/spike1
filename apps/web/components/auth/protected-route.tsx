'use client';

import { useAuth } from '../../lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();

  // DEV MODE: Skip authentication in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 DEV MODE: Bypassing ProtectedRoute authentication check');
    return <>{children}</>;
  }

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0066CC] mx-auto mb-4" />
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // Check authentication state
  if (requireAuth && !isAuthenticated) {
    console.log('🚫 ProtectedRoute: Access denied - not authenticated');
    console.log('🔍 Session:', session ? 'exists' : 'none');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    
    // Redirect to onboarding if user has Google session but no BGU auth
    if (session && session.user) {
      console.log('🔄 Has Google session, redirecting to onboarding');
      router.push('/onboarding');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0066CC] mx-auto mb-4" />
            <p className="text-gray-600">מעביר לעמוד ההרשמה...</p>
          </div>
        </div>
      );
    } else {
      console.log('🔄 No session, redirecting to landing page');
      router.push('/');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0066CC] mx-auto mb-4" />
            <p className="text-gray-600">מעביר לעמוד הכניסה...</p>
          </div>
        </div>
      );
    }
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
} 