'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle, Database, RefreshCw, Zap } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SyncErrorHandler } from './sync-error-handler';

interface SyncStatus {
  sync_status?: {
    status: string;
    progress: number;
    message: string;
  };
  analysis_status?: {
    status: string;
    progress: number;
    message: string;
  };
  user_id: string;
}

interface AutoSyncStatusProps {
  userId: string;
  onComplete?: () => void;
}

export function AutoSyncStatus({ userId, onComplete }: AutoSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'sync' | 'analysis' | 'general'>('general');
  const [isComplete, setIsComplete] = useState(false);
  const [showError, setShowError] = useState(false);

  // פונקציה לבדיקת סטטוס
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/auto-sync', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('שגיאה בבדיקת סטטוס');
      }

      const data = await response.json();
      setSyncStatus(data.data);
      setError(null);

      // בדיקה אם התהליך הושלם
      const syncComplete = data.data.sync_status?.status === 'completed';
      const analysisComplete = data.data.analysis_status?.status === 'completed';

      if (syncComplete && analysisComplete) {
        setIsComplete(true);
        setIsLoading(false);
        if (onComplete) {
          onComplete();
        }
      } else if (data.data.sync_status?.status === 'error') {
        setError('שגיאה בתהליך הסנכרון');
        setErrorType('sync');
        setIsLoading(false);
        setShowError(true);
      } else if (data.data.analysis_status?.status === 'error') {
        setError('שגיאה בתהליך הניתוח');
        setErrorType('analysis');
        setIsLoading(false);
        setShowError(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      setErrorType('general');
      setIsLoading(false);
      setShowError(true);
    }
  }, [onComplete]);

  // בדיקת סטטוס ראשונית
  useEffect(() => {
    checkStatus();
  }, [userId, checkStatus]);

  // מעקב אחר סטטוס כל 2 שניות
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading && !isComplete) {
      interval = setInterval(checkStatus, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, isComplete, checkStatus]);

  if (isComplete) {
    return (
      <Card className='border-green-200 bg-green-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-green-700'>
            <CheckCircle className='h-5 w-5' />
            סנכרון וניתוח הושלמו בהצלחה
          </CardTitle>
          <CardDescription className='text-green-600'>
            כל הנתונים נאספו, נותחו ונשמרו במערכת
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (showError && error) {
    return (
      <SyncErrorHandler
        error={error}
        errorType={errorType}
        onRetry={() => {
          setShowError(false);
          setError(null);
          setIsLoading(true);
          checkStatus();
        }}
        onDismiss={() => {
          setShowError(false);
          setError(null);
          setIsLoading(false);
        }}
      />
    );
  }

  return (
    <Card className='border-blue-200 bg-blue-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-blue-700'>
          <RefreshCw className='h-5 w-5 animate-spin' />
          מנתח נתונים...
        </CardTitle>
        <CardDescription className='text-blue-600'>
          המערכת אוספת ומנתחת את נתוני הקורסים שלך
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* סטטוס סנכרון */}
        {syncStatus?.sync_status && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Database className='h-4 w-4 text-blue-500' />
                <span className='text-sm font-medium'>איסוף נתונים</span>
                <Badge variant='outline' className='text-xs'>
                  {syncStatus.sync_status.status}
                </Badge>
              </div>
              <span className='text-muted-foreground text-sm'>
                {syncStatus.sync_status.progress}%
              </span>
            </div>
            <Progress value={syncStatus.sync_status.progress} className='h-2' />
            <p className='text-muted-foreground text-xs'>{syncStatus.sync_status.message}</p>
          </div>
        )}

        {/* סטטוס ניתוח */}
        {syncStatus?.analysis_status && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <BarChart3 className='h-4 w-4 text-purple-500' />
                <span className='text-sm font-medium'>ניתוח תוכן</span>
                <Badge variant='outline' className='text-xs'>
                  {syncStatus.analysis_status.status}
                </Badge>
              </div>
              <span className='text-muted-foreground text-sm'>
                {syncStatus.analysis_status.progress}%
              </span>
            </div>
            <Progress value={syncStatus.analysis_status.progress} className='h-2' />
            <p className='text-muted-foreground text-xs'>{syncStatus.analysis_status.message}</p>
          </div>
        )}

        {/* הודעת עזרה */}
        <div className='flex items-center gap-2 rounded-lg bg-blue-100 p-3'>
          <Zap className='h-4 w-4 text-blue-600' />
          <p className='text-xs text-blue-700'>
            התהליך מתבצע ברקע. תוכל להמשיך לגלול בדף זה בזמן שהמערכת עובדת.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
