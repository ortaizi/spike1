'use client';

import { ArrowRight, Paperclip, Reply, Star, Trash2 } from 'lucide-react';
import type { EmailData } from './email-card';

interface EmailViewProps {
  email: EmailData | null;
  onClose: () => void;
}

export function EmailView({ email, onClose }: EmailViewProps) {
  if (!email) return null;

  const handleReply = () => {
    console.log('Reply to:', email.id);
    // Implement reply functionality
  };

  const handleDelete = () => {
    console.log('Delete email:', email.id);
    // Implement delete functionality
  };

  const handleStar = () => {
    console.log('Star email:', email.id);
    // Implement star functionality
  };

  return (
    <div className='animate-in fade-in rounded-lg border border-slate-200 bg-white p-6 duration-300'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <button
          onClick={onClose}
          className='flex items-center space-x-2 space-x-reverse text-slate-600 transition-colors duration-200 hover:text-[#387ADF]'
        >
          <ArrowRight className='h-4 w-4' suppressHydrationWarning />
          <span>חזרה לרשימה</span>
        </button>

        <div className='flex items-center space-x-2 space-x-reverse'>
          <button
            onClick={handleStar}
            className='rounded-full p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-yellow-500'
          >
            <Star className='h-4 w-4' suppressHydrationWarning />
          </button>
          <button
            onClick={handleDelete}
            className='rounded-full p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-red-500'
          >
            <Trash2 className='h-4 w-4' suppressHydrationWarning />
          </button>
          <button
            onClick={handleReply}
            className='flex items-center space-x-2 space-x-reverse rounded-lg bg-[#387ADF] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#387ADF]/90'
          >
            <Reply className='h-4 w-4' suppressHydrationWarning />
            <span>השב</span>
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div>
        <h2 className='mb-4 text-xl font-semibold text-slate-900'>{email.subject}</h2>

        <div className='mb-6 flex items-start justify-between'>
          <div>
            <div className='font-medium text-slate-900'>{email.sender.name}</div>
            <div className='text-sm text-slate-500'>{email.sender.email}</div>
          </div>
          <div className='text-sm text-slate-500'>{email.timestamp}</div>
        </div>

        <div className='prose prose-slate mb-6 max-w-none'>
          <p>
            שלום לכולם,
            <br />
            <br />
            {email.preview}
            <br />
            <br />
            ברצוני לעדכן כי מועד בחינת האמצע נדחה בשבוע אחד קדימה. הבחינה תתקיים ביום רביעי 22/03
            בשעה 10:00 באולם 101. אנא הכינו את עצמכם בהתאם. הבחינה תכלול את כל החומר שנלמד עד השיעור
            מיום 15/03.
            <br />
            <br />
            בהצלחה לכולם!
            <br />
            <br />
            בברכה,
            <br />
            {email.sender.name}
          </p>
        </div>

        {email.hasAttachments && (
          <div className='border-t border-slate-200 pt-4'>
            <h3 className='mb-2 flex items-center text-sm font-medium text-slate-900'>
              <Paperclip className='ml-1 h-4 w-4' suppressHydrationWarning />
              קבצים מצורפים
            </h3>
            <div className='flex space-x-3 space-x-reverse'>
              <div className='flex items-center space-x-3 space-x-reverse rounded-lg border border-slate-200 bg-slate-100 p-3'>
                <div className='rounded bg-blue-100 p-2'>
                  <Paperclip className='h-4 w-4 text-blue-600' suppressHydrationWarning />
                </div>
                <div>
                  <div className='text-sm font-medium text-slate-900'>מועד-בחינה-מעודכן.pdf</div>
                  <div className='text-xs text-slate-500'>PDF, 245KB</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
