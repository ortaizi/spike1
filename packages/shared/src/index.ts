// Re-export database types
export type {
  User,
  Course,
  Assignment,
  Grade,
  CourseEnrollment,
  Team,
  TeamMember,
  AssignmentSubmission,
  Reminder,
  Priority,
  AssignmentStatus,
  EnrollmentStatus,
  TeamRole,
} from '@spike/database';

// Common types
export interface UserPreferences {
  language: 'he' | 'en';
  theme: 'light' | 'dark';
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Hebrew validation messages
export const hebrewValidationMessages = {
  required: 'שדה זה הוא חובה',
  email: 'כתובת אימייל לא תקינה',
  minLength: (min: number) => `מינימום ${min} תווים נדרשים`,
  maxLength: (max: number) => `מקסימום ${max} תווים מותרים`,
  invalidCourseCode: 'קוד קורס לא תקין (פורמט: XXX-X-XXXX)',
  invalidStudentId: 'מספר סטודנט לא תקין',
  invalidPhone: 'מספר טלפון לא תקין',
  passwordMismatch: 'סיסמאות אינן תואמות',
  weakPassword: 'סיסמה חייבת להכיל לפחות 8 תווים',
};

// Hebrew date formatting utilities
export const formatHebrewDate = (date: Date): string => {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatHebrewNumber = (num: number): string => {
  return new Intl.NumberFormat('he-IL').format(num);
};

export const formatHebrewCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(amount);
};

// Academic year handling (October-September)
export const getAcademicYear = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 10 ? year : year - 1;
};

// BGU semester mapping
export const bguSemesters = {
  'א': 'Fall',
  'ב': 'Spring', 
  'קיץ': 'Summer',
} as const;

export const getHebrewSemester = (semester: string): string => {
  return Object.entries(bguSemesters).find(([_, value]) => value === semester)?.[0] || semester;
};

// Text direction logic
export const getTextDirection = (text: string): 'ltr' | 'rtl' => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text) ? 'rtl' : 'ltr';
}; 