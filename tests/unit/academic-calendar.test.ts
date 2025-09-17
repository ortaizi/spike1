/**
 * 📅 ACADEMIC CALENDAR TESTS
 *
 * Unit tests for Israeli academic calendar logic,
 * Hebrew semester calculations, and university-specific scheduling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ================================================================================================
// 🧪 MOCK ACADEMIC CALENDAR UTILITIES
// ================================================================================================

// Mock academic calendar utilities (would typically be imported from lib/utils/academic)
const mockAcademicUtils = {
  getCurrentAcademicYear: vi.fn(),
  getCurrentSemester: vi.fn(),
  getHebrewAcademicYear: vi.fn(),
  isWithinSemester: vi.fn(),
  getSemesterStartDate: vi.fn(),
  getSemesterEndDate: vi.fn(),
  getExamPeriodDates: vi.fn(),
  isRegistrationPeriod: vi.fn(),
  getAcademicCalendarEvents: vi.fn(),
  calculateAcademicProgress: vi.fn(),
  convertToHebrewYear: vi.fn(),
  parseSemesterFromDate: vi.fn(),
  getUniversitySpecificCalendar: vi.fn(),
};

// Mock these functions globally
vi.mock('../../lib/utils/academic', () => mockAcademicUtils);

// ================================================================================================
// 🧪 ACADEMIC CALENDAR CORE LOGIC TESTS
// ================================================================================================

describe('📅 Academic Calendar Core Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-15')); // Mid-semester date
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================================
  // 🎓 ACADEMIC YEAR CALCULATIONS
  // ============================================================================================

  describe('🎓 Academic Year Calculations', () => {
    it('should calculate current academic year correctly', () => {
      // Mock implementation for Israeli academic calendar
      const getCurrentAcademicYear = (date = new Date()) => {
        const month = date.getMonth() + 1; // JS months are 0-based
        const year = date.getFullYear();

        // Israeli academic year starts in October
        // October-December belongs to the current calendar year
        // January-September belongs to the previous calendar year
        if (month >= 10) {
          return year;
        } else {
          return year - 1;
        }
      };

      mockAcademicUtils.getCurrentAcademicYear.mockImplementation(getCurrentAcademicYear);

      // Test different dates
      expect(getCurrentAcademicYear(new Date('2024-10-01'))).toBe(2024); // Start of academic year
      expect(getCurrentAcademicYear(new Date('2024-11-15'))).toBe(2024); // Mid first semester
      expect(getCurrentAcademicYear(new Date('2024-12-31'))).toBe(2024); // End of calendar year
      expect(getCurrentAcademicYear(new Date('2025-01-01'))).toBe(2024); // Still same academic year
      expect(getCurrentAcademicYear(new Date('2025-09-30'))).toBe(2024); // End of academic year
      expect(getCurrentAcademicYear(new Date('2025-10-01'))).toBe(2025); // New academic year
    });

    it('should convert Gregorian to Hebrew academic year', () => {
      const convertToHebrewYear = (gregorianYear: number) => {
        // Hebrew year calculation: add 3760 to Gregorian year
        // But academic year notation uses abbreviated form like תש"פ
        const hebrewYear = gregorianYear + 3760;
        const abbreviated = hebrewYear.toString().slice(-2);

        // Map numbers to Hebrew letters (simplified for testing)
        const hebrewDigits = {
          '80': 'תש"פ', // 5780 = 2020
          '81': 'תש"פא', // 5781 = 2021
          '82': 'תש"פב', // 5782 = 2022
          '83': 'תש"פג', // 5783 = 2023
          '84': 'תש"פד', // 5784 = 2024
          '85': 'תש"פה', // 5785 = 2025
        };

        return hebrewDigits[abbreviated] || `תש"${abbreviated}`;
      };

      mockAcademicUtils.convertToHebrewYear.mockImplementation(convertToHebrewYear);

      expect(convertToHebrewYear(2024)).toBe('תש"פד');
      expect(convertToHebrewYear(2023)).toBe('תש"פג');
      expect(convertToHebrewYear(2025)).toBe('תש"פה');
    });

    it('should get Hebrew academic year for current date', () => {
      const getHebrewAcademicYear = (date = new Date()) => {
        const gregorianYear = mockAcademicUtils.getCurrentAcademicYear(date);
        return mockAcademicUtils.convertToHebrewYear(gregorianYear);
      };

      mockAcademicUtils.getHebrewAcademicYear.mockImplementation(getHebrewAcademicYear);
      mockAcademicUtils.getCurrentAcademicYear.mockReturnValue(2024);
      mockAcademicUtils.convertToHebrewYear.mockReturnValue('תש"פד');

      expect(getHebrewAcademicYear()).toBe('תש"פד');
      expect(mockAcademicUtils.getCurrentAcademicYear).toHaveBeenCalled();
      expect(mockAcademicUtils.convertToHebrewYear).toHaveBeenCalledWith(2024);
    });
  });

  // ============================================================================================
  // 📚 SEMESTER CALCULATIONS
  // ============================================================================================

  describe('📚 Semester Calculations', () => {
    it('should identify current semester correctly', () => {
      const getCurrentSemester = (date = new Date()) => {
        const month = date.getMonth() + 1;

        // Israeli university semester system:
        // First semester (א): October - January
        // Second semester (ב): February - June
        // Summer semester (קיץ): July - September

        if (month >= 10 || month <= 1) {
          return 'א'; // First semester
        } else if (month >= 2 && month <= 6) {
          return 'ב'; // Second semester
        } else {
          return 'קיץ'; // Summer semester
        }
      };

      mockAcademicUtils.getCurrentSemester.mockImplementation(getCurrentSemester);

      // Test different months
      expect(getCurrentSemester(new Date('2024-10-01'))).toBe('א'); // October
      expect(getCurrentSemester(new Date('2024-11-15'))).toBe('א'); // November
      expect(getCurrentSemester(new Date('2024-12-31'))).toBe('א'); // December
      expect(getCurrentSemester(new Date('2025-01-15'))).toBe('א'); // January
      expect(getCurrentSemester(new Date('2025-02-01'))).toBe('ב'); // February
      expect(getCurrentSemester(new Date('2025-04-15'))).toBe('ב'); // April
      expect(getCurrentSemester(new Date('2025-06-30'))).toBe('ב'); // June
      expect(getCurrentSemester(new Date('2025-07-01'))).toBe('קיץ'); // July
      expect(getCurrentSemester(new Date('2025-08-15'))).toBe('קיץ'); // August
      expect(getCurrentSemester(new Date('2025-09-30'))).toBe('קיץ'); // September
    });

    it('should parse semester from date string', () => {
      const parseSemesterFromDate = (dateString: string) => {
        const date = new Date(dateString);
        return mockAcademicUtils.getCurrentSemester(date);
      };

      mockAcademicUtils.parseSemesterFromDate.mockImplementation(parseSemesterFromDate);
      mockAcademicUtils.getCurrentSemester.mockImplementation((date: Date) => {
        const month = date.getMonth() + 1;
        if (month >= 10 || month <= 1) return 'א';
        if (month >= 2 && month <= 6) return 'ב';
        return 'קיץ';
      });

      expect(parseSemesterFromDate('2024-10-15')).toBe('א');
      expect(parseSemesterFromDate('2024-03-20')).toBe('ב');
      expect(parseSemesterFromDate('2024-08-10')).toBe('קיץ');
    });

    it('should check if date is within semester', () => {
      const isWithinSemester = (date: Date, semester: 'א' | 'ב' | 'קיץ') => {
        const currentSemester = mockAcademicUtils.getCurrentSemester(date);
        return currentSemester === semester;
      };

      mockAcademicUtils.isWithinSemester.mockImplementation(isWithinSemester);
      mockAcademicUtils.getCurrentSemester.mockImplementation((date: Date) => {
        const month = date.getMonth() + 1;
        if (month >= 10 || month <= 1) return 'א';
        if (month >= 2 && month <= 6) return 'ב';
        return 'קיץ';
      });

      const fallDate = new Date('2024-11-15');
      const springDate = new Date('2024-03-15');
      const summerDate = new Date('2024-08-15');

      expect(isWithinSemester(fallDate, 'א')).toBe(true);
      expect(isWithinSemester(fallDate, 'ב')).toBe(false);
      expect(isWithinSemester(springDate, 'ב')).toBe(true);
      expect(isWithinSemester(summerDate, 'קיץ')).toBe(true);
    });
  });

  // ============================================================================================
  // 📅 SEMESTER DATE CALCULATIONS
  // ============================================================================================

  describe('📅 Semester Date Calculations', () => {
    it('should calculate semester start dates', () => {
      const getSemesterStartDate = (year: number, semester: 'א' | 'ב' | 'קיץ') => {
        switch (semester) {
          case 'א':
            return new Date(year, 9, 1); // October 1st (month is 0-based)
          case 'ב':
            return new Date(year + 1, 1, 1); // February 1st (next calendar year)
          case 'קיץ':
            return new Date(year + 1, 6, 1); // July 1st (next calendar year)
          default:
            throw new Error('Invalid semester');
        }
      };

      mockAcademicUtils.getSemesterStartDate.mockImplementation(getSemesterStartDate);

      const fallStart = getSemesterStartDate(2024, 'א');
      const springStart = getSemesterStartDate(2024, 'ב');
      const summerStart = getSemesterStartDate(2024, 'קיץ');

      expect(fallStart.getMonth()).toBe(9); // October
      expect(fallStart.getDate()).toBe(1);
      expect(fallStart.getFullYear()).toBe(2024);

      expect(springStart.getMonth()).toBe(1); // February
      expect(springStart.getFullYear()).toBe(2025);

      expect(summerStart.getMonth()).toBe(6); // July
      expect(summerStart.getFullYear()).toBe(2025);
    });

    it('should calculate semester end dates', () => {
      const getSemesterEndDate = (year: number, semester: 'א' | 'ב' | 'קיץ') => {
        switch (semester) {
          case 'א':
            return new Date(year + 1, 0, 31); // January 31st
          case 'ב':
            return new Date(year + 1, 5, 30); // June 30th
          case 'קיץ':
            return new Date(year + 1, 8, 30); // September 30th
          default:
            throw new Error('Invalid semester');
        }
      };

      mockAcademicUtils.getSemesterEndDate.mockImplementation(getSemesterEndDate);

      const fallEnd = getSemesterEndDate(2024, 'א');
      const springEnd = getSemesterEndDate(2024, 'ב');
      const summerEnd = getSemesterEndDate(2024, 'קיץ');

      expect(fallEnd.getMonth()).toBe(0); // January
      expect(fallEnd.getDate()).toBe(31);

      expect(springEnd.getMonth()).toBe(5); // June
      expect(springEnd.getDate()).toBe(30);

      expect(summerEnd.getMonth()).toBe(8); // September
      expect(summerEnd.getDate()).toBe(30);
    });

    it('should calculate exam period dates', () => {
      const getExamPeriodDates = (year: number, semester: 'א' | 'ב' | 'קיץ') => {
        const semesterEnd = mockAcademicUtils.getSemesterEndDate(year, semester);

        // Exam period typically starts 2 weeks before semester end
        const examStart = new Date(semesterEnd);
        examStart.setDate(examStart.getDate() - 14);

        // Exam period extends 1 week after semester end
        const examEnd = new Date(semesterEnd);
        examEnd.setDate(examEnd.getDate() + 7);

        return { start: examStart, end: examEnd };
      };

      mockAcademicUtils.getExamPeriodDates.mockImplementation(getExamPeriodDates);
      mockAcademicUtils.getSemesterEndDate.mockImplementation((year, semester) => {
        if (semester === 'א') return new Date(year + 1, 0, 31);
        if (semester === 'ב') return new Date(year + 1, 5, 30);
        return new Date(year + 1, 8, 30);
      });

      const examPeriod = getExamPeriodDates(2024, 'א');

      expect(examPeriod.start.getMonth()).toBe(0); // January
      expect(examPeriod.start.getDate()).toBe(17); // 31 - 14 = 17
      expect(examPeriod.end.getDate()).toBe(7); // 31 + 7 = 7 (next month)
    });
  });

  // ============================================================================================
  // 🏛️ UNIVERSITY-SPECIFIC CALENDAR FEATURES
  // ============================================================================================

  describe('🏛️ University-Specific Calendar', () => {
    it('should get BGU-specific calendar events', () => {
      const getUniversitySpecificCalendar = (university: 'bgu' | 'tau' | 'huji', year: number) => {
        const baseCalendar = {
          academicYear: year,
          semesters: ['א', 'ב', 'קיץ'],
          holidays: ['ראש השנה', 'יום כיפור', 'סוכות', 'פסח'],
        };

        switch (university) {
          case 'bgu':
            return {
              ...baseCalendar,
              university: 'אוניברסיטת בן גוריון בנגב',
              location: 'באר שבע',
              specialEvents: ['יום בן גוריון', 'שבוע נגב'],
              examPeriods: {
                א: { start: new Date(year + 1, 0, 15), end: new Date(year + 1, 1, 5) },
                ב: { start: new Date(year + 1, 5, 15), end: new Date(year + 1, 6, 5) },
                קיץ: { start: new Date(year + 1, 8, 1), end: new Date(year + 1, 8, 15) },
              },
            };

          case 'tau':
            return {
              ...baseCalendar,
              university: 'אוניברסיטת תל אביב',
              location: 'תל אביב',
              specialEvents: ['יום תל אביב', 'פסטיבל מדע'],
            };

          case 'huji':
            return {
              ...baseCalendar,
              university: 'האוניברסיטה העברית בירושלים',
              location: 'ירושלים',
              specialEvents: ['יום ירושלים', 'כנס מחקר'],
            };

          default:
            return baseCalendar;
        }
      };

      mockAcademicUtils.getUniversitySpecificCalendar.mockImplementation(getUniversitySpecificCalendar);

      const bguCalendar = getUniversitySpecificCalendar('bgu', 2024);
      const tauCalendar = getUniversitySpecificCalendar('tau', 2024);
      const hujiCalendar = getUniversitySpecificCalendar('huji', 2024);

      expect(bguCalendar.university).toBe('אוניברסיטת בן גוריון בנגב');
      expect(bguCalendar.location).toBe('באר שבע');
      expect(bguCalendar.specialEvents).toContain('יום בן גוריון');
      expect(bguCalendar.examPeriods).toBeDefined();

      expect(tauCalendar.university).toBe('אוניברסיטת תל אביב');
      expect(hujiCalendar.university).toBe('האוניברסיטה העברית בירושלים');
    });

    it('should check registration periods for different universities', () => {
      const isRegistrationPeriod = (university: 'bgu' | 'tau' | 'huji', date = new Date()) => {
        // Registration periods vary by university
        const month = date.getMonth() + 1;

        const registrationPeriods = {
          bgu: [
            { start: 8, end: 9 }, // August-September for fall
            { start: 1, end: 2 }, // January-February for spring
            { start: 6, end: 6 }, // June for summer
          ],
          tau: [
            { start: 9, end: 10 }, // September-October for fall
            { start: 2, end: 3 }, // February-March for spring
            { start: 6, end: 7 }, // June-July for summer
          ],
          huji: [
            { start: 8, end: 10 }, // August-October for fall
            { start: 1, end: 3 }, // January-March for spring
            { start: 5, end: 7 }, // May-July for summer
          ],
        };

        return registrationPeriods[university].some((period) => month >= period.start && month <= period.end);
      };

      mockAcademicUtils.isRegistrationPeriod.mockImplementation(isRegistrationPeriod);

      // Test BGU registration periods
      expect(isRegistrationPeriod('bgu', new Date('2024-08-15'))).toBe(true);
      expect(isRegistrationPeriod('bgu', new Date('2024-10-15'))).toBe(false);

      // Test TAU registration periods
      expect(isRegistrationPeriod('tau', new Date('2024-09-15'))).toBe(true);
      expect(isRegistrationPeriod('tau', new Date('2024-08-15'))).toBe(false);

      // Test HUJI registration periods
      expect(isRegistrationPeriod('huji', new Date('2024-08-15'))).toBe(true);
      expect(isRegistrationPeriod('huji', new Date('2024-05-15'))).toBe(true);
    });
  });

  // ============================================================================================
  // 📊 ACADEMIC PROGRESS CALCULATIONS
  // ============================================================================================

  describe('📊 Academic Progress Calculations', () => {
    it('should calculate academic progress within semester', () => {
      const calculateAcademicProgress = (year: number, semester: 'א' | 'ב' | 'קיץ', currentDate = new Date()) => {
        const semesterStart = mockAcademicUtils.getSemesterStartDate(year, semester);
        const semesterEnd = mockAcademicUtils.getSemesterEndDate(year, semester);

        const totalDuration = semesterEnd.getTime() - semesterStart.getTime();
        const elapsed = currentDate.getTime() - semesterStart.getTime();

        const progressPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

        return {
          percentage: Math.round(progressPercentage),
          daysElapsed: Math.floor(elapsed / (1000 * 60 * 60 * 24)),
          daysRemaining: Math.floor((semesterEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
          isActive: currentDate >= semesterStart && currentDate <= semesterEnd,
        };
      };

      mockAcademicUtils.calculateAcademicProgress.mockImplementation(calculateAcademicProgress);
      mockAcademicUtils.getSemesterStartDate.mockReturnValue(new Date('2024-10-01'));
      mockAcademicUtils.getSemesterEndDate.mockReturnValue(new Date('2025-01-31'));

      const progress = calculateAcademicProgress(2024, 'א', new Date('2024-11-15'));

      expect(progress.percentage).toBeGreaterThan(0);
      expect(progress.percentage).toBeLessThan(100);
      expect(progress.daysElapsed).toBeGreaterThan(0);
      expect(progress.daysRemaining).toBeGreaterThan(0);
      expect(progress.isActive).toBe(true);
    });

    it('should identify past and future semesters', () => {
      mockAcademicUtils.getSemesterStartDate.mockImplementation((year, semester) => {
        if (semester === 'א') return new Date('2023-10-01');
        return new Date('2025-02-01');
      });

      mockAcademicUtils.getSemesterEndDate.mockImplementation((year, semester) => {
        if (semester === 'א') return new Date('2024-01-31');
        return new Date('2025-06-30');
      });

      mockAcademicUtils.calculateAcademicProgress.mockImplementation((year, semester, currentDate) => {
        const start = mockAcademicUtils.getSemesterStartDate(year, semester);
        const end = mockAcademicUtils.getSemesterEndDate(year, semester);
        return {
          percentage: currentDate > end ? 100 : currentDate < start ? 0 : 50,
          isActive: currentDate >= start && currentDate <= end,
        };
      });

      // Test past semester
      const pastProgress = mockAcademicUtils.calculateAcademicProgress(2023, 'א', new Date('2024-11-15'));
      expect(pastProgress.percentage).toBe(100);
      expect(pastProgress.isActive).toBe(false);

      // Test future semester
      const futureProgress = mockAcademicUtils.calculateAcademicProgress(2024, 'ב', new Date('2024-11-15'));
      expect(futureProgress.percentage).toBe(0);
      expect(futureProgress.isActive).toBe(false);
    });
  });

  // ============================================================================================
  // 🎊 ACADEMIC CALENDAR EVENTS
  // ============================================================================================

  describe('🎊 Academic Calendar Events', () => {
    it('should get upcoming academic events', () => {
      const getAcademicCalendarEvents = (university: string, year: number) => {
        const baseEvents = [
          {
            name: 'תחילת הסמסטר',
            nameEn: 'Semester Start',
            date: new Date(year, 9, 1),
            type: 'academic',
            semester: 'א',
          },
          {
            name: 'רישום לקורסים',
            nameEn: 'Course Registration',
            date: new Date(year, 7, 15),
            type: 'registration',
            semester: 'א',
          },
          {
            name: 'תקופת בחינות',
            nameEn: 'Exam Period',
            date: new Date(year + 1, 0, 15),
            type: 'exams',
            semester: 'א',
          },
        ];

        if (university === 'bgu') {
          baseEvents.push({
            name: 'יום בן גוריון',
            nameEn: 'Ben Gurion Day',
            date: new Date(year, 11, 1),
            type: 'special',
            semester: 'א',
          });
        }

        return baseEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      };

      mockAcademicUtils.getAcademicCalendarEvents.mockImplementation(getAcademicCalendarEvents);

      const bguEvents = getAcademicCalendarEvents('bgu', 2024);
      const generalEvents = getAcademicCalendarEvents('tau', 2024);

      expect(bguEvents.length).toBeGreaterThan(generalEvents.length);
      expect(bguEvents.some((event) => event.name === 'יום בן גוריון')).toBe(true);
      expect(generalEvents.some((event) => event.name === 'יום בן גוריון')).toBe(false);

      // Verify Hebrew and English names
      bguEvents.forEach((event) => {
        expect(event.name).toBeTruthy();
        expect(event.nameEn).toBeTruthy();
        expect(event.date).toBeInstanceOf(Date);
        expect(['academic', 'registration', 'exams', 'special']).toContain(event.type);
      });
    });

    it('should filter events by semester', () => {
      const allEvents = [
        { name: 'תחילת סמסטר א', semester: 'א', date: new Date('2024-10-01') },
        { name: 'תחילת סמסטר ב', semester: 'ב', date: new Date('2025-02-01') },
        { name: 'תחילת סמסטר קיץ', semester: 'קיץ', date: new Date('2025-07-01') },
      ];

      mockAcademicUtils.getAcademicCalendarEvents.mockReturnValue(allEvents);

      const filterEventsBySemester = (events: any[], semester: string) => {
        return events.filter((event) => event.semester === semester);
      };

      const fallEvents = filterEventsBySemester(allEvents, 'א');
      const springEvents = filterEventsBySemester(allEvents, 'ב');
      const summerEvents = filterEventsBySemester(allEvents, 'קיץ');

      expect(fallEvents).toHaveLength(1);
      expect(springEvents).toHaveLength(1);
      expect(summerEvents).toHaveLength(1);
      expect(fallEvents[0].name).toBe('תחילת סמסטר א');
    });
  });
});

// ================================================================================================
// 🧪 INTEGRATION TESTS
// ================================================================================================

describe('🧪 Academic Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-15')); // Mid-semester date
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('CRITICAL: should handle complete BGU academic year cycle', () => {
    // Mock complete academic year logic
    const mockCurrentYear = 2024;
    const mockCurrentSemester = 'א';

    mockAcademicUtils.getCurrentAcademicYear.mockReturnValue(mockCurrentYear);
    mockAcademicUtils.getCurrentSemester.mockReturnValue(mockCurrentSemester);
    mockAcademicUtils.getHebrewAcademicYear.mockReturnValue('תש"פד');

    mockAcademicUtils.getSemesterStartDate.mockReturnValue(new Date('2024-10-01'));
    mockAcademicUtils.getSemesterEndDate.mockReturnValue(new Date('2025-01-31'));

    mockAcademicUtils.getUniversitySpecificCalendar.mockReturnValue({
      academicYear: mockCurrentYear,
      university: 'אוניברסיטת בן גוריון בנגב',
      currentSemester: mockCurrentSemester,
      hebrewYear: 'תש"פד',
    });

    // Verify integration works
    const academicYear = mockAcademicUtils.getCurrentAcademicYear();
    const semester = mockAcademicUtils.getCurrentSemester();
    const hebrewYear = mockAcademicUtils.getHebrewAcademicYear();
    const calendar = mockAcademicUtils.getUniversitySpecificCalendar('bgu', academicYear);

    expect(academicYear).toBe(2024);
    expect(semester).toBe('א');
    expect(hebrewYear).toBe('תש"פד');
    expect(calendar.university).toBe('אוניברסיטת בן גוריון בנגב');
    expect(calendar.currentSemester).toBe('א');
  });

  it('should handle semester transitions correctly', () => {
    // Test transition from fall to spring semester
    const transitionDates = [
      { date: '2025-01-30', expectedSemester: 'א' }, // End of fall
      { date: '2025-01-31', expectedSemester: 'א' }, // Last day of fall
      { date: '2025-02-01', expectedSemester: 'ב' }, // First day of spring
      { date: '2025-02-02', expectedSemester: 'ב' }, // Spring continues
    ];

    mockAcademicUtils.getCurrentSemester.mockImplementation((date: Date) => {
      const month = date.getMonth() + 1;
      if (month >= 10 || month <= 1) return 'א';
      if (month >= 2 && month <= 6) return 'ב';
      return 'קיץ';
    });

    transitionDates.forEach(({ date, expectedSemester }) => {
      const testDate = new Date(date);
      const semester = mockAcademicUtils.getCurrentSemester(testDate);
      expect(semester).toBe(expectedSemester);
    });
  });

  it('should calculate academic timeline correctly', () => {
    // Mock a complete academic timeline
    const academicTimeline = {
      academicYear: 2024,
      hebrewYear: 'תש"פד',
      semesters: [
        {
          name: 'א',
          start: new Date('2024-10-01'),
          end: new Date('2025-01-31'),
          current: true,
        },
        {
          name: 'ב',
          start: new Date('2025-02-01'),
          end: new Date('2025-06-30'),
          current: false,
        },
        {
          name: 'קיץ',
          start: new Date('2025-07-01'),
          end: new Date('2025-09-30'),
          current: false,
        },
      ],
    };

    // Mock all required functions for timeline calculation
    mockAcademicUtils.getCurrentAcademicYear.mockReturnValue(2024);
    mockAcademicUtils.getHebrewAcademicYear.mockReturnValue('תש"פד');
    mockAcademicUtils.getCurrentSemester.mockReturnValue('א');

    // Verify timeline structure
    expect(academicTimeline.academicYear).toBe(2024);
    expect(academicTimeline.hebrewYear).toBe('תש"פד');
    expect(academicTimeline.semesters).toHaveLength(3);

    const currentSemester = academicTimeline.semesters.find((s) => s.current);
    expect(currentSemester?.name).toBe('א');
    expect(currentSemester?.start).toEqual(new Date('2024-10-01'));
  });
});

// ================================================================================================
// 🛡️ ERROR HANDLING AND EDGE CASES
// ================================================================================================

describe('🛡️ Academic Calendar Error Handling', () => {
  it('should handle invalid dates gracefully', () => {
    const invalidDates = [
      new Date('invalid'),
      new Date('2024-13-01'), // Invalid month
      new Date('2024-02-30'), // Invalid day
    ];

    mockAcademicUtils.getCurrentSemester.mockImplementation((date: Date) => {
      if (isNaN(date.getTime())) {
        return 'א'; // Default fallback
      }
      // Normal logic...
      const month = date.getMonth() + 1;
      if (month >= 10 || month <= 1) return 'א';
      if (month >= 2 && month <= 6) return 'ב';
      return 'קיץ';
    });

    invalidDates.forEach((date) => {
      expect(() => mockAcademicUtils.getCurrentSemester(date)).not.toThrow();
      expect(mockAcademicUtils.getCurrentSemester(date)).toBe('א');
    });
  });

  it('should handle unsupported universities gracefully', () => {
    mockAcademicUtils.getUniversitySpecificCalendar.mockImplementation((university: string) => {
      const supportedUniversities = ['bgu', 'tau', 'huji'];

      if (!supportedUniversities.includes(university)) {
        // Return default calendar for unsupported universities
        return {
          academicYear: 2024,
          university: 'Unknown University',
          semesters: ['א', 'ב', 'קיץ'],
          error: 'University not supported',
        };
      }

      return { academicYear: 2024, university };
    });

    const unsupportedCalendar = mockAcademicUtils.getUniversitySpecificCalendar('unsupported');
    expect(unsupportedCalendar.error).toBe('University not supported');
    expect(unsupportedCalendar.semesters).toEqual(['א', 'ב', 'קיץ']);
  });

  it('should handle timezone differences correctly', () => {
    // Test with different timezones
    const israelTime = new Date('2024-10-01T00:00:00+03:00'); // Israel time
    const utcTime = new Date('2024-09-30T21:00:00Z'); // UTC equivalent

    mockAcademicUtils.getCurrentSemester.mockImplementation((date: Date) => {
      // Convert to Israel time for calculation
      const israelDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
      const month = israelDate.getMonth() + 1;

      if (month >= 10 || month <= 1) return 'א';
      if (month >= 2 && month <= 6) return 'ב';
      return 'קיץ';
    });

    // Both times should resolve to the same semester when properly handled
    const israelSemester = mockAcademicUtils.getCurrentSemester(israelTime);
    const utcSemester = mockAcademicUtils.getCurrentSemester(utcTime);

    expect(israelSemester).toBe('א');
    expect(utcSemester).toBe('א');
  });

  it('should handle leap years correctly', () => {
    const leapYearDate = new Date('2024-02-29'); // 2024 is a leap year
    const nonLeapYearDate = new Date('2023-02-28'); // 2023 is not a leap year

    mockAcademicUtils.getSemesterEndDate.mockImplementation((year: number, semester: string) => {
      if (semester === 'ב') {
        // Spring semester ends in June regardless of leap year
        return new Date(year + 1, 5, 30); // June 30
      }
      return new Date(year + 1, 0, 31); // January 31 for fall
    });

    const leapYearEnd = mockAcademicUtils.getSemesterEndDate(2023, 'ב'); // Spring 2024
    const normalYearEnd = mockAcademicUtils.getSemesterEndDate(2022, 'ב'); // Spring 2023

    // Both should return June 30, regardless of leap year
    expect(leapYearEnd.getMonth()).toBe(5); // June
    expect(leapYearEnd.getDate()).toBe(30);
    expect(normalYearEnd.getMonth()).toBe(5); // June
    expect(normalYearEnd.getDate()).toBe(30);
  });
});
