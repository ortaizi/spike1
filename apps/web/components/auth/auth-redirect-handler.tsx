'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthRedirectHandlerProps {
  children: React.ReactNode;
}

/**
 * Smart Authentication Redirect Handler
 * 
 * This component handles automatic redirection based on user setup completion status:
 * - If user has Google session but setup is incomplete -> redirect to onboarding
 * - If user has complete setup -> redirect to dashboard
 * - If no session -> stay on current page
 * 
 * This replaces the disabled middleware logic to prevent infinite loops
 * while still providing the smart routing functionality.
 */
export function AuthRedirectHandler({ children }: AuthRedirectHandlerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Don't run on server side or during loading
    if (status === 'loading' || typeof window === 'undefined') {
      return;
    }

    // Only run the redirect check once per session change
    if (hasChecked && status !== 'loading') {
      setIsChecking(false);
      return;
    }

    const checkAndRedirect = async () => {
      try {
        console.log('🔄 AuthRedirectHandler: Checking user setup status...', {
          hasSession: !!session,
          email: session?.user?.email,
          pathname: window.location.pathname
        });

        // If no session, don't redirect (let user stay on landing page)
        if (!session?.user?.email) {
          console.log('🔄 AuthRedirectHandler: No session found, staying on current page');
          setIsChecking(false);
          setHasChecked(true);
          return;
        }

        // Only run on specific pages where redirect logic should apply
        const currentPath = window.location.pathname;
        const shouldRunRedirect = 
          currentPath === '/' || // Landing page
          currentPath.startsWith('/api/auth/callback'); // OAuth callback pages
        
        if (!shouldRunRedirect) {
          console.log('🔄 AuthRedirectHandler: Not on a page that needs redirect logic, skipping');
          setIsChecking(false);
          setHasChecked(true);
          return;
        }

        // Skip check if already on onboarding or dashboard pages to prevent loops
        if (currentPath === '/onboarding' || currentPath === '/dashboard') {
          console.log('🔄 AuthRedirectHandler: Already on target page, skipping redirect');
          setIsChecking(false);
          setHasChecked(true);
          return;
        }

        // Check user's setup completion status
        const response = await fetch('/api/user/onboarding', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('❌ AuthRedirectHandler: Failed to fetch setup status');
          setIsChecking(false);
          setHasChecked(true);
          return;
        }

        const data = await response.json();
        console.log('🔍 AuthRedirectHandler: Setup status result:', data);

        // Redirect based on setup completion
        if (data.onboardingCompleted) {
          console.log('✅ AuthRedirectHandler: Setup complete, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('🔄 AuthRedirectHandler: Setup incomplete, redirecting to onboarding');
          router.push('/onboarding');
        }

      } catch (error) {
        console.error('❌ AuthRedirectHandler: Error checking setup status:', error);
      } finally {
        setIsChecking(false);
        setHasChecked(true);
      }
    };

    checkAndRedirect();
  }, [session, status, router, hasChecked]);

  // Reset hasChecked when session changes (user logs out/in)
  useEffect(() => {
    setHasChecked(false);
    setIsChecking(true);
  }, [session?.user?.email]);

  // Show loading while checking
  if (isChecking && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">בודק סטטוס החשבון...</p>
        </div>
      </div>
    );
  }

  // Render children normally
  return <>{children}</>;
}