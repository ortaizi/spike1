'use client';

import { GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AssignmentGrades } from './assignment-grades';
import { CompactAnnouncements } from './compact-announcements';
import { CompactQuickFiles } from './compact-quick-files';
import { CourseSidebar } from './course-sidebar';
import { ExamDates } from './exam-dates';
import { HorizontalTeachingStaff } from './horizontal-teaching-staff';
import { ModernCourseSections } from './modern-course-sections';

// Mock data
const mockCourses = [
  {
    id: '1',
    name: 'יסודות האלגוריתמים והסיבוכיות',
    code: '372.1.4567',
    semester: 'סמסטר א\' תשפ"ה',
    credits: 4,
    color: 'bg-blue-500',
  },
  {
    id: '2',
    name: 'מבוא לסטטיסטיקה',
    code: '372.1.1234',
    semester: 'סמסטר א\' תשפ"ה',
    credits: 3,
    color: 'bg-green-500',
  },
  {
    id: '3',
    name: 'מיקרו כלכלה',
    code: '372.1.5678',
    semester: 'סמסטר א\' תשפ"ה',
    credits: 3,
    color: 'bg-purple-500',
  },
  {
    id: '4',
    name: 'אלגברה לינארית',
    code: '372.1.9876',
    semester: 'סמסטר א\' תשפ"ה',
    credits: 4,
    color: 'bg-red-500',
  },
  {
    id: '5',
    name: 'מבוא לפיזיקה',
    code: '372.1.5432',
    semester: 'סמסטר א\' תשפ"ה',
    credits: 3,
    color: 'bg-yellow-500',
  },
];

const mockStaff = [
  {
    id: '1',
    name: "פרופ' יוסי כהן",
    title: 'מרצה',
    email: 'yossi@bgu.ac.il',
    officeHours: "ימי ב' 14:00-16:00",
  },
  {
    id: '2',
    name: "פרופ' דן ישראלי",
    title: 'מרצה',
    email: 'dan@bgu.ac.il',
    officeHours: "ימי ד' 10:00-12:00",
  },
  {
    id: '3',
    name: 'ד"ר שרה לוי',
    title: 'מתרגלת',
    email: 'sarah@bgu.ac.il',
    officeHours: "ימי ג' 16:00-18:00",
  },
];

const mockAnnouncements = [
  {
    id: '1',
    title: 'דחיית בחינת האמצע',
    content:
      'שלום לכולם, ברצוני לעדכן כי מועד בחינת האמצע נדחה בשבוע אחד קדימה. הבחינה תתקיים ביום רביעי 22/03 בשעה 10:00 באולם 101. אנא הכינו את עצמכם בהתאם. הבחינה תכלול את כל החומר שנלמד עד השיעור מיום 15/03. בהצלחה לכולם!',
    instructor: "פרופ' יוסי כהן",
    date: '15/03/2025',
    isNew: true,
  },
  {
    id: '2',
    title: 'תרגיל בית נוסף',
    content:
      'הועלה תרגיל בית נוסף בנושא אלגוריתמי מיון. התרגיל זמין באתר הקורס ויש להגישו עד יום ראשון הקרוב. התרגיל מהווה 10% מהציון הסופי.',
    instructor: 'ד"ר שרה לוי',
    date: '12/03/2025',
    isNew: false,
  },
  {
    id: '3',
    title: 'שינוי שעות קבלה',
    content:
      "שימו לב, שעות הקבלה שלי השתנו החל מהשבוע הבא. במקום ימי ב' 14:00-16:00, הקבלה תתקיים בימי ג' 16:00-18:00. אנא עדכנו את לוח הזמנים שלכם בהתאם.",
    instructor: "פרופ' דן ישראלי",
    date: '10/03/2025',
    isNew: false,
  },
];

const mockFiles = [
  {
    id: '1',
    name: 'סילבוס הקורס',
    type: 'syllabus' as const,
    lastUpdated: '01/03/2025',
  },
  {
    id: '2',
    name: 'דף נוסחאות',
    type: 'formulas' as const,
    lastUpdated: '05/03/2025',
  },
  {
    id: '3',
    name: 'מערכי שיעורים',
    type: 'lectures' as const,
    lastUpdated: '08/03/2025',
  },
];

const mockSections = [
  {
    id: '1',
    title: 'מבוא לאלגוריתמים',
    itemCount: 3,
    items: [
      { id: '1', title: 'הרצאה 1: מבוא לאלגוריתמים', type: 'video' as const, duration: '90 דקות' },
      { id: '2', title: 'תרגול 1: ניתוח סיבוכיות', type: 'document' as const, duration: '60 דקות' },
      {
        id: '3',
        title: 'מטלה 1: אלגוריתמי מיון',
        type: 'assignment' as const,
        dueDate: '20/03/2025',
      },
    ],
  },
  {
    id: '2',
    title: 'אלגוריתמי חיפוש',
    itemCount: 2,
    items: [
      { id: '4', title: 'הרצאה 2: חיפוש בינארי', type: 'video' as const, duration: '90 דקות' },
      {
        id: '5',
        title: 'תרגול 2: יישום אלגוריתמי חיפוש',
        type: 'document' as const,
        duration: '60 דקות',
      },
    ],
  },
  {
    id: '3',
    title: 'נושאים מתקדמים',
    itemCount: 2,
    items: [
      { id: '12', title: 'הרצאה 8: אלגוריתמים רקורסיביים', type: 'video' as const },
      { id: '13', title: 'הרצאה 9: דינמיק פרוגרמינג', type: 'video' as const },
    ],
  },
];

export function CoursesContent() {
  const [activeCourse, setActiveCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Check if user has seen the welcome message before and restore selected course
  useEffect(() => {
    const hasSeen = localStorage.getItem('courses-welcome-seen');
    if (hasSeen) {
      setHasSeenWelcome(true);
    }

    // Restore selected course from localStorage
    const savedCourse = localStorage.getItem('courses-selected-course');
    if (savedCourse && mockCourses.find((course) => course.id === savedCourse)) {
      setActiveCourse(savedCourse);
    }
  }, []);

  const handleCourseSelect = (courseId: string) => {
    if (courseId === activeCourse) return;

    setLoading(true);
    setActiveCourse(courseId);
    // Save selected course to localStorage
    localStorage.setItem('courses-selected-course', courseId);
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  };

  const handleWelcomeDismiss = () => {
    localStorage.setItem('courses-welcome-seen', 'true');
    setHasSeenWelcome(true);
  };

  // const currentCourse = mockCourses.find((course) => course.id === activeCourse); // Reserved for future use

  return (
    <div className='space-y-2'>
      {/* Header Section - Increased spacing */}
      <div className='mb-8'>
        <div className='mb-2 flex items-center space-x-3 space-x-reverse'>
          <GraduationCap className='h-8 w-8 text-black' />
          <h1 className='text-right text-3xl font-bold text-black'>קורסים</h1>
        </div>
        <p className='text-right text-gray-600'>
          כאן תוכל לראות את כל הקורסים שלך, לצפות בחומרי הלימוד ולעקוב אחר ההתקדמות שלך.
        </p>
      </div>

      {/* Main Content with Sidebar */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-5'>
        {/* Sidebar - Course Selection */}
        <div className='lg:col-span-1'>
          <CourseSidebar
            courses={mockCourses}
            activeCourse={activeCourse}
            onCourseSelect={handleCourseSelect}
          />
        </div>

        {/* Main Content Area */}
        <div className='lg:col-span-4'>
          {loading ? (
            <div className='dipy-card dipy-fade-in p-12 text-center'>
              <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
              <p className='text-gray-600'>טוען פרטי קורס...</p>
            </div>
          ) : !activeCourse && !hasSeenWelcome ? (
            // Welcome message when no course is selected and user hasn't seen it before
            <div className='dipy-card dipy-fade-in p-12 text-center'>
              <div className='mx-auto max-w-2xl'>
                <div className='mb-6'>
                  <GraduationCap className='mx-auto mb-4 h-16 w-16 text-blue-500' />
                  <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                    ברוכים הבאים לעמוד הקורסים!
                  </h2>
                  <p className='text-lg leading-relaxed text-gray-600'>
                    היי! כאן תוכל/י לראות את כל הקורסים הפעילים שלך ואת התכנים שלהם.
                  </p>
                </div>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-6'>
                  <h3 className='mb-3 text-lg font-semibold text-blue-900'>איך להתחיל?</h3>
                  <div className='space-y-2 text-right text-blue-800'>
                    <p className='flex items-center space-x-2 space-x-reverse'>
                      <span className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-sm font-bold'>
                        1
                      </span>
                      <span>בחר/י קורס מהרשימה בסרגל הצד</span>
                    </p>
                    <p className='flex items-center space-x-2 space-x-reverse'>
                      <span className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-sm font-bold'>
                        2
                      </span>
                      <span>צפה/י בחומרי הלימוד, מטלות ובחינות</span>
                    </p>
                    <p className='flex items-center space-x-2 space-x-reverse'>
                      <span className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-sm font-bold'>
                        3
                      </span>
                      <span>עקוב/י אחר ההתקדמות והציונים שלך</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleWelcomeDismiss}
                  className='mt-6 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors duration-200 hover:bg-blue-700'
                >
                  הבנתי, התחל
                </button>
              </div>
            </div>
          ) : !activeCourse && hasSeenWelcome ? (
            // Simple message when no course is selected but user has seen welcome before
            <div className='dipy-card dipy-fade-in p-12 text-center'>
              <div className='mx-auto max-w-lg'>
                <GraduationCap className='mx-auto mb-4 h-12 w-12 text-blue-500' />
                <h2 className='mb-3 text-xl font-semibold text-gray-900'>בחר קורס לצפייה</h2>
                <p className='text-gray-600'>בחר/י קורס מהרשימה בסרגל הצד כדי לצפות בתכנים שלו</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* First Row - Exam Dates, Teaching Staff, Quick Files */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                {/* Exam Dates */}
                <div className='dipy-card dipy-fade-in dipy-accent-emerald p-6'>
                  <ExamDates key={`exam-dates-${activeCourse}`} courseId={activeCourse} />
                </div>

                {/* Teaching Staff */}
                <div className='dipy-card dipy-fade-in dipy-accent-indigo p-6'>
                  <HorizontalTeachingStaff
                    key={`teaching-staff-${activeCourse}`}
                    staff={mockStaff}
                  />
                </div>

                {/* Quick Files */}
                <div className='dipy-card dipy-fade-in dipy-accent-orange p-6'>
                  <CompactQuickFiles key={`quick-files-${activeCourse}`} files={mockFiles} />
                </div>
              </div>

              {/* Second Row - Assignment Grades and Announcements */}
              {/* Assignment Grades - Independent Row */}
              <div className='dipy-card dipy-fade-in dipy-accent-rose p-6'>
                <AssignmentGrades key='assignment-grades' />
              </div>

              {/* Announcements - Independent Row */}
              <div className='dipy-card dipy-fade-in dipy-accent-amber p-6'>
                <CompactAnnouncements
                  key='compact-announcements'
                  announcements={mockAnnouncements}
                />
              </div>

              {/* Course Sections Grid */}
              <div className='dipy-card dipy-fade-in dipy-accent-slate p-6'>
                <ModernCourseSections
                  key={`course-sections-${activeCourse}`}
                  sections={mockSections}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
