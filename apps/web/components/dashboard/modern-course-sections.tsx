'use client';

import type React from 'react';

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  PenTool,
  Play,
} from 'lucide-react';
import { useState } from 'react';

interface SectionItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'assignment' | 'quiz';
  duration?: string;
  dueDate?: string;
}

interface CourseSection {
  id: string;
  title: string;
  itemCount: number;
  items: SectionItem[];
}

interface ModernCourseSectionsProps {
  sections: CourseSection[];
}

export function ModernCourseSections({ sections }: ModernCourseSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className='h-4 w-4 text-red-500' />;
      case 'document':
        return <FileText className='h-4 w-4 text-blue-500' />;
      case 'assignment':
        return <PenTool className='h-4 w-4 text-green-500' />;
      case 'quiz':
        return <HelpCircle className='h-4 w-4 text-purple-500' />;
      default:
        return <FileText className='h-4 w-4 text-slate-500' />;
    }
  };

  const handleItemClick = (item: SectionItem) => {
    console.log('Open item:', item.title);
    // Implement item opening logic
  };

  const handleDownload = (item: SectionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Download item:', item.title);
    // Implement download logic
  };

  return (
    <div className='space-y-4'>
      <div className='mb-6 flex items-center space-x-3 space-x-reverse'>
        <BookOpen className='h-8 w-8 text-slate-600' />
        <h2 className='text-xl font-medium text-slate-900'>חומרי הקורס</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {sections.map((section) => (
          <div key={section.id} className='card-3d-effect-small overflow-hidden rounded-lg'>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className='flex w-full items-center justify-between p-4 text-right transition-colors duration-200 hover:bg-blue-50/30'
            >
              <div className='flex items-center space-x-3 space-x-reverse'>
                <div className='rounded border border-blue-200/30 bg-blue-100/80 p-1.5'>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className='h-4 w-4 text-[#387ADF]' />
                  ) : (
                    <ChevronRight className='h-4 w-4 text-[#387ADF]' />
                  )}
                </div>
                <div>
                  <h3 className='text-base font-medium text-slate-900'>{section.title}</h3>
                  <p className='text-sm text-slate-600'>{section.itemCount} פריטים</p>
                </div>
              </div>
            </button>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <div className='border-t border-slate-200/50 bg-slate-50/30'>
                <div className='p-4 pt-3'>
                  <div className='space-y-2'>
                    {section.items.map((item, index) => (
                      <div
                        key={item.id}
                        className='group flex cursor-pointer items-center space-x-3 space-x-reverse rounded p-2 transition-colors duration-200 hover:bg-white/80'
                        onClick={() => handleItemClick(item)}
                      >
                        <span className='min-w-[1.5rem] text-xs font-medium text-slate-400'>
                          {(index + 1).toString().padStart(2, '0')}
                        </span>

                        <div className='flex items-center space-x-2 space-x-reverse'>
                          {getItemIcon(item.type)}
                        </div>

                        <div className='min-w-0 flex-1'>
                          <h4 className='truncate text-sm font-medium text-slate-900'>
                            {item.title}
                          </h4>
                          <div className='flex items-center space-x-3 space-x-reverse text-xs text-slate-500'>
                            {item.duration && <span>{item.duration}</span>}
                            {item.dueDate && <span>עד {item.dueDate}</span>}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDownload(item, e)}
                          className='rounded p-1 opacity-0 transition-all duration-200 hover:bg-slate-200 group-hover:opacity-100'
                        >
                          <Download className='h-3 w-3 text-slate-500' />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
