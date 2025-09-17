'use client';

import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SmartRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [_checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUserSetupStatus() {
      if (status === 'loading') return;

      if (!session?.user?.email) {
        console.log('🔄 No session, redirecting to landing page');
        router.push('/');
        return;
      }

      try {
        console.log('🔍 Checking user setup status for smart redirect');

        // Check user setup status
        const response = await fetch('/api/user/onboarding');
        const data = await response.json();

        if (data.onboardingCompleted) {
          console.log('✅ User fully setup, redirecting to dashboard');
          router.replace('/dashboard');
        } else {
          console.log('🔄 User needs setup, redirecting to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('❌ Error checking setup status:', error);
        // Fallback to onboarding on error
        router.push('/onboarding');
      } finally {
        setChecking(false);
      }
    }

    checkUserSetupStatus();
  }, [session, status, router]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='text-center'>
        <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-[#0066CC]' />
        <p className='text-gray-600'>בודק סטטוס הגדרת החשבון...</p>
        <p className='mt-2 text-sm text-gray-500'>מכין לך את החוויה הטובה ביותר</p>
      </div>
    </div>
  );
}
