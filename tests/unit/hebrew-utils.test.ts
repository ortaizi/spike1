/**
 * 🔤 HEBREW UTILITIES TESTS
 *
 * Unit tests for Hebrew text processing, RTL layout utilities,
 * and academic Hebrew terminology validation
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  containsAcademicHebrew,
  containsHebrew,
  containsHebrewSemester,
  hasRTLDirection,
  isHebrewDateFormat,
  isPrimarilyHebrew,
  isValidAcademicYear,
  isValidCourseCode,
  isValidHebrewSemester,
} from '../utils/hebrew-assertions';

// ================================================================================================
// 🧪 HEBREW TEXT VALIDATION TESTS
// ================================================================================================

describe('🔤 Hebrew Text Validation', () => {
  describe('containsHebrew', () => {
    it('should detect Hebrew characters', () => {
      expect(containsHebrew('שלום')).toBe(true);
      expect(containsHebrew('Hello שלום')).toBe(true);
      expect(containsHebrew('בדיקה test')).toBe(true);
      expect(containsHebrew('אוניברסיטת בן גוריון')).toBe(true);
    });

    it('should return false for non-Hebrew text', () => {
      expect(containsHebrew('Hello World')).toBe(false);
      expect(containsHebrew('123456')).toBe(false);
      expect(containsHebrew('English only text')).toBe(false);
      expect(containsHebrew('')).toBe(false);
    });

    it('should handle special characters and punctuation', () => {
      expect(containsHebrew('שלום!')).toBe(true);
      expect(containsHebrew('מתמטיקה 101')).toBe(true);
      expect(containsHebrew('test@bgu.ac.il')).toBe(false);
      expect(containsHebrew('123-456-789')).toBe(false);
    });

    it('should handle mixed scripts correctly', () => {
      expect(containsHebrew('Ben Gurion University - אוניברסיטת בן גוריון')).toBe(true);
      expect(containsHebrew('CS-101: מבוא למדעי המחשב')).toBe(true);
      expect(containsHebrew('Email: student@דוגמה.co.il')).toBe(true);
    });
  });

  describe('isPrimarilyHebrew', () => {
    it('should identify primarily Hebrew text', () => {
      expect(isPrimarilyHebrew('מתמטיקה לינארית')).toBe(true);
      expect(isPrimarilyHebrew('אוניברסיטת בן גוריון בנגב')).toBe(true);
      expect(isPrimarilyHebrew('קורס מבוא למדעי המחשב')).toBe(true);
      expect(isPrimarilyHebrew('דוד כהן - סטודנט למתמטיקה')).toBe(true);
    });

    it('should identify primarily non-Hebrew text', () => {
      expect(isPrimarilyHebrew('Introduction to Computer Science')).toBe(false);
      expect(isPrimarilyHebrew('CS-101 מבוא')).toBe(false);
      expect(isPrimarilyHebrew('Ben Gurion University')).toBe(false);
      expect(isPrimarilyHebrew('test@bgu.ac.il')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isPrimarilyHebrew('')).toBe(false);
      expect(isPrimarilyHebrew('123456')).toBe(false);
      expect(isPrimarilyHebrew('א')).toBe(true);
      expect(isPrimarilyHebrew('A')).toBe(false);
    });

    it('should calculate Hebrew percentage correctly', () => {
      // 50-50 split should return false (need >50% Hebrew)
      expect(isPrimarilyHebrew('שלום hello')).toBe(false);
      // More Hebrew should return true
      expect(isPrimarilyHebrew('שלום עולם hello')).toBe(true);
      // More English should return false
      expect(isPrimarilyHebrew('שלום hello world')).toBe(false);
    });
  });

  describe('containsAcademicHebrew', () => {
    it('should detect Hebrew academic terms', () => {
      expect(containsAcademicHebrew('קורס במתמטיקה')).toBe(true);
      expect(containsAcademicHebrew('מטלת בית בפיזיקה')).toBe(true);
      expect(containsAcademicHebrew('ציון הבחינה')).toBe(true);
      expect(containsAcademicHebrew('סמסטר חורף')).toBe(true);
      expect(containsAcademicHebrew('שנה אקדמית 2024')).toBe(true);
      expect(containsAcademicHebrew('סטודנט למתמטיקה')).toBe(true);
      expect(containsAcademicHebrew('פרופסור לפיזיקה')).toBe(true);
      expect(containsAcademicHebrew('אוניברסיטת בן גוריון')).toBe(true);
    });

    it('should handle plural forms', () => {
      expect(containsAcademicHebrew('קורסים')).toBe(true);
      expect(containsAcademicHebrew('מטלות')).toBe(true);
      expect(containsAcademicHebrew('ציונים')).toBe(true);
      expect(containsAcademicHebrew('בחינות')).toBe(true);
    });

    it('should return false for non-academic Hebrew', () => {
      expect(containsAcademicHebrew('שלום עולם')).toBe(false);
      expect(containsAcademicHebrew('מזג האוויר יפה')).toBe(false);
      expect(containsAcademicHebrew('אני הולך הביתה')).toBe(false);
    });

    it('should return false for non-Hebrew text', () => {
      expect(containsAcademicHebrew('Computer Science Course')).toBe(false);
      expect(containsAcademicHebrew('Mathematics Assignment')).toBe(false);
      expect(containsAcademicHebrew('University Student')).toBe(false);
    });
  });

  describe('isHebrewDateFormat', () => {
    it('should detect Hebrew month names', () => {
      expect(isHebrewDateFormat('15 בינואר 2024')).toBe(true);
      expect(isHebrewDateFormat('חודש מרץ')).toBe(true);
      expect(isHebrewDateFormat('אפריל השנה')).toBe(true);
      expect(isHebrewDateFormat('31 בדצמבר')).toBe(true);
    });

    it('should handle all Hebrew months', () => {
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

      hebrewMonths.forEach((month) => {
        expect(isHebrewDateFormat(`15 ב${month} 2024`)).toBe(true);
      });
    });

    it('should return false for English dates', () => {
      expect(isHebrewDateFormat('January 15, 2024')).toBe(false);
      expect(isHebrewDateFormat('March 2024')).toBe(false);
      expect(isHebrewDateFormat('2024-03-15')).toBe(false);
    });
  });

  describe('containsHebrewSemester', () => {
    it('should detect Hebrew semester notations', () => {
      expect(containsHebrewSemester('סמסטר א')).toBe(true);
      expect(containsHebrewSemester('סמסטר ב')).toBe(true);
      expect(containsHebrewSemester('סמסטר קיץ')).toBe(true);
    });

    it('should detect Hebrew academic year format', () => {
      expect(containsHebrewSemester('תש"פ')).toBe(true);
      expect(containsHebrewSemester('תש"צ')).toBe(true);
      expect(containsHebrewSemester('תש"קא')).toBe(true);
    });

    it('should return false for non-Hebrew semester text', () => {
      expect(containsHebrewSemester('Fall Semester')).toBe(false);
      expect(containsHebrewSemester('Spring 2024')).toBe(false);
      expect(containsHebrewSemester('Summer Term')).toBe(false);
    });
  });
});

// ================================================================================================
// 🎯 RTL LAYOUT VALIDATION TESTS
// ================================================================================================

describe('🎯 RTL Layout Validation', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Create a mock HTML element for testing
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  describe('hasRTLDirection', () => {
    it('should detect RTL direction', () => {
      mockElement.style.direction = 'rtl';
      expect(hasRTLDirection(mockElement)).toBe(true);
    });

    it('should detect LTR direction', () => {
      mockElement.style.direction = 'ltr';
      expect(hasRTLDirection(mockElement)).toBe(false);
    });

    it('should handle default direction', () => {
      // Default direction depends on browser, but typically LTR
      const result = hasRTLDirection(mockElement);
      expect(typeof result).toBe('boolean');
    });

    it('should work with Hebrew content elements', () => {
      mockElement.textContent = 'שלום עולם';
      mockElement.style.direction = 'rtl';
      expect(hasRTLDirection(mockElement)).toBe(true);
    });
  });
});

// ================================================================================================
// 🎓 ACADEMIC VALIDATION TESTS
// ================================================================================================

describe('🎓 Academic Content Validation', () => {
  describe('isValidAcademicYear', () => {
    it('should validate Gregorian academic years', () => {
      expect(isValidAcademicYear(2024)).toBe(true);
      expect(isValidAcademicYear(2023)).toBe(true);
      expect(isValidAcademicYear('2025')).toBe(true);
      expect(isValidAcademicYear('2026')).toBe(true);
    });

    it('should validate Hebrew academic years', () => {
      expect(isValidAcademicYear('תש"פ')).toBe(true);
      expect(isValidAcademicYear('תש"צ')).toBe(true);
      expect(isValidAcademicYear('תש"ק')).toBe(true);
      expect(isValidAcademicYear('תש"קא')).toBe(true);
    });

    it('should reject invalid years', () => {
      expect(isValidAcademicYear(2015)).toBe(false); // Too old
      expect(isValidAcademicYear(2035)).toBe(false); // Too far in future
      expect(isValidAcademicYear('invalid')).toBe(false);
      expect(isValidAcademicYear('תש"')).toBe(false); // Incomplete Hebrew year
    });

    it('should handle edge cases', () => {
      expect(isValidAcademicYear(2020)).toBe(true); // Boundary
      expect(isValidAcademicYear(2030)).toBe(true); // Boundary
      expect(isValidAcademicYear(2019)).toBe(false); // Just outside
      expect(isValidAcademicYear(2031)).toBe(false); // Just outside
    });
  });

  describe('isValidHebrewSemester', () => {
    it('should validate Hebrew semester notations', () => {
      expect(isValidHebrewSemester('א')).toBe(true);
      expect(isValidHebrewSemester('ב')).toBe(true);
      expect(isValidHebrewSemester('קיץ')).toBe(true);
      expect(isValidHebrewSemester('א׳')).toBe(true);
      expect(isValidHebrewSemester('ב׳')).toBe(true);
    });

    it('should reject invalid semester notations', () => {
      expect(isValidHebrewSemester('ג')).toBe(false);
      expect(isValidHebrewSemester('1')).toBe(false);
      expect(isValidHebrewSemester('Fall')).toBe(false);
      expect(isValidHebrewSemester('spring')).toBe(false);
      expect(isValidHebrewSemester('')).toBe(false);
    });

    it('should be case sensitive for Hebrew letters', () => {
      expect(isValidHebrewSemester('א')).toBe(true);
      expect(isValidHebrewSemester('ב')).toBe(true);
      // Hebrew doesn't have case, but testing with similar looking characters
      expect(isValidHebrewSemester('כ')).toBe(false);
      expect(isValidHebrewSemester('ד')).toBe(false);
    });
  });

  describe('isValidCourseCode', () => {
    it('should validate standard course codes', () => {
      expect(isValidCourseCode('CS-101')).toBe(true);
      expect(isValidCourseCode('MATH-201')).toBe(true);
      expect(isValidCourseCode('PHYS-105')).toBe(true);
      expect(isValidCourseCode('ENG-250')).toBe(true);
    });

    it('should validate Hebrew department codes', () => {
      expect(isValidCourseCode('מתמטיקה101')).toBe(true);
      expect(isValidCourseCode('פיזיקה205')).toBe(true);
      expect(isValidCourseCode('כימיה150')).toBe(true);
    });

    it('should validate BGU numeric format', () => {
      expect(isValidCourseCode('20225')).toBe(true);
      expect(isValidCourseCode('10145')).toBe(true);
      expect(isValidCourseCode('30567')).toBe(true);
    });

    it('should reject invalid course codes', () => {
      expect(isValidCourseCode('CS101')).toBe(false); // Missing dash
      expect(isValidCourseCode('MATH-')).toBe(false); // Missing number
      expect(isValidCourseCode('101-CS')).toBe(false); // Wrong order
      expect(isValidCourseCode('CS-1')).toBe(false); // Too short number
      expect(isValidCourseCode('CS-1234')).toBe(false); // Too long number
      expect(isValidCourseCode('123456')).toBe(false); // 6 digits instead of 5
      expect(isValidCourseCode('1234')).toBe(false); // 4 digits instead of 5
      expect(isValidCourseCode('')).toBe(false);
      expect(isValidCourseCode('invalid')).toBe(false);
    });

    it('should handle mixed Hebrew-English codes', () => {
      // These might be edge cases depending on university standards
      expect(isValidCourseCode('CS-מבוא')).toBe(false); // Numbers expected
      expect(isValidCourseCode('מדעי-101')).toBe(false); // Hebrew department should use different format
    });
  });
});

// ================================================================================================
// 🧪 INTEGRATION TESTS FOR COMBINED HEBREW FEATURES
// ================================================================================================

describe('🧪 Hebrew Feature Integration', () => {
  describe('Academic Course Title Processing', () => {
    it('should correctly process Hebrew course titles', () => {
      const courseTitle = 'מתמטיקה דיסקרטית - קורס א';

      expect(containsHebrew(courseTitle)).toBe(true);
      expect(isPrimarilyHebrew(courseTitle)).toBe(true);
      expect(containsAcademicHebrew(courseTitle)).toBe(true);
    });

    it('should process mixed Hebrew-English course titles', () => {
      const courseTitle = 'CS-101: מבוא למדעי המחשב';

      expect(containsHebrew(courseTitle)).toBe(true);
      expect(isPrimarilyHebrew(courseTitle)).toBe(false); // More English
      expect(containsAcademicHebrew(courseTitle)).toBe(true);
    });

    it('should validate complete course information', () => {
      const courseCode = 'CS-101';
      const courseName = 'מבוא למדעי המחשב';
      const semester = 'א';
      const year = '2024';

      expect(isValidCourseCode(courseCode)).toBe(true);
      expect(containsAcademicHebrew(courseName)).toBe(true);
      expect(isValidHebrewSemester(semester)).toBe(true);
      expect(isValidAcademicYear(year)).toBe(true);
    });
  });

  describe('Student Information Processing', () => {
    it('should validate Hebrew student information', () => {
      const studentName = 'דוד כהן בן אברהם';
      const semester = 'ב';
      const year = 'תש"פ';

      expect(containsHebrew(studentName)).toBe(true);
      expect(isPrimarilyHebrew(studentName)).toBe(true);
      expect(isValidHebrewSemester(semester)).toBe(true);
      expect(isValidAcademicYear(year)).toBe(true);
    });

    it('should handle mixed Hebrew-English student data', () => {
      const email = 'david.cohen@bgu.ac.il';
      const hebrewName = 'דוד כהן';
      const englishName = 'David Cohen';

      expect(containsHebrew(email)).toBe(false);
      expect(containsHebrew(hebrewName)).toBe(true);
      expect(containsHebrew(englishName)).toBe(false);
      expect(isPrimarilyHebrew(hebrewName)).toBe(true);
      expect(isPrimarilyHebrew(englishName)).toBe(false);
    });
  });

  describe('Academic Calendar Processing', () => {
    it('should process Hebrew academic calendar terms', () => {
      const semesterTexts = ['סמסטר א 2024', 'סמסטר ב תש"פ', 'סמסטר קיץ 2024'];

      semesterTexts.forEach((text) => {
        expect(containsHebrewSemester(text)).toBe(true);
        expect(containsHebrew(text)).toBe(true);
        expect(containsAcademicHebrew(text)).toBe(true);
      });
    });

    it('should validate Hebrew dates in academic context', () => {
      const hebrewDates = ['15 בינואר 2024', 'תחילת הסמסטר: 1 באוקטובר', 'בחינות בדצמבר'];

      hebrewDates.forEach((date) => {
        expect(isHebrewDateFormat(date)).toBe(true);
        expect(containsHebrew(date)).toBe(true);
      });
    });
  });
});

// ================================================================================================
// 🛡️ ERROR HANDLING AND EDGE CASES
// ================================================================================================

describe('🛡️ Error Handling and Edge Cases', () => {
  describe('Input Validation', () => {
    it('should handle null and undefined inputs', () => {
      expect(() => containsHebrew(null as any)).not.toThrow();
      expect(() => containsHebrew(undefined as any)).not.toThrow();
      expect(() => isPrimarilyHebrew(null as any)).not.toThrow();
      expect(() => isPrimarilyHebrew(undefined as any)).not.toThrow();
    });

    it('should handle empty strings', () => {
      expect(containsHebrew('')).toBe(false);
      expect(isPrimarilyHebrew('')).toBe(false);
      expect(containsAcademicHebrew('')).toBe(false);
      expect(isHebrewDateFormat('')).toBe(false);
      expect(containsHebrewSemester('')).toBe(false);
    });

    it('should handle non-string inputs gracefully', () => {
      expect(() => containsHebrew(123 as any)).not.toThrow();
      expect(() => containsHebrew({} as any)).not.toThrow();
      expect(() => containsHebrew([] as any)).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longHebrewText = 'שלום '.repeat(1000);
      const longEnglishText = 'hello '.repeat(1000);

      expect(containsHebrew(longHebrewText)).toBe(true);
      expect(containsHebrew(longEnglishText)).toBe(false);
      expect(isPrimarilyHebrew(longHebrewText)).toBe(true);
      expect(isPrimarilyHebrew(longEnglishText)).toBe(false);
    });
  });

  describe('Unicode Edge Cases', () => {
    it('should handle Hebrew with diacritics', () => {
      const hebrewWithNikud = 'שָׁלוֹם עוֹלָם';
      expect(containsHebrew(hebrewWithNikud)).toBe(true);
      expect(isPrimarilyHebrew(hebrewWithNikud)).toBe(true);
    });

    it('should handle Hebrew punctuation', () => {
      const hebrewWithPunctuation = 'שלום, איך אתה?';
      expect(containsHebrew(hebrewWithPunctuation)).toBe(true);
      expect(isPrimarilyHebrew(hebrewWithPunctuation)).toBe(true);
    });

    it('should handle RTL marks and formatting characters', () => {
      const hebrewWithRTLMarks = '\u202Eשלום עולם\u202C';
      expect(containsHebrew(hebrewWithRTLMarks)).toBe(true);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle repeated validations efficiently', () => {
      const testText = 'בדיקת ביצועים לטקסט עברי';

      // Run multiple times to test performance
      for (let i = 0; i < 100; i++) {
        expect(containsHebrew(testText)).toBe(true);
        expect(isPrimarilyHebrew(testText)).toBe(true);
        expect(containsAcademicHebrew(testText)).toBe(false);
      }
    });

    it('should handle regex patterns efficiently', () => {
      const mixedTexts = ['שלום hello', 'מתמטיקה Mathematics', 'קורס Course', 'סטודנט Student'];

      mixedTexts.forEach((text) => {
        expect(() => containsHebrew(text)).not.toThrow();
        expect(() => isPrimarilyHebrew(text)).not.toThrow();
        expect(() => containsAcademicHebrew(text)).not.toThrow();
      });
    });
  });
});
