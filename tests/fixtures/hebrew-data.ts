/**
 * 🎓 SPIKE ACADEMIC PLATFORM - HEBREW TEST DATA FIXTURES
 * 
 * Comprehensive Hebrew test data for academic platform testing
 * All data represents realistic Israeli university academic content
 */

// ================================================================================================
// 🎓 ACADEMIC COURSES (Hebrew First)
// ================================================================================================

export const hebrewCourses = {
  computerScience: {
    id: 'cs-intro-001',
    code: '201-1-1234',
    name: 'מבוא למדעי המחשב',
    nameEn: 'Introduction to Computer Science',
    description: 'קורס מבוא הכולל יסודות תכנות, אלגוריתמים ומבני נתונים בסיסיים',
    descriptionEn: 'Introductory course covering programming fundamentals, algorithms and basic data structures',
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מדעי המחשב',
    instructor: 'ד"ר ישראל ישראלי',
    instructorEn: 'Dr. Israel Israeli',
    credits: 4,
    semester: 'א',
    academicYear: 2024,
    isActive: true,
    schedule: {
      lectures: [
        { day: 'ראשון', time: '10:00-12:00', hall: 'אולם 101' },
        { day: 'רביעי', time: '14:00-16:00', hall: 'אולם 205' }
      ],
      practicum: [
        { day: 'שלישי', time: '16:00-18:00', hall: 'מעבדה ג' }
      ]
    }
  },
  mathematics: {
    id: 'math-calculus-001',
    code: '201-1-9101',
    name: 'חשבון דיפרנציאלי ואינטגרלי א',
    nameEn: 'Calculus I',
    description: 'יסודות החשבון הדיפרנציאלי והאינטגרלי לפונקציות של משתנה אחד',
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מתמטיקה',
    instructor: 'פרופ\' שרה לוי',
    credits: 5,
    semester: 'א',
    academicYear: 2024,
    prerequisites: ['מתמטיקה תיכונית ברמה של 5 יחידות'],
    isActive: true
  },
  physics: {
    id: 'physics-mechanics-001',
    code: '201-1-8101',
    name: 'מכניקה קלאסית',
    nameEn: 'Classical Mechanics',
    description: 'עקרונות המכניקה הקלאסית: קינמטיקה, דינמיקה, חוקי שימור',
    faculty: 'הפקולטה למדעי הטבע', 
    department: 'פיזיקה',
    instructor: 'ד"ר אברהם כהן',
    credits: 4,
    semester: 'א',
    academicYear: 2024,
    isActive: true
  }
};

// ================================================================================================
// 📝 ASSIGNMENTS & HOMEWORK (Hebrew)
// ================================================================================================

export const hebrewAssignments = {
  programmingHomework: {
    id: 'hw-prog-001',
    title: 'תרגיל בית 3 - מבני נתונים',
    titleEn: 'Homework 3 - Data Structures',
    description: 'יישום של רשימה מקושרת וחיפוש בינארי בשפת C++',
    courseId: 'cs-intro-001',
    courseName: 'מבוא למדעי המחשב',
    dueDate: new Date('2024-12-15T23:59:00+02:00'),
    submissionDate: null,
    status: 'PENDING',
    priority: 'HIGH',
    points: 20,
    totalPoints: 20,
    grade: null,
    feedback: null,
    files: [
      { name: 'הוראות.pdf', type: 'PDF', size: '245KB' },
      { name: 'קבצי עזר.zip', type: 'ZIP', size: '1.2MB' }
    ],
    isLate: false,
    language: 'he'
  },
  mathExercise: {
    id: 'hw-math-002',
    title: 'תרגיל 4 - אינטגרלים מרובים',
    description: 'פתרון בעיות באינטגרלים מרובים ושטחים',
    courseId: 'math-calculus-001',
    courseName: 'חשבון דיפרנציאלי ואינטגרלי א',
    dueDate: new Date('2024-11-30T23:59:00+02:00'),
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    points: 15,
    grade: 85,
    feedback: 'עבודה טובה, יש לשפר את הסבר השלבים',
    submissionDate: new Date('2024-11-28T18:30:00+02:00'),
    isLate: false,
    language: 'he'
  },
  labReport: {
    id: 'hw-physics-001', 
    title: 'דוח מעבדה - תנועה הרמונית פשוטה',
    description: 'ניתוח נתונים וחישוב תקופת תנודה',
    courseId: 'physics-mechanics-001',
    courseName: 'מכניקה קלאסית',
    dueDate: new Date('2024-12-01T23:59:00+02:00'),
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    points: 10,
    grade: null,
    isLate: false,
    language: 'he'
  }
};

// ================================================================================================
// 🎯 EXAMS & TESTS (Hebrew)
// ================================================================================================

export const hebrewExams = {
  midtermCS: {
    id: 'exam-cs-mid-001',
    title: 'מבחן אמצע - מדעי המחשב',
    type: 'MIDTERM',
    courseId: 'cs-intro-001',
    courseName: 'מבוא למדעי המחשב',
    date: new Date('2024-12-10T09:00:00+02:00'),
    duration: 180, // minutes
    location: 'אולם 1, בניין מדעי הטבע',
    status: 'SCHEDULED',
    grade: null,
    totalPoints: 100,
    passingGrade: 60,
    topics: [
      'מבני נתונים בסיסיים',
      'אלגוריתמי מיון',
      'רקורסיה',
      'ניתוח זמן ריצה'
    ],
    instructions: 'מותר שימוש במחשבון פשוט בלבד',
    language: 'he'
  },
  finalMath: {
    id: 'exam-math-final-001',
    title: 'בחינת גמר - חשבון דיפרנציאלי',
    type: 'FINAL',
    courseId: 'math-calculus-001',
    courseName: 'חשבון דיפרנציאלי ואינטגרלי א',
    date: new Date('2025-01-20T09:00:00+02:00'),
    duration: 180,
    location: 'אולם 5, בניין מתמטיקה',
    status: 'SCHEDULED',
    moedType: 'א', // מועד א׳
    grade: null,
    totalPoints: 100,
    passingGrade: 56,
    language: 'he'
  }
};

// ================================================================================================
// 👨‍🎓 STUDENTS & USERS (Hebrew)
// ================================================================================================

export const hebrewUsers = {
  student1: {
    id: 'student-001',
    email: 'israel.israeli@post.bgu.ac.il',
    name: 'ישראל ישראלי',
    nameEn: 'Israel Israeli',
    studentId: '123456789',
    idNumber: '123456789',
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מדעי המחשב',
    yearOfStudy: 3,
    degree: 'תואר ראשון במדעי המחשב',
    degreeEn: 'B.Sc. Computer Science',
    academicYear: 2024,
    semester: 'א',
    gpa: 85.5,
    totalCredits: 95,
    avatar: null,
    phone: '050-1234567',
    address: {
      city: 'באר שבע',
      street: 'רחב הגורל 15',
      zipCode: '84100'
    },
    preferences: {
      language: 'he',
      theme: 'light',
      notifications: true,
      emailUpdates: true,
      rtlLayout: true
    },
    isActive: true
  },
  student2: {
    id: 'student-002', 
    email: 'sarah.cohen@post.bgu.ac.il',
    name: 'שרה כהן',
    studentId: '987654321',
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מתמטיקה',
    yearOfStudy: 2,
    degree: 'תואר ראשון במתמטיקה',
    academicYear: 2024,
    semester: 'א',
    gpa: 92.3,
    totalCredits: 65,
    preferences: {
      language: 'he',
      theme: 'dark',
      notifications: true,
      rtlLayout: true
    },
    isActive: true
  },
  instructor: {
    id: 'instructor-001',
    email: 'y.israeli@bgu.ac.il',
    name: 'ד"ר ישראל ישראלי',
    role: 'INSTRUCTOR',
    faculty: 'הפקולטה למדעי הטבע',
    department: 'מדעי המחשב',
    title: 'מרצה בכיר',
    office: 'חדר 401, בניין מדעי הטבע',
    officeHours: [
      { day: 'שני', time: '14:00-16:00' },
      { day: 'רביעי', time: '10:00-12:00' }
    ],
    courses: ['cs-intro-001'],
    isActive: true
  }
};

// ================================================================================================
// 📅 ACADEMIC CALENDAR (Hebrew)
// ================================================================================================

export const hebrewCalendar = {
  academicYear2024: {
    year: 2024,
    semesters: {
      fall: {
        name: 'סמסטר א׳',
        nameEn: 'Fall Semester', 
        code: 'א',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-01-31'),
        registrationStart: new Date('2024-08-15'),
        registrationEnd: new Date('2024-09-15'),
        examPeriod: {
          start: new Date('2025-01-05'),
          end: new Date('2025-01-31')
        },
        holidays: [
          {
            name: 'ראש השנה',
            startDate: new Date('2024-10-02'),
            endDate: new Date('2024-10-04')
          },
          {
            name: 'יום כיפור',
            startDate: new Date('2024-10-11'),
            endDate: new Date('2024-10-12')
          },
          {
            name: 'חנוכה',
            startDate: new Date('2024-12-07'),
            endDate: new Date('2024-12-15')
          }
        ]
      },
      spring: {
        name: 'סמסטר ב׳',
        code: 'ב',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-06-30'),
        examPeriod: {
          start: new Date('2025-06-01'),
          end: new Date('2025-06-30')
        }
      },
      summer: {
        name: 'סמסטר קיץ',
        code: 'קיץ',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-08-31')
      }
    }
  }
};

// ================================================================================================
// 🏫 UNIVERSITY DATA (BGU Focus)
// ================================================================================================

export const hebrewUniversityData = {
  bgu: {
    id: 'bgu',
    name: 'אוניברסיטת בן גוריון בנגב',
    nameEn: 'Ben-Gurion University of the Negev',
    shortName: 'BGU',
    city: 'באר שבע',
    established: 1969,
    website: 'https://www.bgu.ac.il',
    moodleUrl: 'https://moodle.bgu.ac.il',
    faculties: [
      {
        id: 'natural-sciences',
        name: 'הפקולטה למדעי הטבע',
        nameEn: 'Faculty of Natural Sciences',
        departments: [
          {
            id: 'computer-science',
            name: 'מדעי המחשב',
            nameEn: 'Computer Science'
          },
          {
            id: 'mathematics',
            name: 'מתמטיקה',
            nameEn: 'Mathematics'
          },
          {
            id: 'physics',
            name: 'פיזיקה',
            nameEn: 'Physics'
          }
        ]
      },
      {
        id: 'engineering',
        name: 'הפקולטה להנדסה',
        nameEn: 'Faculty of Engineering Sciences',
        departments: [
          {
            id: 'software-engineering',
            name: 'הנדסת תוכנה',
            nameEn: 'Software Engineering'
          }
        ]
      }
    ]
  }
};

// ================================================================================================
// 🔤 HEBREW TEXT PATTERNS FOR TESTING
// ================================================================================================

export const hebrewTextPatterns = {
  // Common academic terms
  common: [
    'מבוא למדעי המחשב',
    'תרגיל בית',
    'מבחן אמצע', 
    'בחינת גמר',
    'ציון',
    'נקודות זכות',
    'סמסטר',
    'מועד א׳',
    'מועד ב׳',
    'תואר ראשון',
    'תואר שני',
    'פרויקט גמר'
  ],
  
  // Mixed Hebrew-English (common in CS)
  mixed: [
    'אלגוריתם Quick Sort',
    'מבני נתונים - Data Structures', 
    'תכנות ב-Python',
    'בסיסי נתונים - SQL',
    'פיתוח Web',
    'Machine Learning מתקדם'
  ],
  
  // Dates and times in Hebrew
  dates: [
    'יום ראשון',
    'יום שני', 
    'יום שלישי',
    'יום רביעי',
    'יום חמישי',
    'יום שישי',
    'יום שבת'
  ],
  
  // Academic status terms
  status: [
    'בתהליך',
    'הוגש',
    'מאושר',
    'נדחה',
    'בביקורת',
    'עבר',
    'נכשל',
    'לא השלים'
  ],
  
  // Grade terms
  grades: [
    'מעולה',
    'טוב מאוד',
    'טוב',
    'כשיר',
    'נכשל',
    'לא השלים'
  ]
};

// ================================================================================================
// 🧪 TEST UTILITIES
// ================================================================================================

export const hebrewTestUtils = {
  // Check if text contains Hebrew characters
  hasHebrew: (text: string): boolean => /[\u0590-\u05FF]/.test(text),
  
  // Check if text is primarily Hebrew
  isPrimaryHebrew: (text: string): boolean => {
    const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    return hebrewChars / totalChars > 0.5;
  },
  
  // Generate random Hebrew course name
  randomCourseName: (): string => {
    const subjects = ['מבוא ל', 'יסודות', 'מתקדם ב', 'סמינר ב'];
    const topics = ['מדעי המחשב', 'מתמטיקה', 'פיזיקה', 'הנדסת תוכנה', 'אלגוריתמים'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    return `${subject}${topic}`;
  },
  
  // Format Hebrew date
  formatHebrewDate: (date: Date): string => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(date);
  },
  
  // Mock Hebrew data generator
  generateHebrewMockData: (type: 'course' | 'assignment' | 'user') => {
    switch (type) {
      case 'course':
        return {
          ...hebrewCourses.computerScience,
          id: `course-${Date.now()}`,
          name: hebrewTestUtils.randomCourseName()
        };
      case 'assignment':
        return {
          ...hebrewAssignments.programmingHomework,
          id: `assignment-${Date.now()}`,
          title: `תרגיל ${Math.floor(Math.random() * 10) + 1}`
        };
      case 'user':
        return {
          ...hebrewUsers.student1,
          id: `user-${Date.now()}`,
          name: `סטודנט ${Math.floor(Math.random() * 100) + 1}`
        };
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
};

// Export everything as default for easier importing
export default {
  courses: hebrewCourses,
  assignments: hebrewAssignments,
  exams: hebrewExams,
  users: hebrewUsers,
  calendar: hebrewCalendar,
  university: hebrewUniversityData,
  textPatterns: hebrewTextPatterns,
  utils: hebrewTestUtils
};