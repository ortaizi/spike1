// Shared utilities and types for Spike Platform
// Re-export all database types
export * from './types';
// Utility functions
export function formatDate(date) {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}
export function formatDateTime(date) {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
export function formatGrade(grade, maxGrade) {
  const percentage = (grade / maxGrade) * 100;
  return `${grade}/${maxGrade} (${percentage.toFixed(1)}%)`;
}
// Hebrew validation messages
export const hebrewValidationMessages = {
  required: 'שדה זה הוא חובה',
  email: 'כתובת אימייל לא תקינה',
  minLength: (min) => `מינימום ${min} תווים נדרשים`,
  maxLength: (max) => `מקסימום ${max} תווים מותרים`,
  invalidCourseCode: 'קוד קורס לא תקין (פורמט: XXX-X-XXXX)',
  invalidStudentId: 'מספר סטודנט לא תקין',
  invalidGrade: 'ציון לא תקין (0-100)',
  invalidDate: 'תאריך לא תקין',
  invalidTime: 'שעה לא תקינה',
  passwordTooWeak: 'סיסמה חלשה מדי',
  passwordsNotMatch: 'סיסמאות לא תואמות',
  phoneInvalid: 'מספר טלפון לא תקין',
  required_field: 'חובה למלא',
  min_length: (min) => `לפחות ${min} תווים`,
  max_length: (max) => `עד ${max} תווים`,
  invalid_email: 'כתובת דואר אלקטרוני לא תקינה',
  invalid_phone: 'מספר טלפון לא תקין',
  invalid_url: 'כתובת URL לא תקינה',
  future_date: 'תאריך חייב להיות בעתיד',
  past_date: 'תאריך חייב להיות בעבר',
  positive_number: 'מספר חייב להיות חיובי',
  integer_only: 'רק מספרים שלמים מותרים',
  between: (min, max) => `ערך חייב להיות בין ${min} ל-${max}`,
};
// Academic year helpers
export function getCurrentAcademicYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based, so September is 8
  // Academic year starts in October (month 9)
  return currentMonth >= 9 ? currentYear : currentYear - 1;
}
export function getCurrentSemester() {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-based
  if (currentMonth >= 9 || currentMonth <= 0) {
    return 'א'; // Fall semester: October-January
  } else if (currentMonth >= 1 && currentMonth <= 5) {
    return 'ב'; // Spring semester: February-June
  } else {
    return 'קיץ'; // Summer semester: July-September
  }
}
export function getAcademicYearString(year) {
  return `תשפ"${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
}
// Course code validation
export function isValidCourseCode(code) {
  // BGU format: XXX-X-XXXX (e.g., 201-1-1234)
  const pattern = /^\d{3}-\d{1}-\d{4}$/;
  return pattern.test(code);
}
// Student ID validation
export function isValidStudentId(id) {
  // Israeli student ID: 9 digits
  const pattern = /^\d{9}$/;
  return pattern.test(id);
}
// Grade helpers
export function calculateGPA(grades) {
  if (grades.length === 0) return 0;
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  const weightedSum = grades.reduce((sum, g) => sum + g.grade * g.credits, 0);
  return totalCredits > 0 ? weightedSum / totalCredits : 0;
}
export function getGradeStatus(grade) {
  if (grade >= 90) return 'excellent';
  if (grade >= 80) return 'good';
  if (grade >= 60) return 'satisfactory';
  return 'fail';
}
// Priority helpers
export function getPriorityColor(priority) {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'text-red-600 bg-red-50';
    case 'high':
      return 'text-orange-600 bg-orange-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
// Status helpers
export function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'submitted':
    case 'graded':
      return 'text-green-600 bg-green-50';
    case 'in_progress':
    case 'pending':
      return 'text-blue-600 bg-blue-50';
    case 'overdue':
    case 'late':
      return 'text-red-600 bg-red-50';
    case 'draft':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
// Time helpers
export function timeUntilDue(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  if (diff < 0) {
    return 'פג תוקף';
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return `${days} ימים`;
  } else if (hours > 0) {
    return `${hours} שעות`;
  } else {
    return `${minutes} דקות`;
  }
}
export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}
export function isDueSoon(dueDate, hoursThreshold = 24) {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours > 0 && hours <= hoursThreshold;
}
//# sourceMappingURL=index.js.map
