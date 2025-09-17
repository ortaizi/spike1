'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  HelpCircle,
  Home,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export default function ErrorPage() {
  const router = useRouter();
  const [errorCode, setErrorCode] = React.useState('404');
  const [errorMessage, setErrorMessage] = React.useState('העמוד שחיפשת לא נמצא');
  const [errorDescription, setErrorDescription] = React.useState(
    'ייתכן שהעמוד הוסר, השתנה או שהקישור שגוי'
  );
  const [countdown, setCountdown] = React.useState(10);

  useEffect(() => {
    // Get error details from URL or default to 404
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || '404';
    setErrorCode(code);

    // Set appropriate messages based on error code
    switch (code) {
      case '404':
        setErrorMessage('העמוד שחיפשת לא נמצא');
        setErrorDescription('ייתכן שהעמוד הוסר, השתנה או שהקישור שגוי');
        break;
      case '500':
        setErrorMessage('שגיאת שרת פנימית');
        setErrorDescription('משהו השתבש בשרת. אנא נסה שוב מאוחר יותר');
        break;
      case '403':
        setErrorMessage('אין לך הרשאה לגשת לעמוד זה');
        setErrorDescription('ייתכן שתצטרך להתחבר או לקבל הרשאות נוספות');
        break;
      case '401':
        setErrorMessage('לא מורשה');
        setErrorDescription('עליך להתחבר כדי לגשת לעמוד זה');
        break;
      case '408':
        setErrorMessage('פג תוקף הבקשה');
        setErrorDescription('הבקשה שלך לקחה יותר מדי זמן. אנא נסה שוב');
        break;
      default:
        setErrorMessage('שגיאה לא ידועה');
        setErrorDescription('משהו השתבש. אנא נסה שוב');
    }

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleContactSupport = () => {
    // Open email client
    window.location.href =
      'mailto:support@spike.com?subject=Error Report&body=Error Code: ' + errorCode;
  };

  const errorSuggestions = [
    {
      icon: <Search className='h-5 w-5' />,
      title: 'בדוק את הכתובת',
      description: 'וודא שהכתובת נכונה ואין שגיאות הקלדה',
    },
    {
      icon: <RefreshCw className='h-5 w-5' />,
      title: 'רענן את הדף',
      description: 'לחץ על F5 או על כפתור הרענון בדפדפן',
    },
    {
      icon: <Home className='h-5 w-5' />,
      title: 'חזור לדף הבית',
      description: 'נווט לדף הבית ונסה שוב',
    },
    {
      icon: <HelpCircle className='h-5 w-5' />,
      title: 'צור קשר עם התמיכה',
      description: 'אם הבעיה נמשכת, צור קשר עם צוות התמיכה',
    },
  ];

  const quickActions = [
    {
      title: 'דף הבית',
      description: 'חזור לדף הבית הראשי',
      icon: <Home className='h-6 w-6' />,
      action: handleGoHome,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'חזור אחורה',
      description: 'חזור לעמוד הקודם',
      icon: <ArrowLeft className='h-6 w-6' />,
      action: handleGoBack,
      color: 'bg-gray-500 hover:bg-gray-600',
    },
    {
      title: 'רענן דף',
      description: 'טען מחדש את הדף הנוכחי',
      icon: <RefreshCw className='h-6 w-6' />,
      action: handleRefresh,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'תמיכה',
      description: 'צור קשר עם התמיכה',
      icon: <MessageSquare className='h-6 w-6' />,
      action: handleContactSupport,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div
      className='min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'
      dir='rtl'
      style={{ fontFamily: 'Assistant, sans-serif' }}
    >
      {/* Header */}
      <header className='border-b border-gray-100 bg-white shadow-sm'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='font-poppins text-2xl text-gray-900'>spike</span>
              <div className='h-8 w-8'>
                <svg className='h-full w-full' viewBox='0 0 24 24' fill='none'>
                  <defs>
                    <linearGradient id='lightningGradientError' x1='0%' y1='0%' x2='100%' y2='100%'>
                      <stop offset='0%' stopColor='#3B82F6' />
                      <stop offset='100%' stopColor='#6366F1' />
                    </linearGradient>
                  </defs>
                  <path
                    d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'
                    fill='url(#lightningGradientError)'
                    stroke='url(#lightningGradientError)'
                    strokeWidth='0'
                  />
                </svg>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' className='p-2'>
                <Search className='h-5 w-5' />
              </Button>
              <Button variant='ghost' className='p-2'>
                <HelpCircle className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='mb-12 text-center'>
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className='mx-auto mb-8'
          >
            <div className='flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-2xl'>
              <AlertTriangle className='h-16 w-16 text-white' />
            </div>
          </motion.div>

          {/* Error Code */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='mb-4 text-8xl font-bold text-gray-900'
          >
            {errorCode}
          </motion.h1>

          {/* Error Message */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='mb-4 text-3xl font-bold text-gray-900'
          >
            {errorMessage}
          </motion.h2>

          {/* Error Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='mx-auto mb-8 max-w-2xl text-lg text-gray-600'
          >
            {errorDescription}
          </motion.p>

          {/* Auto-redirect notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className='mx-auto mb-8 max-w-md rounded-lg border border-blue-200 bg-blue-50 p-4'
          >
            <div className='flex items-center justify-center gap-2'>
              <Clock className='h-5 w-5 text-blue-600' />
              <span className='text-blue-800'>מעביר לדף הבית בעוד {countdown} שניות...</span>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className='mb-12'
        >
          <h3 className='mb-6 text-center text-2xl font-bold text-gray-900'>פעולות מהירות</h3>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
              >
                <Card
                  className='group h-full cursor-pointer transition-shadow hover:shadow-lg'
                  onClick={action.action}
                >
                  <CardContent className='p-6 text-center'>
                    <div
                      className={`h-16 w-16 ${action.color} mx-auto mb-4 flex items-center justify-center rounded-full transition-transform group-hover:scale-110`}
                    >
                      {action.icon}
                    </div>
                    <h4 className='mb-2 text-lg font-semibold text-gray-900'>{action.title}</h4>
                    <p className='text-sm text-gray-600'>{action.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className='mb-12'
        >
          <h3 className='mb-6 text-center text-2xl font-bold text-gray-900'>מה אפשר לעשות?</h3>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {errorSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 + index * 0.1 }}
              >
                <Card className='h-full'>
                  <CardContent className='p-6'>
                    <div className='flex items-start gap-4'>
                      <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100'>
                        {suggestion.icon}
                      </div>
                      <div>
                        <h4 className='mb-2 text-lg font-semibold text-gray-900'>
                          {suggestion.title}
                        </h4>
                        <p className='text-gray-600'>{suggestion.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          className='text-center'
        >
          <Card className='mx-auto max-w-2xl'>
            <CardHeader>
              <CardTitle className='flex items-center justify-center gap-2'>
                <Shield className='h-6 w-6' />
                צריכים עזרה?
              </CardTitle>
              <CardDescription>צוות התמיכה שלנו זמין לעזור לך 24/7</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg bg-green-50 p-4 text-center'>
                  <Mail className='mx-auto mb-2 h-8 w-8 text-green-600' />
                  <h4 className='font-semibold text-gray-900'>אימייל</h4>
                  <p className='text-sm text-gray-600'>support@spike.com</p>
                </div>
                <div className='rounded-lg bg-blue-50 p-4 text-center'>
                  <Phone className='mx-auto mb-2 h-8 w-8 text-blue-600' />
                  <h4 className='font-semibold text-gray-900'>טלפון</h4>
                  <p className='text-sm text-gray-600'>03-1234567</p>
                </div>
                <div className='rounded-lg bg-purple-50 p-4 text-center'>
                  <MessageSquare className='mx-auto mb-2 h-8 w-8 text-purple-600' />
                  <h4 className='font-semibold text-gray-900'>צ&apos;אט</h4>
                  <p className='text-sm text-gray-600'>זמין עכשיו</p>
                </div>
              </div>

              <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                <Button onClick={handleContactSupport} className='bg-blue-600 hover:bg-blue-700'>
                  <Mail className='me-2 h-4 w-4' />
                  שלח דוח שגיאה
                </Button>
                <Button variant='outline' onClick={handleGoHome}>
                  <Home className='me-2 h-4 w-4' />
                  חזור לדף הבית
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6 }}
          className='mt-12 text-center text-gray-500'
        >
          <p>אם הבעיה נמשכת, אנא צור קשר עם צוות התמיכה</p>
          <p className='mt-2 text-sm'>
            קוד שגיאה: {errorCode} | זמן: {new Date().toLocaleString('he-IL')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
