'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Chrome } from 'lucide-react';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session) {
      console.log('User is authenticated, redirecting to onboarding');
      router.push('/onboarding');
    }
  }, [session, status, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await signIn('google', { 
        callbackUrl: '/onboarding',
        redirect: false 
      });

      if (result?.error) {
        setError('שגיאה בהתחברות עם Google');
        console.error('Google sign in error:', result.error);
      } else if (result?.ok) {
        console.log('Google sign in successful');
        // Redirect will be handled by useEffect
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('שגיאה בהתחברות עם Google');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            ברוכים הבאים ל-Spike
          </CardTitle>
          <CardDescription className="text-gray-600">
            פלטפורמת ניהול אקדמי לסטודנטים ישראלים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            התחבר עם Google
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            <p>התחברות עם Google מאפשרת גישה בטוחה למערכת</p>
            <p className="mt-1">לאחר ההתחברות תתבקש להזין פרטי מודל</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
