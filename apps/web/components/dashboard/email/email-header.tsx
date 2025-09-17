'use client';

import type React from 'react';

import { Bell, Filter, Inbox, Paperclip, Search } from 'lucide-react';
import { useState } from 'react';

interface EmailHeaderProps {
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export function EmailHeader({ onFilterChange, currentFilter }: EmailHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { id: 'all', label: 'הכל' },
    { id: 'unread', label: 'לא נקרא' },
    { id: 'attachments', label: 'מצורף קבצים' },
    { id: 'urgent', label: 'דחוף' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality
  };

  return (
    <div className='mb-6'>
      <h1 className='mb-1 text-2xl font-bold text-slate-900'>מייל אקדמי חכם</h1>
      <p className='mb-6 text-sm text-slate-600'>רק המיילים החשובים מהמרצים והמתרגלים שלך</p>

      <div className='flex flex-col items-start gap-4 md:flex-row md:items-center'>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className='relative w-full flex-1'>
          <Search className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400' />
          <input
            type='text'
            placeholder='חפש מיילים...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full rounded-lg border border-slate-200 py-2 pl-4 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#387ADF]'
          />
        </form>

        {/* Filter Buttons */}
        <div className='flex space-x-2 space-x-reverse'>
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                currentFilter === filter.id
                  ? 'bg-[#387ADF] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {filter.id === 'all' && <Inbox className='ml-1.5 inline-block h-3.5 w-3.5' />}
              {filter.id === 'unread' && <Bell className='ml-1.5 inline-block h-3.5 w-3.5' />}
              {filter.id === 'attachments' && (
                <Paperclip className='ml-1.5 inline-block h-3.5 w-3.5' />
              )}
              {filter.id === 'urgent' && <Filter className='ml-1.5 inline-block h-3.5 w-3.5' />}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Filtering Indicators */}
      <div className='mt-4 flex flex-col text-xs text-slate-500 sm:flex-row sm:justify-between'>
        <div>מסננים פעילים: מרצים ומתרגלים בלבד</div>
        <div>סווגנו 247 מיילים | הוסתרו 89 מיילים לא רלוונטיים</div>
      </div>
    </div>
  );
}
