'use client';

import { AlertTriangle, Clock, Eye, EyeOff, FileText } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { AssignmentUploadModal } from './assignment-upload-modal';

interface Assignment {
  title: string;
  course: string;
  due_date: string;
  days_left: number;
  id: string;
}

export function AssignmentsTable() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hiddenAssignments, setHiddenAssignments] = useState<Set<string>>(new Set());

  const getMockAssignments = useCallback((): Assignment[] => [
    {
      id: '1',
      title: 'סיכום יחידה 1',
      course: 'מבוא לסטטיסטיקה',
      due_date: '22/04/2025',
      days_left: 5,
    },
    {
      id: '2',
      title: 'מיני-פרויקט',
      course: 'חקר ביצועים',
      due_date: '25/04/2025',
      days_left: 8,
    },
    {
      id: '3',
      title: 'עבודה סמסטריאלית',
      course: 'מיקרו כלכלה',
      due_date: '30/04/2025',
      days_left: 13,
    },
    {
      id: '4',
      title: 'תרגיל בית 3',
      course: 'אלגברה לינארית',
      due_date: '28/04/2025',
      days_left: 11,
    },
    {
      id: '5',
      title: 'דוח מעבדה',
      course: 'פיזיקה',
      due_date: '20/04/2025',
      days_left: 3,
    },
    {
      id: '6',
      title: 'תרגיל בית 2',
      course: 'מתמטיקה דיסקרטית',
      due_date: '15/04/2025',
      days_left: -2,
    },
    {
      id: '7',
      title: 'עבודה סופית',
      course: 'תכנות מתקדם',
      due_date: '10/04/2025',
      days_left: -7,
    },
  ], []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAssignments(getMockAssignments());
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [getMockAssignments]);

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsUploadModalOpen(true);
  };

  // Reserved for future use - delete assignment functionality
  // const handleDeleteAssignment = (index: number) => {
  //   const updatedAssignments = assignments.filter((_, i) => i !== index);
  //   setAssignments(updatedAssignments);
  // };

  const handleHideAssignment = (assignmentId: string) => {
    setHiddenAssignments((prev) => {
      const newHidden = new Set(prev);
      newHidden.add(assignmentId);
      return newHidden;
    });
  };

  const handleShowAssignment = (assignmentId: string) => {
    setHiddenAssignments((prev) => {
      const newHidden = new Set(prev);
      newHidden.delete(assignmentId);
      return newHidden;
    });
  };

  const getUrgencyBadgeClass = (daysLeft: number) => {
    if (daysLeft < 0) return 'dipy-badge dipy-badge-red';
    return 'dipy-badge dipy-badge-emerald';
  };

  const getDaysLeftText = (daysLeft: number) => {
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)} ימים עברו`;
    }
    return `${daysLeft} ימים`;
  };

  const getDaysLeftIcon = (daysLeft: number) => {
    if (daysLeft < 0) {
      return <AlertTriangle className='me-1 h-3 w-3' />;
    }
    return <Clock className='me-1 h-3 w-3' />;
  };

  const getRowBackgroundClass = (daysLeft: number) => {
    if (daysLeft < 0) return 'bg-red-50/50 border-red-200/50';
    return 'bg-emerald-50/30 border-emerald-200/30';
  };

  // סינון מטלות מוסתרות
  const visibleAssignments = assignments.filter(
    (assignment) => !hiddenAssignments.has(assignment.id)
  );

  return (
    <>
      {/* Upload Modal */}
      {selectedAssignment && (
        <AssignmentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
        />
      )}

      {loading ? (
        <div className='dipy-empty-state'>
          <div className='dipy-skeleton mx-auto mb-4 h-8 w-8 rounded-full'></div>
          <p className='dipy-description'>טוען מטלות פתוחות...</p>
        </div>
      ) : visibleAssignments.length === 0 ? (
        <div className='dipy-empty-state'>
          <div className='mb-4 text-6xl'>🎉</div>
          <p className='dipy-empty-state-title'>אין מטלות פתוחות</p>
          <p className='dipy-empty-state-description'>כל הכבוד! אתה מעודכן עם כל המטלות</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          {/* Color Legend */}
          <div className='mb-4 rounded-lg border bg-gray-50 p-3'>
            <div className='flex items-center space-x-4 space-x-reverse text-sm'>
              <span className='font-medium text-gray-700'>משמעות הצבעים:</span>
              <div className='flex items-center space-x-3 space-x-reverse'>
                <div className='flex items-center space-x-1 space-x-reverse'>
                  <div className='h-3 w-3 rounded-full bg-red-500'></div>
                  <span className='text-red-700'>עבר זמן ההגשה</span>
                </div>
                <div className='flex items-center space-x-1 space-x-reverse'>
                  <div className='h-3 w-3 rounded-full bg-emerald-500'></div>
                  <span className='text-emerald-700'>עדיין יש זמן להגשה</span>
                </div>
              </div>
            </div>
          </div>

          <table className='dipy-table'>
            <thead>
              <tr>
                <th className='text-right'>מטלה</th>
                <th className='text-right'>תאריך הגשה</th>
                <th className='text-right'>סטטוס זמן</th>
                <th className='text-right'>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {visibleAssignments.map((assignment, _index) => (
                <tr
                  key={assignment.id}
                  className={`dipy-interactive ${getRowBackgroundClass(assignment.days_left)} border-l-4 ${
                    assignment.days_left < 0 ? 'border-l-red-500' : 'border-l-emerald-500'
                  }`}
                >
                  <td>
                    <div>
                      <div className='dipy-title mb-1 text-sm'>{assignment.title}</div>
                      <div className='dipy-description'>{assignment.course}</div>
                    </div>
                  </td>
                  <td className='font-medium text-gray-700'>{assignment.due_date}</td>
                  <td>
                    <span className={getUrgencyBadgeClass(assignment.days_left)}>
                      {getDaysLeftIcon(assignment.days_left)}
                      {getDaysLeftText(assignment.days_left)}
                    </span>
                  </td>
                  <td>
                    <div className='flex items-center space-x-2 space-x-reverse'>
                      <button
                        onClick={() => handleSubmitAssignment(assignment)}
                        className='dipy-button dipy-button-primary px-4 py-2 text-sm'
                      >
                        הגשת מטלה
                      </button>
                      <button className='dipy-interactive rounded-lg p-2 text-gray-400 hover:text-orange-500'>
                        <FileText className='h-5 w-5' />
                      </button>
                      <button
                        onClick={() => handleHideAssignment(assignment.id)}
                        className='dipy-interactive rounded-lg p-2 text-gray-400 hover:text-blue-600'
                        title='הסתר מטלה'
                      >
                        <EyeOff className='h-5 w-5' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Show Hidden Assignments Section */}
          {hiddenAssignments.size > 0 && (
            <div className='mt-6 rounded-lg border bg-gray-50 p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-700'>
                  מטלות מוסתרות ({hiddenAssignments.size})
                </h3>
                <button
                  onClick={() => setHiddenAssignments(new Set())}
                  className='text-sm font-medium text-blue-600 hover:text-blue-700'
                >
                  הצג הכל
                </button>
              </div>
              <div className='space-y-2'>
                {assignments
                  .filter((assignment) => hiddenAssignments.has(assignment.id))
                  .map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`flex items-center justify-between rounded-lg border border-l-4 bg-white p-3 ${
                        assignment.days_left < 0 ? 'border-l-red-500' : 'border-l-emerald-500'
                      }`}
                    >
                      <div className='flex-1'>
                        <div className='text-sm font-medium'>{assignment.title}</div>
                        <div className='text-xs text-gray-500'>{assignment.course}</div>
                      </div>
                      <div className='flex items-center space-x-2 space-x-reverse'>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            assignment.days_left < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {assignment.days_left < 0
                            ? `${Math.abs(assignment.days_left)} ימים עברו`
                            : `${assignment.days_left} ימים`}
                        </span>
                        <button
                          onClick={() => handleShowAssignment(assignment.id)}
                          className='rounded p-1 text-gray-400 hover:text-green-600'
                          title='הצג מטלה'
                        >
                          <Eye className='h-5 w-5' />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
