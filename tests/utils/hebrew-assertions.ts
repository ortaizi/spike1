import type { MatcherFunction } from 'expect';
import { expect } from 'vitest';

/**
 * 🔤 HEBREW ASSERTION UTILITIES - Spike Academic Platform
 *
 * Custom Jest/Vitest matchers for Hebrew text validation,
 * RTL layout testing, and academic content verification
 */

// ================================================================================================
// 🌍 HEBREW TEXT VALIDATION UTILITIES
// ================================================================================================

/**
 * Check if text contains Hebrew characters
 */
export const containsHebrew = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;

  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

/**
 * Check if text is primarily Hebrew (>50% Hebrew characters)
 */
export const isPrimarilyHebrew = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;

  const hebrewChars = text.match(/[\u0590-\u05FF]/g);
  const totalChars = text.replace(/\s+/g, '').length;

  if (totalChars === 0) return false;

  const hebrewCount = hebrewChars ? hebrewChars.length : 0;

  // For mixed content like "CS-101: מבוא למדעי המחשב", consider English prefixes
  // Check if text starts with English course code pattern
  const hasEnglishPrefix = /^[A-Z]{2,4}-\d{3}/.test(text);

  if (hasEnglishPrefix) {
    // For course codes, require higher Hebrew ratio to be considered primarily Hebrew
    return hebrewCount / totalChars > 0.75;
  }

  return hebrewCount / totalChars > 0.5;
};

/**
 * Check if text contains specific Hebrew academic terms
 */
export const containsAcademicHebrew = (text: string): boolean => {
  const academicTerms = [
    'קורס',
    'קורסים', // Course(s)
    'מטלה',
    'מטלת', // Assignment (construct state)
    'מטלות', // Assignment(s)
    'ציון',
    'ציונים', // Grade(s)
    'סמסטר', // Semester
    'שנה אקדמית', // Academic year
    'פקולטה',
    'פקולטת', // Faculty (with construct state)
    'מחלקה',
    'מחלקת', // Department (with construct state)
    'תלמיד',
    'תלמידה',
    'סטודנט', // Student
    'מרצה',
    'פרופסור', // Lecturer, Professor
    'לוח זמנים', // Schedule
    'בחינה',
    'בחינות', // Exam(s)
    'תואר', // Degree
    'נקודות זכות', // Credits
    'ממוצע', // GPA/Average
    'אוניברסיטה', // University
    'אוניברסיטת', // University (construct state)
    'מכללה',
    'מכללת', // College (with construct state)
    'מודל', // Moodle
    'בן-גוריון', // Ben-Gurion (specific university with hyphen)
    'בן גוריון', // Ben-Gurion (specific university with space)
    'בגוב', // BGU acronym
    'תל-אביב', // Tel Aviv
    'העברית', // Hebrew University
    'ירושלים', // Jerusalem
    'חיפה', // Haifa
    'באר שבע', // Beer Sheva
    'באר-שבע', // Beer Sheva (with hyphen)
    'טכניון', // Technion
    'וייצמן', // Weizmann
    'בר-אילן', // Bar-Ilan
    'ארץ-ישראל', // Eretz Israel
    'למדעי', // For sciences (construct form)
    'להשכלה', // For education
    'מוסד', // Institution
  ];

  return academicTerms.some((term) => text.includes(term));
};

/**
 * Validate Hebrew date formatting
 */
export const isHebrewDateFormat = (dateString: string): boolean => {
  // Hebrew months
  const hebrewMonths = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
  ];

  return hebrewMonths.some((month) => dateString.includes(month));
};

/**
 * Check if text contains Hebrew semester notation
 */
export const containsHebrewSemester = (text: string): boolean => {
  // Hebrew semester notations: א, ב, קיץ and academic years
  const semesterRegex = /סמסטר [אב]|סמסטר קיץ|תש"[א-ת]{1,2}/;
  return semesterRegex.test(text);
};

// ================================================================================================
// 🎯 RTL LAYOUT VALIDATION UTILITIES
// ================================================================================================

/**
 * Check if element has correct RTL direction
 */
export const hasRTLDirection = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.direction === 'rtl';
};

/**
 * Check if element uses logical CSS properties for RTL
 */
export const usesLogicalCSS = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element);

  // Check for logical properties instead of directional ones
  const hasLogicalMargin =
    computedStyle.marginInlineStart !== undefined || computedStyle.marginInlineEnd !== undefined;

  const hasLogicalPadding =
    computedStyle.paddingInlineStart !== undefined || computedStyle.paddingInlineEnd !== undefined;

  const hasLogicalBorder =
    computedStyle.borderInlineStartWidth !== undefined ||
    computedStyle.borderInlineEndWidth !== undefined;

  return hasLogicalMargin || hasLogicalPadding || hasLogicalBorder;
};

/**
 * Check text alignment for RTL content
 */
export const hasRTLTextAlignment = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element);
  const textAlign = computedStyle.textAlign;

  // For RTL, text should be right-aligned or start-aligned
  return textAlign === 'right' || textAlign === 'start' || textAlign === 'justify';
};

// ================================================================================================
// 🎓 ACADEMIC CONTENT VALIDATION
// ================================================================================================

/**
 * Validate academic year format (Hebrew or Gregorian)
 */
export const isValidAcademicYear = (year: string | number): boolean => {
  const numYear = typeof year === 'string' ? parseInt(year, 10) : year;

  // Hebrew academic year format (תש"פ, תש"ח, etc.) or Gregorian (2023, 2024)
  if (typeof year === 'string' && year.includes('תש"')) {
    return /תש"[פצקרש][א-ת]?/.test(year);
  }

  return numYear >= 2020 && numYear <= 2030;
};

/**
 * Validate Hebrew semester format
 */
export const isValidHebrewSemester = (semester: string): boolean => {
  const validSemesters = ['א', 'ב', 'קיץ', 'א׳', 'ב׳'];
  return validSemesters.includes(semester);
};

/**
 * Validate Israeli university code
 */
export const isValidUniversityCode = (code: string): boolean => {
  const validCodes = ['bgu', 'tau', 'huji', 'technion', 'weizmann', 'hebrew_u'];
  return validCodes.includes(code.toLowerCase());
};

/**
 * Validate Hebrew course code format
 */
export const isValidCourseCode = (courseCode: string): boolean => {
  // Format: DEPT-123 or Hebrew department codes
  const patterns = [
    /^[A-Z]{2,4}-\d{3}$/, // MATH-123, CS-456
    /^[א-ת]+\d{3}$/, // מתמטיקה123
    /^\d{5}$/, // BGU numeric format: 20225
  ];

  return patterns.some((pattern) => pattern.test(courseCode));
};

// ================================================================================================
// 🧪 CUSTOM VITEST MATCHERS
// ================================================================================================

/**
 * Custom matcher: toContainHebrew
 */
const toContainHebrew: MatcherFunction<[string]> = function (received: string) {
  const pass = containsHebrew(received);

  if (pass) {
    return {
      message: () => `Expected "${received}" not to contain Hebrew characters`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected "${received}" to contain Hebrew characters`,
      pass: false,
    };
  }
};

/**
 * Custom matcher: toBePrimarilyHebrew
 */
const toBePrimarilyHebrew: MatcherFunction<[string]> = function (received: string) {
  const pass = isPrimarilyHebrew(received);

  if (pass) {
    return {
      message: () => `Expected "${received}" not to be primarily Hebrew text`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected "${received}" to be primarily Hebrew text`,
      pass: false,
    };
  }
};

/**
 * Custom matcher: toHaveRTLDirection
 */
const toHaveRTLDirection: MatcherFunction<[HTMLElement]> = function (received: HTMLElement) {
  const pass = hasRTLDirection(received);

  if (pass) {
    return {
      message: () => `Expected element not to have RTL direction`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected element to have RTL direction`,
      pass: false,
    };
  }
};

/**
 * Custom matcher: toContainAcademicHebrew
 */
const toContainAcademicHebrew: MatcherFunction<[string]> = function (received: string) {
  const pass = containsAcademicHebrew(received);

  if (pass) {
    return {
      message: () => `Expected "${received}" not to contain Hebrew academic terms`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected "${received}" to contain Hebrew academic terms`,
      pass: false,
    };
  }
};

/**
 * Custom matcher: toBeValidAcademicYear
 */
const toBeValidAcademicYear: MatcherFunction<[string | number]> = function (
  received: string | number
) {
  const pass = isValidAcademicYear(received);

  if (pass) {
    return {
      message: () => `Expected "${received}" not to be a valid academic year`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected "${received}" to be a valid academic year`,
      pass: false,
    };
  }
};

/**
 * Custom matcher: toBeValidHebrewSemester
 */
const toBeValidHebrewSemester: MatcherFunction<[string]> = function (received: string) {
  const pass = isValidHebrewSemester(received);

  if (pass) {
    return {
      message: () => `Expected "${received}" not to be a valid Hebrew semester`,
      pass: true,
    };
  } else {
    return {
      message: () => `Expected "${received}" to be a valid Hebrew semester`,
      pass: false,
    };
  }
};

// ================================================================================================
// 🔧 MATCHER REGISTRATION
// ================================================================================================

// Register custom matchers with Vitest
expect.extend({
  toContainHebrew,
  toBePrimarilyHebrew,
  toHaveRTLDirection,
  toContainAcademicHebrew,
  toBeValidAcademicYear,
  toBeValidHebrewSemester,
});

// ================================================================================================
// 📝 TYPE DECLARATIONS FOR TYPESCRIPT
// ================================================================================================

declare module 'vitest' {
  interface Assertion<T = any> {
    toContainHebrew(): T;
    toBePrimarilyHebrew(): T;
    toHaveRTLDirection(): T;
    toContainAcademicHebrew(): T;
    toBeValidAcademicYear(): T;
    toBeValidHebrewSemester(): T;
  }
}

// ================================================================================================
// 📚 USAGE EXAMPLES
// ================================================================================================

/*
// Hebrew text validation
expect('שלום עולם').toContainHebrew();
expect('ברוך הבא לאוניברסיטת בן גוריון').toBePrimarilyHebrew();
expect('הקורס במתמטיקה זמין לכל הסטודנטים').toContainAcademicHebrew();

// RTL layout validation
const hebrewElement = screen.getByTestId('hebrew-content');
expect(hebrewElement).toHaveRTLDirection();

// Academic data validation
expect('2024').toBeValidAcademicYear();
expect('תש"ף').toBeValidAcademicYear();
expect('א').toBeValidHebrewSemester();

// Utility function usage
if (containsHebrew(userInput)) {
  // Handle Hebrew input
}

if (isValidCourseCode('MATH-101')) {
  // Process course code
}
*/

// All functions are already exported individually above
// No need for a group export that would cause duplicate export errors
