'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return {
          title: 'בעיית הגדרות',
          description: 'יש בעיה בהגדרות המערכת. אנא פנה למנהל המערכת.',
          action: 'חזור לדף הבית'
        };
      case 'AccessDenied':
        return {
          title: 'גישה נדחתה',
          description: 'לא ניתן להתחבר עם החשבון שלך. אנא נסה שוב.',
          action: 'נסה שוב'
        };
      case 'Verification':
        return {
          title: 'בעיית אימות',
          description: 'יש בעיה באימות החשבון שלך. אנא נסה שוב.',
          action: 'נסה שוב'
        };
      case 'Default':
      default:
        return {
          title: 'שגיאה בהתחברות',
          description: 'אירעה שגיאה בתהליך ההתחברות. אנא נסה שוב.',
          action: 'נסה שוב'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorDetails.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p className="font-medium">פרטי השגיאה:</p>
            <p className="mt-1">קוד שגיאה: {error || 'לא ידוע'}</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                {errorDetails.action}
                <ArrowRight className="w-4 h-4 mr-2" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                חזור לדף הבית
              </Link>
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>אם הבעיה נמשכת, אנא פנה לתמיכה</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
