'use client';

import type React from 'react';

import { Paperclip } from 'lucide-react';
import { useState } from 'react';

export interface EmailData {
  id: string;
  sender: {
    name: string;
    role: 'מרצה' | 'מתרגל' | 'מנהלה' | 'אחר';
    email: string;
  };
  subject: string;
  preview: string;
  timestamp: string;
  hasAttachments: boolean;
  isUnread: boolean;
  courseId: string;
}

interface EmailCardProps {
  email: EmailData;
  onClick: (emailId: string) => void;
}

export function EmailCard({ email, onClick }: EmailCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'מרצה':
        return 'bg-blue-100 text-blue-800';
      case 'מתרגל':
        return 'bg-green-100 text-green-800';
      case 'מנהלה':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Mark as read:', email.id);
    // Implement mark as read functionality
  };

  const handleQuickReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Quick reply to:', email.id);
    // Implement quick reply functionality
  };

  return (
    <div
      className={`mb-2 cursor-pointer rounded-lg p-3 transition-all duration-200 ${
        email.isUnread
          ? 'border border-r-4 border-[#387ADF] bg-white shadow-sm'
          : 'border border-slate-100 bg-white hover:border-slate-200'
      } ${isHovered ? 'bg-blue-50/30' : ''}`}
      onClick={() => onClick(email.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='mb-1 flex items-start justify-between'>
        <div className='flex items-center space-x-2 space-x-reverse'>
          <span className='font-semibold text-slate-900'>{email.sender.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${getRoleColor(email.sender.role)}`}>
            {email.sender.role}
          </span>
        </div>
        <span className='text-xs text-slate-500'>{email.timestamp}</span>
      </div>

      <h4
        className={`text-sm ${email.isUnread ? 'font-medium text-[#387ADF]' : 'font-normal text-slate-800'} mb-1`}
      >
        {email.subject}
      </h4>

      <div className='flex items-center justify-between'>
        <p className='max-w-[70%] truncate text-xs text-slate-500'>{email.preview}</p>
        <div className='flex items-center space-x-1 space-x-reverse'>
          {email.hasAttachments && <Paperclip className='h-3 w-3 text-slate-400' />}
          {isHovered && (
            <div className='flex space-x-1 space-x-reverse'>
              {email.isUnread ? (
                <button
                  onClick={handleMarkAsRead}
                  className='rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 transition-colors duration-200 hover:bg-slate-200'
                >
                  סמן כנקרא
                </button>
              ) : (
                <button
                  onClick={handleQuickReply}
                  className='rounded bg-[#387ADF] px-2 py-0.5 text-xs text-white transition-colors duration-200 hover:bg-[#387ADF]/90'
                >
                  השב
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
