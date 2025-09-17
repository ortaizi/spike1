'use client';

import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  instructor: string | null;
  semester: string;
  academicyear: number;
  faculty: string;
  department: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  duedate: string;
  priority: string;
  status: string;
  weight: number;
}

interface UserData {
  courses: Course[];
  assignments: Assignment[];
  totalCourses: number;
  totalAssignments: number;
}

// נתונים פיקטיביים לקורסים
const mockCourses: Course[] = [
  {
    id: '1',
    name: 'מבוא למדעי המחשב',
    code: 'CS101',
    description: 'קורס בסיסי במדעי המחשב המכסה את יסודות התכנות והאלגוריתמים',
    instructor: 'ד"ר יוסי כהן',
    semester: 'א',
    academicyear: 2025,
    faculty: 'הנדסה',
    department: 'מדעי המחשב',
  },
  {
    id: '2',
    name: 'מבני נתונים',
    code: 'CS201',
    description: 'לימוד מבני נתונים מתקדמים ואלגוריתמי חיפוש ומיון',
    instructor: "פרופ' שרה לוי",
    semester: 'א',
    academicyear: 2025,
    faculty: 'הנדסה',
    department: 'מדעי המחשב',
  },
  {
    id: '3',
    name: 'אלגברה לינארית',
    code: 'MATH101',
    description: 'יסודות האלגברה הלינארית ויישומיה במדעי המחשב',
    instructor: 'ד"ר דוד גולדברג',
    semester: 'א',
    academicyear: 2025,
    faculty: 'מדעים מדויקים',
    department: 'מתמטיקה',
  },
  {
    id: '4',
    name: 'תכנות מונחה עצמים',
    code: 'CS301',
    description: 'עקרונות התכנות המונחה עצמים ויישומם בשפת Java',
    instructor: 'ד"ר מיכל אברהם',
    semester: 'א',
    academicyear: 2025,
    faculty: 'הנדסה',
    department: 'מדעי המחשב',
  },
];

// נתונים פיקטיביים למטלות
const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'תרגיל 1 - מבוא למדעי המחשב',
    description: 'תרגילי תכנות בסיסיים ב-Python',
    duedate: '2025-01-15',
    priority: 'HIGH',
    status: 'PENDING',
    weight: 15,
  },
  {
    id: '2',
    title: 'פרויקט מבני נתונים',
    description: 'יישום עץ בינארי מאוזן',
    duedate: '2025-01-20',
    priority: 'HIGH',
    status: 'PENDING',
    weight: 25,
  },
  {
    id: '3',
    title: 'בחינת אמצע - אלגברה לינארית',
    description: 'בחינה על מטריצות וטרנספורמציות לינאריות',
    duedate: '2025-01-25',
    priority: 'MEDIUM',
    status: 'PENDING',
    weight: 30,
  },
  {
    id: '4',
    title: 'תרגיל 2 - תכנות מונחה עצמים',
    description: 'יצירת מערכת ניהול ספרייה ב-Java',
    duedate: '2025-01-30',
    priority: 'MEDIUM',
    status: 'PENDING',
    weight: 20,
  },
  {
    id: '5',
    title: 'עבודה סופית - אלגוריתמים',
    description: 'ניתוח סיבוכיות אלגוריתמים',
    duedate: '2024-12-15',
    priority: 'HIGH',
    status: 'PENDING',
    weight: 40,
  },
  {
    id: '6',
    title: 'תרגיל בית - מבני נתונים',
    description: 'יישום רשימה מקושרת',
    duedate: '2024-12-20',
    priority: 'MEDIUM',
    status: 'PENDING',
    weight: 15,
  },
];

export function UserCoursesDisplay({ userId }: { userId: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenAssignments, setHiddenAssignments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // קבלת קורסים של המשתמש
        const coursesResponse = await fetch(`/api/user/courses?userId=${userId}`);
        const coursesData = coursesResponse.ok ? await coursesResponse.json() : [];

        // קבלת מטלות של המשתמש
        const assignmentsResponse = await fetch(`/api/user/assignments?userId=${userId}`);
        const assignmentsData = assignmentsResponse.ok ? await assignmentsResponse.json() : [];

        // אם אין נתונים אמיתיים, השתמש בנתונים פיקטיביים
        const finalCourses = coursesData.length > 0 ? coursesData : mockCourses;
        const finalAssignments = assignmentsData.length > 0 ? assignmentsData : mockAssignments;

        setUserData({
          courses: finalCourses,
          assignments: finalAssignments,
          totalCourses: finalCourses.length,
          totalAssignments: finalAssignments.length,
        });
      } catch (err) {
        setError('שגיאה בטעינת נתונים');
        console.error('שגיאה בטעינת נתוני משתמש:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

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

  // סינון מטלות מוסתרות
  const visibleAssignments = (userData?.assignments || mockAssignments).filter(
    (assignment) => !hiddenAssignments.has(assignment.id)
  );

  if (loading) {
    return (
      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <GraduationCap className='h-5 w-5' />
              קורסים שלי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-center py-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle className='h-5 w-5' />
              שגיאה בטעינת נתונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-red-600'>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // תמיד הצג את התוכן עם הנתונים (פיקטיביים או אמיתיים)
  return (
    <div className='space-y-6'>
      {/* סטטיסטיקות כללית */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>סה"כ קורסים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {userData?.totalCourses || mockCourses.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>מטלות פעילות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {userData?.totalAssignments || mockAssignments.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>סנכרון אחרון</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-gray-600'>היום, 13:45</div>
          </CardContent>
        </Card>
      </div>

      {/* רשימת קורסים */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <GraduationCap className='h-5 w-5' />
            הקורסים שלי
          </CardTitle>
          <CardDescription>
            {userData?.totalCourses || mockCourses.length} קורסים פעילים בסמסטר הנוכחי
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {(userData?.courses || mockCourses).map((course) => (
              <div
                key={course.id}
                className='rounded-lg border p-4 transition-colors hover:bg-gray-50'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='mb-2 flex items-center gap-2'>
                      <h3 className='text-lg font-semibold'>{course.name}</h3>
                      <Badge variant='secondary'>{course.code}</Badge>
                    </div>

                    {course.description && (
                      <p className='mb-3 text-sm text-gray-600'>{course.description}</p>
                    )}

                    <div className='flex items-center gap-4 text-sm text-gray-500'>
                      {course.instructor && (
                        <div className='flex items-center gap-1'>
                          <User className='h-4 w-4' />
                          <span>{course.instructor}</span>
                        </div>
                      )}

                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        <span>
                          סמסטר {course.semester}, {course.academicyear}
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        <BookOpen className='h-4 w-4' />
                        <span>
                          {course.faculty} - {course.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* מטלות קרובות */}
      {(userData?.assignments || mockAssignments).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              מטלות קרובות
            </CardTitle>
            <CardDescription>{visibleAssignments.length} מטלות פעילות</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {visibleAssignments.slice(0, 5).map((assignment) => {
                const dueDate = new Date(assignment.duedate);
                const today = new Date();
                const daysLeft = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                const getUrgencyClass = (daysLeft: number) => {
                  if (daysLeft < 0) return 'border-red-300 bg-red-50';
                  return 'border-emerald-200 bg-emerald-50';
                };

                const getUrgencyText = (daysLeft: number) => {
                  if (daysLeft < 0) return `${Math.abs(daysLeft)} ימים עברו`;
                  if (daysLeft === 0) return 'היום!';
                  return `${daysLeft} ימים נותרו`;
                };

                const getUrgencyColor = (daysLeft: number) => {
                  if (daysLeft < 0) return 'text-red-700';
                  return 'text-emerald-700';
                };

                return (
                  <div
                    key={assignment.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${getUrgencyClass(daysLeft)} border-l-4 ${
                      daysLeft < 0 ? 'border-l-red-500' : 'border-l-emerald-500'
                    }`}
                  >
                    <div className='flex-1'>
                      <h4 className='font-medium'>{assignment.title}</h4>
                      <p className='text-sm text-gray-600'>
                        תאריך יעד: {dueDate.toLocaleDateString('he-IL')}
                      </p>
                      <p className={`text-sm font-medium ${getUrgencyColor(daysLeft)}`}>
                        {getUrgencyText(daysLeft)}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={
                          assignment.priority === 'HIGH'
                            ? 'destructive'
                            : assignment.priority === 'MEDIUM'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {assignment.priority}
                      </Badge>
                      <Badge variant='outline'>{assignment.weight}%</Badge>
                      <button
                        onClick={() => handleHideAssignment(assignment.id)}
                        className='rounded p-1 text-gray-400 hover:text-blue-600'
                        title='הסתר מטלה'
                      >
                        <EyeOff className='h-5 w-5' />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show Hidden Assignments Section */}
            {hiddenAssignments.size > 0 && (
              <div className='mt-4 border-t border-gray-200 pt-4'>
                <div className='mb-3 flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-gray-700'>
                    מטלות מוסתרות ({hiddenAssignments.size})
                  </h4>
                  <button
                    onClick={() => setHiddenAssignments(new Set())}
                    className='text-xs font-medium text-blue-600 hover:text-blue-700'
                  >
                    הצג הכל
                  </button>
                </div>
                <div className='space-y-2'>
                  {(userData?.assignments || mockAssignments)
                    .filter((assignment) => hiddenAssignments.has(assignment.id))
                    .slice(0, 3)
                    .map((assignment) => {
                      const dueDate = new Date(assignment.duedate);
                      const today = new Date();
                      const daysLeft = Math.ceil(
                        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );

                      return (
                        <div
                          key={assignment.id}
                          className={`flex items-center justify-between rounded-lg border border-l-4 bg-gray-50 p-2 ${
                            daysLeft < 0 ? 'border-l-red-500' : 'border-l-emerald-500'
                          }`}
                        >
                          <div className='flex-1'>
                            <div className='text-sm font-medium'>{assignment.title}</div>
                            <div className='text-xs text-gray-500'>
                              {dueDate.toLocaleDateString('he-IL')}
                            </div>
                          </div>
                          <div className='flex items-center space-x-2 space-x-reverse'>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                daysLeft < 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {daysLeft < 0
                                ? `${Math.abs(daysLeft)} ימים עברו`
                                : `${daysLeft} ימים`}
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
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
