'use client';
import { BookOpen } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  credits: number;
  color: string;
}

interface CourseSidebarProps {
  courses: Course[];
  activeCourse: string;
  onCourseSelect: (courseId: string) => void;
}

export function CourseSidebar({ courses, activeCourse, onCourseSelect }: CourseSidebarProps) {
  return (
    <div className='dipy-card dipy-fade-in sticky top-6 h-fit border-r-4 border-r-blue-500 p-4'>
      <div className='mb-6 flex items-center space-x-3 space-x-reverse'>
        <BookOpen className='h-8 w-8 text-slate-600' />
        <h2 className='text-lg font-semibold text-slate-900'>הקורסים שלי</h2>
      </div>

      <div className='rounded-xl border border-gray-200/50 bg-white p-2 shadow-sm'>
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onCourseSelect(course.id)}
            className={`w-full rounded-lg p-3 text-right transition-all duration-200 ${
              activeCourse === course.id
                ? 'border border-blue-200/50 bg-blue-50/50 text-blue-600 shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <h3
                  className={`mb-1 text-base font-semibold ${
                    activeCourse === course.id ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {course.name}
                </h3>
                <p className='mb-2 text-sm text-gray-600'>{course.code}</p>
                <div className='flex items-center space-x-2 space-x-reverse text-sm text-gray-500'>
                  <span>{course.credits} נק"ז</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
