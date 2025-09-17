'use client';

import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  instructor: string;
  date: string;
  isNew?: boolean;
}

interface CompactAnnouncementsProps {
  announcements: Announcement[];
}

export function CompactAnnouncements({ announcements }: CompactAnnouncementsProps) {
  // Use a more specific state name to avoid conflicts
  const [isAnnouncementsExpanded, setIsAnnouncementsExpanded] = useState(false);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());

  const toggleAnnouncement = (id: string) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnnouncementsExpanded(!isAnnouncementsExpanded);
  };

  const truncateText = (text: string, maxLength = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const newAnnouncementsCount = announcements.filter((a) => a.isNew).length;

  return (
    <div className='space-y-3'>
      {/* Header with Toggle */}
      <button
        onClick={handleToggleExpanded}
        className='flex w-full cursor-pointer items-center justify-between'
        type='button'
      >
        <div className='flex items-center space-x-3 space-x-reverse'>
          <MessageSquare className='h-8 w-8 text-slate-600' />
          <h3 className='text-lg font-medium text-slate-900'>לוח הודעות</h3>
          {newAnnouncementsCount > 0 && (
            <span className='rounded-full bg-red-500 px-2 py-0.5 text-xs text-white'>
              {newAnnouncementsCount}
            </span>
          )}
        </div>
        {isAnnouncementsExpanded ? (
          <ChevronDown className='h-4 w-4 text-slate-600' />
        ) : (
          <ChevronUp className='h-4 w-4 text-slate-600' />
        )}
      </button>

      {/* Expanded Content */}
      {isAnnouncementsExpanded && (
        <div className='space-y-2'>
          {announcements.length === 0 ? (
            <div className='py-6 text-center text-slate-500'>
              <MessageSquare className='mx-auto mb-2 h-8 w-8 text-slate-300' />
              <p className='text-sm'>אין הודעות חדשות</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className='rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 transition-colors duration-200 hover:bg-blue-50/30'
              >
                <div className='mb-2 flex items-start justify-between'>
                  <div className='min-w-0 flex-1'>
                    <div className='mb-1 flex items-center space-x-2 space-x-reverse'>
                      <h4 className='truncate text-sm font-medium text-slate-900'>
                        {announcement.title}
                      </h4>
                      {announcement.isNew && (
                        <span className='flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-800'>
                          חדש
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-slate-600'>
                      {announcement.instructor} • {announcement.date}
                    </p>
                  </div>
                </div>

                <div className='text-sm leading-relaxed text-slate-700'>
                  {expandedAnnouncements.has(announcement.id) ? (
                    <div>
                      <p className='mb-2'>{announcement.content}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAnnouncement(announcement.id);
                        }}
                        className='flex items-center space-x-1 space-x-reverse text-xs font-medium text-[#387ADF] hover:text-[#387ADF]/80'
                        type='button'
                      >
                        <ChevronDown className='h-3 w-3' />
                        <span>הצג פחות</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className='mb-2'>{truncateText(announcement.content)}</p>
                      {announcement.content.length > 80 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAnnouncement(announcement.id);
                          }}
                          className='flex items-center space-x-1 space-x-reverse text-xs font-medium text-[#387ADF] hover:text-[#387ADF]/80'
                          type='button'
                        >
                          <ChevronUp className='h-3 w-3' />
                          <span>קרא עוד</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
