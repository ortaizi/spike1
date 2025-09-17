'use client';

import { Mail } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  title: string;
  email: string;
  officeHours: string;
  avatar?: string;
}

interface CompactTeachingStaffProps {
  staff: StaffMember[];
}

export function CompactTeachingStaff({ staff }: CompactTeachingStaffProps) {
  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className='space-y-3'>
      <h3 className='mb-4 text-lg font-medium text-slate-900'>צוות הקורס</h3>

      <div className='space-y-3'>
        {staff.map((member) => (
          <div
            key={member.id}
            className='rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 transition-colors duration-200 hover:bg-blue-50/30'
          >
            {/* Avatar and Info */}
            <div className='mb-3 flex items-center space-x-3 space-x-reverse'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#387ADF] to-blue-600 text-sm font-medium text-white'>
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className='min-w-0 flex-1'>
                <h4 className='truncate text-sm font-medium text-slate-900'>{member.name}</h4>
                <p className='text-xs text-slate-600'>{member.title}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className='mb-3 space-y-1 text-xs text-slate-600'>
              <div className='flex items-center space-x-2 space-x-reverse'>
                <Mail className='h-3 w-3 flex-shrink-0' />
                <span className='truncate'>{member.email}</span>
              </div>
              <div className='text-xs text-slate-500'>{member.officeHours}</div>
            </div>

            {/* Email Button */}
            <button
              onClick={() => handleSendEmail(member.email)}
              className='w-full rounded-md bg-[#387ADF] px-3 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-[#387ADF]/90'
            >
              שלח מייל
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
