'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { EmailCard, type EmailData } from './email-card';

interface CourseEmailSectionProps {
  courseId: string;
  courseName: string;
  courseColor: string;
  emails: EmailData[];
  lastActivity: string;
  onEmailClick: (emailId: string) => void;
}

export function CourseEmailSection({
  courseId: _courseId,
  courseName,
  courseColor,
  emails,
  lastActivity,
  onEmailClick,
}: CourseEmailSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const unreadCount = emails.filter((email) => email.isUnread).length;

  return (
    <div className='mb-4'>
      {/* Course Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-colors duration-200 hover:bg-slate-50'
      >
        <div className='flex items-center space-x-3 space-x-reverse'>
          <div className={`h-3 w-3 rounded-full ${courseColor}`}></div>
          <h3 className='text-base font-semibold text-slate-900'>
            {courseName}
            {unreadCount > 0 && (
              <span className='me-2 text-sm font-medium text-[#387ADF]'>({unreadCount} חדשים)</span>
            )}
          </h3>
        </div>

        <div className='flex items-center space-x-4 space-x-reverse text-sm text-slate-500'>
          <span>עדכון אחרון: {lastActivity}</span>
          {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
        </div>
      </button>

      {/* Email List */}
      {isExpanded && (
        <div className='animate-accordion-down mt-2 space-y-1'>
          {emails.length > 0 ? (
            emails.map((email) => <EmailCard key={email.id} email={email} onClick={onEmailClick} />)
          ) : (
            <div className='rounded-lg border border-slate-100 bg-white py-6 text-center'>
              <p className='text-slate-500'>אין מיילים חדשים מ{courseName}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
