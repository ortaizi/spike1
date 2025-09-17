'use client';

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  Download,
  MapPin,
  PrinterIcon as Print,
} from 'lucide-react';
import { useState } from 'react';

interface ExamScheduleViewProps {
  onBack: () => void;
}

interface ExamEvent {
  id: string;
  course: string;
  courseCode: string;
  period: "מועד א'" | "מועד ב'";
  date: string;
  time: string;
  duration: string;
  location: string;
  instructor: string;
  isRegistered: boolean;
  color: string;
}

const mockExamSchedule: ExamEvent[] = [
  {
    id: '1',
    course: 'יסודות האלגוריתמים והסיבוכיות',
    courseCode: '372.1.4567',
    period: "מועד א'",
    date: '15/06/2025',
    time: '09:00',
    duration: '3 שעות',
    location: 'בניין 90, אולם 201',
    instructor: "פרופ' יוסי כהן",
    isRegistered: true,
    color: '#387ADF',
  },
  {
    id: '2',
    course: 'יסודות האלגוריתמים והסיבוכיות',
    courseCode: '372.1.4567',
    period: "מועד ב'",
    date: '25/08/2025',
    time: '09:00',
    duration: '3 שעות',
    location: 'בניין 90, אולם 105',
    instructor: "פרופ' יוסי כהן",
    isRegistered: false,
    color: '#6366F1',
  },
  {
    id: '3',
    course: 'מבוא לסטטיסטיקה',
    courseCode: '372.1.1234',
    period: "מועד א'",
    date: '20/06/2025',
    time: '14:00',
    duration: '2.5 שעות',
    location: 'בניין 72, אולם 115',
    instructor: 'ד"ר רחל גולן',
    isRegistered: true,
    color: '#387ADF',
  },
  {
    id: '4',
    course: 'מבוא לסטטיסטיקה',
    courseCode: '372.1.1234',
    period: "מועד ב'",
    date: '30/08/2025',
    time: '14:00',
    duration: '2.5 שעות',
    location: 'בניין 72, אולם 203',
    instructor: 'ד"ר רחל גולן',
    isRegistered: false,
    color: '#6366F1',
  },
  {
    id: '5',
    course: 'מיקרו כלכלה',
    courseCode: '372.1.5678',
    period: "מועד א'",
    date: '18/06/2025',
    time: '16:00',
    duration: '3 שעות',
    location: 'בניין 28, אולם 301',
    instructor: 'ד"ר דן ישראלי',
    isRegistered: true,
    color: '#387ADF',
  },
  {
    id: '6',
    course: 'מיקרו כלכלה',
    courseCode: '372.1.5678',
    period: "מועד ב'",
    date: '28/08/2025',
    time: '16:00',
    duration: '3 שעות',
    location: 'בניין 28, אולם 205',
    instructor: 'ד"ר דן ישראלי',
    isRegistered: false,
    color: '#6366F1',
  },
];

export function ExamScheduleView({ onBack }: ExamScheduleViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | "מועד א'" | "מועד ב'">('all');

  const handleRegister = (examId: string) => {
    console.log('Register for exam:', examId);
    // Implement registration logic
  };

  const handleExport = () => {
    console.log('Export exam schedule');
    // Implement export logic
  };

  const handlePrint = () => {
    window.print();
  };

  const isExamSoon = (dateString: string) => {
    const examDate = new Date(dateString.split('/').reverse().join('-'));
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const filteredExams =
    selectedPeriod === 'all'
      ? mockExamSchedule
      : mockExamSchedule.filter((exam) => exam.period === selectedPeriod);

  const groupedExams = filteredExams.reduce(
    (acc, exam) => {
      const key = `${exam.course}-${exam.courseCode}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(exam);
      return acc;
    },
    {} as Record<string, ExamEvent[]>
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='dipy-card dipy-fade-in'>
        <div className='mb-4 flex items-center justify-between'>
          <button
            onClick={onBack}
            className='dipy-button dipy-button-secondary flex items-center space-x-2 space-x-reverse'
          >
            <ArrowRight className='h-4 w-4' />
            <span>חזרה למערכת שעות</span>
          </button>

          <div className='flex items-center space-x-3 space-x-reverse'>
            <button
              onClick={handleExport}
              className='dipy-button dipy-button-secondary flex items-center space-x-2 space-x-reverse'
            >
              <Download className='h-4 w-4' />
              <span>ייצא</span>
            </button>
            <button
              onClick={handlePrint}
              className='dipy-button dipy-button-secondary flex items-center space-x-2 space-x-reverse'
            >
              <Print className='h-4 w-4' />
              <span>הדפס</span>
            </button>
          </div>
        </div>

        <div className='mb-4 flex items-center space-x-3 space-x-reverse'>
          <div className='rounded-xl bg-gray-50 p-3'>
            <Calendar className='dipy-icon dipy-icon-indigo' />
          </div>
          <div>
            <h1 className='dipy-title mb-1 text-xl'>לוח בחינות</h1>
            <p className='dipy-description'>צפה בכל תאריכי הבחינות שלך, מועד א' ומועד ב'.</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className='flex space-x-2 space-x-reverse'>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`dipy-button ${selectedPeriod === 'all' ? 'dipy-button-primary' : 'dipy-button-secondary'} px-4 py-2 text-sm`}
          >
            הכל
          </button>
          <button
            onClick={() => setSelectedPeriod("מועד א'")}
            className={`dipy-button ${selectedPeriod === "מועד א'" ? 'dipy-button-primary' : 'dipy-button-secondary'} px-4 py-2 text-sm`}
          >
            מועד א'
          </button>
          <button
            onClick={() => setSelectedPeriod("מועד ב'")}
            className={`dipy-button ${selectedPeriod === "מועד ב'" ? 'dipy-button-primary' : 'dipy-button-secondary'} px-4 py-2 text-sm`}
          >
            מועד ב'
          </button>
        </div>
      </div>

      {/* Exam Schedule */}
      <div className='space-y-6'>
        {Object.entries(groupedExams).map(([courseKey, exams]) => (
          <div key={courseKey} className='dipy-card dipy-fade-in'>
            <h2 className='dipy-title mb-4'>{exams[0].course}</h2>
            <p className='dipy-description mb-6'>{exams[0].courseCode}</p>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className={`rounded-lg border p-4 transition-all duration-200 ${
                    isExamSoon(exam.date) ? 'ring-2 ring-orange-200' : ''
                  }`}
                  style={{
                    backgroundColor: `${exam.color}10`,
                    borderColor: `${exam.color}30`,
                    borderRightWidth: '4px',
                    borderRightColor: exam.color,
                  }}
                >
                  {/* Exam Header */}
                  <div className='mb-3 flex items-center justify-between'>
                    <div className='flex items-center space-x-2 space-x-reverse'>
                      <span
                        className='dipy-badge font-medium text-white'
                        style={{ backgroundColor: exam.color }}
                      >
                        {exam.period}
                      </span>
                      {isExamSoon(exam.date) && (
                        <span className='dipy-badge dipy-badge-amber flex items-center space-x-1 space-x-reverse'>
                          <AlertCircle className='h-3 w-3' />
                          <span>בקרוב</span>
                        </span>
                      )}
                    </div>
                    {exam.isRegistered ? (
                      <span className='dipy-badge dipy-badge-emerald'>נרשמת</span>
                    ) : (
                      <button
                        onClick={() => handleRegister(exam.id)}
                        className='dipy-button dipy-button-primary px-3 py-1 text-xs'
                      >
                        הירשם
                      </button>
                    )}
                  </div>

                  {/* Exam Details */}
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2 space-x-reverse text-sm text-slate-700'>
                      <Calendar className='h-4 w-4' style={{ color: exam.color }} />
                      <span className='font-medium'>{exam.date}</span>
                    </div>
                    <div className='flex items-center space-x-2 space-x-reverse text-sm text-slate-600'>
                      <Clock className='h-4 w-4' style={{ color: exam.color }} />
                      <span>
                        {exam.time} ({exam.duration})
                      </span>
                    </div>
                    <div className='flex items-center space-x-2 space-x-reverse text-sm text-slate-600'>
                      <MapPin className='h-4 w-4' style={{ color: exam.color }} />
                      <span>{exam.location}</span>
                    </div>
                    <div className='mt-2 text-sm text-slate-600'>
                      <strong>מרצה:</strong> {exam.instructor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className='dipy-card dipy-fade-in dipy-accent-indigo'>
        <h3 className='dipy-title mb-4'>סיכום</h3>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded-lg bg-blue-50 p-4 text-center'>
            <div className='mb-1 text-2xl font-bold text-black'>
              {mockExamSchedule.filter((e) => e.period === "מועד א'").length}
            </div>
            <div className='text-sm text-slate-600'>בחינות מועד א'</div>
          </div>
          <div className='rounded-lg bg-indigo-50 p-4 text-center'>
            <div className='mb-1 text-2xl font-bold text-black'>
              {mockExamSchedule.filter((e) => e.period === "מועד ב'").length}
            </div>
            <div className='text-sm text-slate-600'>בחינות מועד ב'</div>
          </div>
          <div className='rounded-lg bg-emerald-50 p-4 text-center'>
            <div className='mb-1 text-2xl font-bold text-black'>
              {mockExamSchedule.filter((e) => e.isRegistered).length}
            </div>
            <div className='text-sm text-slate-600'>נרשמת</div>
          </div>
        </div>

        <div className='mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3'>
          <p className='text-xs leading-relaxed text-slate-600'>
            <strong>הערה:</strong> ההרשמה לבחינות נפתחת 30 יום לפני מועד הבחינה. יש להירשם במערכת
            האקדמית עד 7 ימים לפני הבחינה. בחינות המסומנות ב"בקרוב" מתקיימות בחודש הקרוב.
          </p>
        </div>
      </div>
    </div>
  );
}
