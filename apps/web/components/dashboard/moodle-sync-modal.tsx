'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SyncStatus {
  exists: boolean;
  last_sync: string | null;
  courses_count: number;
  content_count: number;
  user_name?: string;
  faculty?: string;
}

export function MoodleSyncModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [formData, setFormData] = useState({
    moodle_username: '',
    moodle_password: '',
  });

  // בדיקת סטטוס סנכרון
  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/user-sync');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('שגיאה בבדיקת סטטוס:', error);
    }
  };

  // סנכרון נתונים
  const syncData = async () => {
    if (!formData.moodle_username || !formData.moodle_password) {
      toast.error('נא למלא את כל השדות');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('סנכרון הושלם בהצלחה!');
        await checkSyncStatus(); // רענון סטטוס
        setIsOpen(false);
      } else {
        toast.error(result.error || 'שגיאה בסנכרון');
      }
    } catch (error) {
      console.error('שגיאה בסנכרון:', error);
      toast.error('שגיאה בסנכרון נתונים');
    } finally {
      setIsLoading(false);
    }
  };

  // בדיקת סטטוס בטעינה
  useState(() => {
    if (isOpen) {
      checkSyncStatus();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <RefreshCw className='h-4 w-4' />
          סנכרון מודל
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5' />
            סנכרון נתונים ממודל
          </DialogTitle>
          <DialogDescription>התחבר למודל כדי לסנכרן את הקורסים והתוכן שלך</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* סטטוס נוכחי */}
          {syncStatus && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>סטטוס נוכחי</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500' />
                    <span className='text-sm'>
                      סטטוס: {syncStatus.exists ? 'מחובר' : 'לא מחובר'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-blue-500' />
                    <span className='text-sm'>
                      עדכון אחרון:{' '}
                      {syncStatus.last_sync
                        ? new Date(syncStatus.last_sync).toLocaleDateString('he-IL')
                        : 'לא ידוע'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <BookOpen className='h-4 w-4 text-purple-500' />
                    <span className='text-sm'>קורסים: {syncStatus.courses_count}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-orange-500' />
                    <span className='text-sm'>פריטי תוכן: {syncStatus.content_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* טופס התחברות */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי התחברות למודל</CardTitle>
              <CardDescription>
                הזן את פרטי ההתחברות שלך למודל של אוניברסיטת בן-גוריון
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='moodle_username'>שם משתמש במודל</Label>
                <Input
                  id='moodle_username'
                  type='text'
                  placeholder='לדוגמה: ortaiz'
                  value={formData.moodle_username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, moodle_username: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='moodle_password'>סיסמה</Label>
                <Input
                  id='moodle_password'
                  type='password'
                  placeholder='הזן את הסיסמה שלך'
                  value={formData.moodle_password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, moodle_password: e.target.value }))
                  }
                />
              </div>

              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  הנתונים שלך נשמרים באופן מאובטח ואינם נשמרים במערכת שלנו. הם משמשים רק לסנכרון עם
                  מודל.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* כפתורי פעולה */}
          <div className='flex justify-end gap-3'>
            <Button variant='outline' onClick={() => setIsOpen(false)}>
              ביטול
            </Button>
            <Button onClick={syncData} disabled={isLoading} className='gap-2'>
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  מסנכרן...
                </>
              ) : (
                <>
                  <RefreshCw className='h-4 w-4' />
                  סנכרון נתונים
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
