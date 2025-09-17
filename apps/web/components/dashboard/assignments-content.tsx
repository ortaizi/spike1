'use client';

import { Calendar, CheckCircle, ClipboardList } from 'lucide-react';
import { AssignmentsTable } from './assignments-table';
import { TodoList } from './todo-list';

export function AssignmentsContent() {
  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='mb-8'>
        <div className='mb-2 flex items-center space-x-3 space-x-reverse'>
          <ClipboardList className='h-8 w-8 text-black' />
          <h1 className='text-right text-3xl font-bold text-black'>מטלות</h1>
        </div>
        <p className='text-right text-gray-600'>
          כאן תוכל לראות את כל המטלות הפתוחות שלך, מסודרות לפי תאריך ההגשה והזמן שנותר לביצוע.
        </p>
      </div>

      {/* Main Content Grid - Side by Side */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Assignments Table - Right Side */}
        <div className='dipy-card dipy-fade-in dipy-accent-orange'>
          <div className='mb-6 flex items-center space-x-3 space-x-reverse'>
            <div className='rounded-lg bg-orange-50 p-2'>
              <Calendar className='dipy-icon dipy-icon-orange' />
            </div>
            <h2 className='dipy-title'>מטלות פתוחות</h2>
          </div>
          <AssignmentsTable />
        </div>

        {/* Todo List - Left Side */}
        <div className='dipy-card dipy-fade-in dipy-accent-emerald'>
          <div className='mb-6 flex items-center space-x-3 space-x-reverse'>
            <div className='rounded-lg bg-emerald-50 p-2'>
              <CheckCircle className='dipy-icon dipy-icon-emerald' />
            </div>
            <h2 className='dipy-title'>המשימות שלי</h2>
          </div>
          <TodoList />
        </div>
      </div>
    </div>
  );
}
