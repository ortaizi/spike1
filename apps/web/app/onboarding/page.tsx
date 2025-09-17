'use client';

import { useSession } from 'next-auth/react';
// import { getCsrfToken } from 'next-auth/react'; // TODO: Use when implementing CSRF tokens
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useCsrfToken } from '../../hooks/use-csrf-token';
import {
  FORM_VALIDATION_HE,
  getHebrewErrorMessage,
  validateUniversityEmail,
} from '../../lib/auth/hebrew-auth-errors';

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { secureFetch } = useCsrfToken();
  const [isLoading, _setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [universityPassword, setUniversityPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // Check if onboarding is already completed
    const checkOnboardingStatus = async () => {
      try {
        const response = await secureFetch('/api/user/onboarding');
        if (response.ok) {
          const data = await response.json();
          if (data.onboardingCompleted) {
            console.log('User already completed onboarding, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [session, status, router, mounted, secureFetch]);

  // Extract user info from email
  const extractUserInfoFromEmail = (email: string) => {
    const [username, domain] = email.split('@');

    // Identify university by domain
    let university = '';
    let universityName = '';

    if (domain.includes('post.bgu.ac.il')) {
      university = 'bgu';
      universityName = 'אוניברסיטת בן-גוריון בנגב';
    } else if (domain.includes('technion.ac.il')) {
      university = 'technion';
      universityName = 'הטכניון';
    } else if (domain.includes('huji.ac.il')) {
      university = 'huji';
      universityName = 'האוניברסיטה העברית';
    } else if (domain.includes('tau.ac.il')) {
      university = 'tau';
      universityName = 'אוניברסיטת תל אביב';
    } else {
      university = 'unknown';
      universityName = 'אוניברסיטה לא מוכרת';
    }

    return { username, university, universityName };
  };

  // Test university connection
  const testUniversityConnection = async (): Promise<boolean> => {
    if (!universityPassword.trim()) {
      toast.error(FORM_VALIDATION_HE.FieldEmpty);
      return false;
    }

    if (universityPassword.length < 4) {
      toast.error(FORM_VALIDATION_HE.PasswordTooShort);
      return false;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      const userInfo = extractUserInfoFromEmail(session?.user?.email || '');

      // Validate email domain first
      const emailValidation = validateUniversityEmail(session?.user?.email || '');
      if (!emailValidation.isValid) {
        setConnectionStatus('error');
        toast.error(emailValidation.error || 'כתובת מייל לא תקפה');
        return false;
      }

      console.log(`🔐 Testing connection for ${userInfo.username}`);

      const response = await secureFetch('/api/moodle/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: universityPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus('success');
        setIsRedirecting(true);
        toast.success('התחברות למערכת האוניברסיטה הצליחה! מעביר לדשבורד...');

        // Force session update to refresh the JWT token with new dual-stage status
        try {
          console.log('🔄 Forcing session update after successful authentication...');
          await update(); // This should trigger JWT callback with trigger='update'

          // Additional delay to ensure session update is processed
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log('✅ Session updated with dual-stage completion');
        } catch (updateError) {
          console.error('❌ Error updating session:', updateError);
        }

        // Redirect to dashboard immediately after successful authentication
        setTimeout(() => {
          console.log('🚀 Redirecting to dashboard after successful authentication');
          router.push('/dashboard');
        }, 1000); // Quick redirect to dashboard

        return true;
      } else {
        setConnectionStatus('error');
        const hebrewError = getHebrewErrorMessage(result.errorCode || 'MoodleAuthFailed');
        toast.error(result.error || hebrewError.message);
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      const hebrewError = getHebrewErrorMessage('NetworkError');
      toast.error(hebrewError.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleComplete = async () => {
    if (!session?.user?.email) return;

    // Test university connection first
    const isConnectionSuccessful = await testUniversityConnection();

    if (!isConnectionSuccessful) {
      return; // Don't proceed if connection failed
    }

    // Since testUniversityConnection() already handles the redirect and onboarding completion
    // via the /api/moodle/validate endpoint, we don't need to do anything else here.
    // The user will be automatically redirected to the dashboard.
  };

  // Show loading state while session is loading or component is not mounted
  if (status === 'loading' || !mounted) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // Redirect to landing page if not authenticated
  if (!session) {
    return null; // Will redirect in useEffect
  }

  const userInfo = extractUserInfoFromEmail(session.user.email || '');

  return (
    <div
      dir='rtl'
      className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'
    >
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-3xl font-bold text-gray-900'>ברוכים הבאים ל-Spike</h1>
          <p className='text-gray-600'>פלטפורמת ניהול אקדמי חכמה לסטודנטים ישראלים</p>
        </div>

        {/* Main Card */}
        <Card className='w-full border-0 bg-white/80 shadow-xl backdrop-blur-sm'>
          <CardHeader className='pb-6 text-center'>
            <CardTitle className='text-xl font-semibold text-gray-900'>פרטי החשבון שלך</CardTitle>
            <CardDescription className='text-gray-600'>
              המידע הבא זוהה אוטומטית מהמייל שלך
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Username */}
            <div className='flex items-center gap-4 rounded-lg bg-gray-50 p-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                <User className='h-5 w-5 text-blue-600' />
              </div>
              <div className='flex-1'>
                <p className='mb-1 text-sm text-gray-600'>שם משתמש</p>
                <p className='font-semibold text-gray-900'>{userInfo.username}</p>
              </div>
              <CheckCircle className='h-5 w-5 text-green-500' />
            </div>

            {/* Email */}
            <div className='flex items-center gap-4 rounded-lg bg-gray-50 p-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                <Mail className='h-5 w-5 text-green-600' />
              </div>
              <div className='flex-1'>
                <p className='mb-1 text-sm text-gray-600'>כתובת מייל</p>
                <p className='text-sm font-semibold text-gray-900'>{session.user.email}</p>
              </div>
              <CheckCircle className='h-5 w-5 text-green-500' />
            </div>

            {/* University */}
            <div className='flex items-center gap-4 rounded-lg bg-gray-50 p-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                <GraduationCap className='h-5 w-5 text-purple-600' />
              </div>
              <div className='flex-1'>
                <p className='mb-1 text-sm text-gray-600'>מוסד לימודים</p>
                <p className='font-semibold text-gray-900'>{userInfo.universityName}</p>
              </div>
              <CheckCircle className='h-5 w-5 text-green-500' />
            </div>

            {/* Password Field */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
                  <Lock className='h-5 w-5 text-orange-600' />
                </div>
                <div className='flex-1'>
                  <Label htmlFor='university-password' className='text-sm text-gray-600'>
                    סיסמת מערכת האוניברסיטה
                  </Label>
                  <p className='mt-1 text-xs text-gray-500'>
                    נדרשת להתחברות למודל ומערכות האוניברסיטה
                  </p>
                </div>
              </div>

              <Input
                id='university-password'
                type='password'
                placeholder='הזן את הסיסמה שלך למערכת האוניברסיטה'
                value={universityPassword}
                onChange={(e) => setUniversityPassword(e.target.value)}
                disabled={isConnecting}
                className='w-full text-right'
                dir='rtl'
              />

              {/* Connection Status */}
              {connectionStatus === 'success' && (
                <div className='flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm text-green-800'>
                    {isRedirecting
                      ? 'התחברות הצליחה! מעביר לדשבורד...'
                      : 'התחברות למערכת האוניברסיטה הצליחה!'}
                  </span>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3'>
                  <AlertCircle className='h-4 w-4 text-red-600' />
                  <span className='text-sm text-red-800'>
                    שגיאה בהתחברות. אנא בדוק את הסיסמה ונסה שוב.
                  </span>
                </div>
              )}

              {/* Security Info */}
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
                <p className='text-xs text-blue-800'>
                  🔒 הסיסמה שלך נשמרת באופן מאובטח ואיננה נשמרת במערכת שלנו. היא משמשת רק להתחברות
                  למערכות האוניברסיטה שלך.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3 pt-4'>
              <Button
                onClick={handleComplete}
                disabled={isLoading || isConnecting || isRedirecting || !universityPassword.trim()}
                className='w-full rounded-lg bg-blue-600 py-3 text-base font-medium text-white shadow-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading || isConnecting || isRedirecting ? (
                  <div className='flex items-center justify-center'>
                    <div className='me-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white'></div>
                    {isRedirecting
                      ? 'מעביר לדשבורד...'
                      : isConnecting
                        ? 'בודק התחברות...'
                        : 'טוען...'}
                  </div>
                ) : (
                  <div className='flex items-center justify-center' dir='rtl'>
                    התחל להשתמש ב-Spike
                    <ArrowRight className='ms-2 h-4 w-4 scale-x-[-1] transform' />
                  </div>
                )}
              </Button>

              <Button
                variant='outline'
                onClick={() => router.push('/')}
                className='w-full rounded-lg border-gray-300 py-3 text-base font-medium text-gray-700 hover:bg-gray-50'
              >
                אעשה זאת מאוחר יותר
              </Button>
            </div>

            {/* Info Text */}
            <div className='pt-4 text-center'>
              <p className='text-xs text-gray-500'>
                על ידי המשך, אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
