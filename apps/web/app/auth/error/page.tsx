'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, GraduationCap, Mail } from 'lucide-react';
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
          title: 'גישה מוגבלת',
          description: 'Spike זמין כרגע רק לסטודנטים באוניברסיטת בן-גוריון',
          action: 'התחבר עם מייל בן-גוריון'
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
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorDetails.title}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* University Access Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">מי יכול להשתמש ב-Spike?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• סטודנטים באוניברסיטת בן-גוריון בנגב</li>
                  <li className="text-gray-500 italic">• אוניברסיטאות נוספות יתווספו בקרוב</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How to Access */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">איך להתחבר?</h3>
            <p className="text-sm text-gray-600">
              השתמש במייל האוניברסיטאי שלך (למשל: your.name@post.bgu.ac.il) כדי להתחבר למערכת
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/" className="flex items-center justify-center">
                {errorDetails.action}
                <ArrowRight className="w-4 h-4 ms-2 transform scale-x-[-1]" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                חזור לדף הבית
              </Link>
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>רוצה להוסיף אוניברסיטה נוספת? <a href="mailto:support@spike.ac.il" className="text-blue-600 hover:underline">צור קשר</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
