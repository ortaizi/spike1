'use client';

import { AlertCircle, Info, RefreshCw, Settings } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface SyncErrorHandlerProps {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
  errorType?: 'sync' | 'analysis' | 'general';
}

export function SyncErrorHandler({
  error,
  onRetry,
  onDismiss,
  errorType = 'general',
}: SyncErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'sync':
        return 'שגיאה באיסוף נתונים';
      case 'analysis':
        return 'שגיאה בניתוח קורסים';
      default:
        return 'שגיאה בתהליך האוטומטי';
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case 'sync':
        return 'לא ניתן לאסוף נתונים מהמודל. ייתכן שפרטי ההתחברות שגויים או שהשרת לא זמין.';
      case 'analysis':
        return 'לא ניתן לנתח את הקורסים. ייתכן שיש בעיה עם מערכת הניתוח.';
      default:
        return 'אירעה שגיאה בתהליך האוטומטי. נסה שוב או פנה לתמיכה.';
    }
  };

  const getRetryButtonText = () => {
    switch (errorType) {
      case 'sync':
        return 'נסה שוב איסוף נתונים';
      case 'analysis':
        return 'נסה שוב ניתוח';
      default:
        return 'נסה שוב';
    }
  };

  return (
    <Card className='border-red-200 bg-red-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-red-700'>
          <AlertCircle className='h-5 w-5' />
          {getErrorTitle()}
        </CardTitle>
        <CardDescription className='text-red-600'>{getErrorDescription()}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* פרטי השגיאה */}
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription className='font-mono text-sm'>{error}</AlertDescription>
        </Alert>

        {/* אפשרויות פעולה */}
        <div className='flex items-center gap-3'>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant='outline'
            className='flex items-center gap-2'
          >
            {isRetrying ? (
              <>
                <RefreshCw className='h-4 w-4 animate-spin' />
                מנסה שוב...
              </>
            ) : (
              <>
                <RefreshCw className='h-4 w-4' />
                {getRetryButtonText()}
              </>
            )}
          </Button>

          <Button onClick={onDismiss} variant='ghost' className='text-gray-600'>
            סגור
          </Button>
        </div>

        {/* טיפים לפתרון */}
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
          <div className='flex items-start gap-2'>
            <Info className='mt-0.5 h-4 w-4 text-blue-600' />
            <div className='text-sm text-blue-700'>
              <p className='mb-1 font-medium'>טיפים לפתרון:</p>
              <ul className='list-inside list-disc space-y-1 text-xs'>
                <li>ודא שפרטי ההתחברות למודל נכונים</li>
                <li>בדוק את חיבור האינטרנט</li>
                <li>נסה להתחבר שוב למערכת</li>
                <li>אם הבעיה נמשכת, פנה לתמיכה</li>
              </ul>
            </div>
          </div>
        </div>

        {/* קישור להגדרות */}
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Settings className='h-4 w-4' />
          <span>ניתן לשנות הגדרות ב</span>
          <button className='text-blue-600 hover:underline'>הגדרות מערכת</button>
        </div>
      </CardContent>
    </Card>
  );
}
