'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getSyncStatusColor,
  getSyncStatusIcon,
  getSyncStatusMessage,
} from '../../lib/utils/sync-status-messages';

interface SyncProgressProps {
  jobId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function SyncProgress({ jobId, onComplete, onError }: SyncProgressProps) {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // התחלת מעקב אחר התקדמות
    pollSyncStatus();

    return () => {
      // ניקוי בעת unmount
    };
  }, [jobId]);

  const pollSyncStatus = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-status/${jobId}`);

        if (response.ok) {
          const data = await response.json();

          setSyncStatus(data);
          setProgress(data.progress);

          // אם הסנכרון הסתיים
          if (data.status === 'completed') {
            clearInterval(pollInterval);
            onComplete?.();
          } else if (data.status === 'error') {
            clearInterval(pollInterval);
            setError(data.message || 'שגיאה בתהליך הסנכרון');
            onError?.(data.message || 'שגיאה בתהליך הסנכרון');
          }
        } else {
          throw new Error('שגיאה בקבלת סטטוס');
        }
      } catch (err) {
        clearInterval(pollInterval);
        const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    }, 2000); // בדיקה כל 2 שניות

    // ניקוי אוטומטי אחרי 10 דקות
    setTimeout(
      () => {
        clearInterval(pollInterval);
      },
      10 * 60 * 1000
    );
  };

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          <div className='space-y-2'>
            <div className='font-medium'>שגיאה בתהליך הסנכרון</div>
            <div className='text-sm'>{error}</div>
            <div className='text-muted-foreground text-xs'>נסה להתחבר מחדש או פנה לתמיכה</div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!syncStatus) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center space-x-2'>
            <Activity className='h-5 w-5 animate-spin text-blue-500' />
            <span className='text-muted-foreground text-sm'>טוען סטטוס...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-l-4 border-l-blue-500'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span className='text-lg'>{getSyncStatusIcon(syncStatus.status)}</span>
          <span className={getSyncStatusColor(syncStatus.status)}>
            {getSyncStatusMessage(syncStatus.status)}
          </span>
          {syncStatus.status === 'completed' && (
            <Badge variant='secondary' className='ml-auto'>
              הושלם
            </Badge>
          )}
          {syncStatus.status === 'error' && (
            <Badge variant='destructive' className='ml-auto'>
              שגיאה
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {syncStatus.status === 'completed'
            ? 'הנתונים שלך מוכנים לשימוש!'
            : syncStatus.status === 'error'
              ? 'אירעה שגיאה בתהליך הסנכרון'
              : 'מעבד את הנתונים שלך...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* סרגל התקדמות */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>התקדמות</span>
              <span>{progress}%</span>
            </div>
            <Progress
              value={progress}
              className='h-3'
              style={{
                backgroundColor: progress < 0 ? '#ef4444' : undefined,
              }}
            />
          </div>

          {/* פרטי התקדמות */}
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>זמן התחלה</div>
                <div className='text-muted-foreground text-xs'>
                  {new Date(syncStatus.createdAt).toLocaleString('he-IL')}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Activity className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>עודכן לאחרונה</div>
                <div className='text-muted-foreground text-xs'>
                  {new Date(syncStatus.updatedAt).toLocaleString('he-IL')}
                </div>
              </div>
            </div>
          </div>

          {/* נתונים נוספים */}
          {syncStatus.data && (
            <div className='bg-muted rounded-lg p-3'>
              <div className='mb-2 text-sm font-medium'>סטטיסטיקות</div>
              <div className='grid grid-cols-2 gap-4 text-xs'>
                <div>
                  <span className='text-muted-foreground'>קורסים:</span>
                  <span className='ml-1 font-medium'>{syncStatus.data.totalCourses || 0}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>פריטים:</span>
                  <span className='ml-1 font-medium'>{syncStatus.data.totalItems || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* הודעות נוספות */}
          {syncStatus.message && syncStatus.status !== 'completed' && (
            <div className='text-muted-foreground rounded bg-blue-50 p-2 text-xs'>
              💡 {syncStatus.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
