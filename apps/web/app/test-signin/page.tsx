'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestSignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      console.log('Session exists:', session);
      router.push('/onboarding');
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign in...');
      const result = await signIn('google', { 
        callbackUrl: '/onboarding',
        redirect: true 
      });
      console.log('Sign in result:', result);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-green-600 mb-4">התחברות מוצלחת!</h1>
          <div className="space-y-2 text-sm">
            <p><strong>שם:</strong> {session.user?.name}</p>
            <p><strong>מייל:</strong> {session.user?.email}</p>
            <p><strong>ID:</strong> {session.user?.id}</p>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            המשך לדף היכרות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          בדיקת התחברות Google
        </h1>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
        >
          <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          התחבר עם Google
        </button>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>בדיקת זרימת ההתחברות והעברה לonboarding</p>
        </div>
      </div>
    </div>
  );
}