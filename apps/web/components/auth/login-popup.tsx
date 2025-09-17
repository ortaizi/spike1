'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getHebrewErrorMessage } from '../../lib/auth/hebrew-auth-errors';
import { Button } from '../ui/button';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('User is authenticated, redirecting to dashboard');
      router.push('/dashboard');
      onClose();
    }
  }, [session, status, router, onClose]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn('google', {
        callbackUrl: '/onboarding',
        redirect: false,
      });

      if (result?.error) {
        const hebrewError = getHebrewErrorMessage(result.error);
        setError(hebrewError.message);
      } else if (result?.ok) {
        setShowSuccess(true);
        // Redirect will be handled by useEffect
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      const hebrewError = getHebrewErrorMessage('UnknownError');
      setError(hebrewError.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* Popup Container */}
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'
              dir='rtl'
              style={{ fontFamily: 'Assistant, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - RTL positioned */}
              <button
                onClick={onClose}
                className='absolute end-4 top-4 z-10 p-2 text-gray-400 transition-colors hover:text-gray-600'
              >
                <X className='h-5 w-5' />
              </button>

              {/* Header */}
              <div className='p-6 pb-4'>
                <div className='text-center'>
                  <div className='mb-4 flex items-center justify-center gap-2'>
                    <span className='font-poppins text-2xl text-gray-900'>spike</span>
                    <div className='h-6 w-6'>
                      <svg className='h-full w-full' viewBox='0 0 24 24' fill='none'>
                        <defs>
                          <linearGradient
                            id='lightningGradientPopup'
                            x1='0%'
                            y1='0%'
                            x2='100%'
                            y2='100%'
                          >
                            <stop offset='0%' stopColor='#3B82F6' />
                            <stop offset='100%' stopColor='#6366F1' />
                          </linearGradient>
                        </defs>
                        <path
                          d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'
                          fill='url(#lightningGradientPopup)'
                          stroke='url(#lightningGradientPopup)'
                          strokeWidth='0'
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className='mb-2 text-2xl font-bold text-gray-900'>התחברות למערכת</h2>
                  <p className='text-sm leading-relaxed text-gray-600'>
                    התחבר עם Google שלך לכל מערכות הלימוד
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className='relative px-6 pb-6'>
                {/* Success Overlay */}
                {showSuccess && (
                  <motion.div
                    key='success'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm'
                  >
                    <div className='text-center' dir='rtl'>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      >
                        <CheckCircle className='mx-auto mb-4 h-16 w-16 text-green-500' />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className='mb-2 text-xl font-semibold text-gray-900'
                      >
                        התחברת בהצלחה!
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className='text-gray-600'
                      >
                        מעביר אותך למערכת...
                      </motion.p>
                    </div>
                  </motion.div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                  <motion.div
                    key='loading'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='absolute inset-0 z-40 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-[3px]'
                  >
                    <div className='text-center'>
                      <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-blue-600' />
                      <p className='font-medium text-blue-600'>מתחבר עם Google...</p>
                    </div>
                  </motion.div>
                )}

                {/* Google Sign In Button */}
                <div className='space-y-6'>
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className='flex w-full transform items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3.5 font-medium text-gray-900 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 hover:shadow-xl active:scale-[0.98]'
                    dir='rtl'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='h-5 w-5 animate-spin' />
                        מתחבר...
                      </>
                    ) : (
                      <>
                        <svg className='h-5 w-5' viewBox='0 0 24 24'>
                          <path
                            fill='#4285F4'
                            d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                          />
                          <path
                            fill='#34A853'
                            d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                          />
                          <path
                            fill='#FBBC05'
                            d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                          />
                          <path
                            fill='#EA4335'
                            d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                          />
                        </svg>
                        התחבר עם Google
                      </>
                    )}
                  </Button>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='rounded-lg border border-red-200 bg-red-50 p-4'
                    >
                      <div className='flex items-center gap-2'>
                        <AlertCircle className='h-5 w-5 text-red-500' />
                        <p className='text-sm text-red-700'>{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Info Section */}
                  <div className='rounded-lg bg-blue-50 p-4'>
                    <h3 className='mb-2 text-center font-medium text-blue-900'>איך זה עובד?</h3>
                    <div className='space-y-2 text-sm text-blue-800'>
                      <div className='flex items-center gap-2'>
                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                        <span>התחבר עם Google שלך</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                        <span>הגדר פרטי מוסד לימוד (פעם אחת בלבד)</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                        <span>קבל גישה לכל מערכות הלימוד שלך</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className='text-center text-sm text-gray-500'>
                    <div className='mb-2 flex items-center justify-center gap-1'>
                      <svg
                        className='h-4 w-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                        />
                      </svg>
                      <span>אבטחה ברמה הבנקאית</span>
                    </div>
                    <p>הפרטים שלך מוצפנים ונשמרים בצורה מאובטחת</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
