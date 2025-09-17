'use client';

import { ChevronDown, ChevronUp, Download, Eye, FileText } from 'lucide-react';
import { useState } from 'react';

interface QuickFile {
  id: string;
  name: string;
  type: 'syllabus' | 'formulas' | 'lectures' | 'other';
  lastUpdated: string;
  size?: string;
}

interface CompactQuickFilesProps {
  files: QuickFile[];
}

export function CompactQuickFiles({ files }: CompactQuickFilesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'syllabus':
        return 'סילבוס';
      case 'formulas':
        return 'דף נוסחאות';
      case 'lectures':
        return 'מערכי שיעורים';
      default:
        return 'קובץ';
    }
  };

  const handleFileAction = (file: QuickFile, action: 'view' | 'download') => {
    console.log(`${action} file:`, file.name);
    // Implement file viewing/downloading logic
  };

  return (
    <div className='space-y-4'>
      {/* Header with Toggle */}
      <button
        onClick={handleToggleExpanded}
        className='flex w-full cursor-pointer items-center justify-between'
        type='button'
      >
        <div className='flex items-center space-x-3 space-x-reverse'>
          <FileText className='h-8 w-8 text-slate-600' />
          <h3 className='text-lg font-medium text-slate-900'>קבצים מהירים</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 text-slate-600' />
        ) : (
          <ChevronUp className='h-4 w-4 text-slate-600' />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className='space-y-3'>
          {files.length === 0 ? (
            <div className='py-6 text-center text-slate-500'>
              <FileText className='mx-auto mb-2 h-8 w-8 text-slate-300' />
              <p className='text-sm'>אין קבצים זמינים</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {files.map((file) => (
                <div
                  key={file.id}
                  className='rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 transition-colors duration-200 hover:bg-blue-50/30'
                >
                  {/* Simple File Info */}
                  <div className='flex items-center justify-between'>
                    <div className='text-right'>
                      <h4 className='text-sm font-medium text-slate-900'>
                        {getFileTypeLabel(file.type)}
                      </h4>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex items-center space-x-2 space-x-reverse'>
                      {/* View Button */}
                      <button
                        onClick={() => handleFileAction(file, 'view')}
                        className='flex items-center space-x-1 space-x-reverse rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50'
                      >
                        <Eye className='h-3 w-3' />
                        <span>צפה</span>
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => handleFileAction(file, 'download')}
                        className='flex items-center space-x-1 space-x-reverse rounded-lg bg-[#387ADF] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-[#387ADF]/90'
                      >
                        <Download className='h-3 w-3' />
                        <span>הורד</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
