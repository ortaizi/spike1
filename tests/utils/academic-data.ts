/**
 * 🎓 ACADEMIC TEST DATA FACTORIES - Spike Academic Platform
 *
 * Realistic Hebrew academic test data generators for
 * Israeli university testing scenarios
 */

import { faker } from '@faker-js/faker/locale/he';
import type { User } from 'next-auth';

// Configure faker for Hebrew locale
faker.locale = 'he';

// ================================================================================================
// 🎓 ACADEMIC TYPES
// ================================================================================================

export interface TestUniversity {
  id: string;
  name: string;
  nameHebrew: string;
  code: 'bgu' | 'tau' | 'huji' | 'technion' | 'weizmann';
  domain: string;
  location: string;
  established: number;
}

export interface TestFaculty {
  id: string;
  name: string;
  nameHebrew: string;
  code: string;
  universityId: string;
}

export interface TestCourse {
  id: string;
  name: string;
  nameHebrew: string;
  code: string;
  credits: number;
  facultyId: string;
  semester: 'א' | 'ב' | 'קיץ';
  year: number;
  description?: string;
  descriptionHebrew?: string;
  prerequisites?: string[];
  instructorHebrew?: string;
  schedule?: {
    day: string;
    dayHebrew: string;
    time: string;
    building: string;
    room: string;
  }[];
}

export interface TestStudent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameHebrew: string;
  lastNameHebrew: string;
  studentId: string;
  universityId: string;
  facultyId: string;
  year: number;
  degree: 'bachelor' | 'master' | 'phd';
  degreeHebrew: string;
  gpa?: number;
  enrollmentDate: Date;
}

export interface TestGrade {
  id: string;
  studentId: string;
  courseId: string;
  grade: number;
  credits: number;
  semester: 'א' | 'ב' | 'קיץ';
  year: number;
  type: 'final' | 'midterm' | 'assignment' | 'quiz';
  typeHebrew: string;
  date: Date;
}

export interface TestAssignment {
  id: string;
  courseId: string;
  title: string;
  titleHebrew: string;
  description?: string;
  descriptionHebrew?: string;
  dueDate: Date;
  maxGrade: number;
  weight: number;
  type: 'homework' | 'project' | 'exam' | 'presentation';
  typeHebrew: string;
}

// ================================================================================================
// 🏛️ UNIVERSITY DATA FACTORIES
// ================================================================================================

export const createMockUniversity = (overrides: Partial<TestUniversity> = {}): TestUniversity => {
  const universities = [
    {
      id: 'bgu',
      name: 'Ben Gurion University of the Negev',
      nameHebrew: 'אוניברסיטת בן גוריון בנגב',
      code: 'bgu' as const,
      domain: 'bgu.ac.il',
      location: 'Beer Sheva',
      established: 1969,
    },
    {
      id: 'tau',
      name: 'Tel Aviv University',
      nameHebrew: 'אוניברסיטת תל אביב',
      code: 'tau' as const,
      domain: 'tau.ac.il',
      location: 'Tel Aviv',
      established: 1956,
    },
    {
      id: 'huji',
      name: 'Hebrew University of Jerusalem',
      nameHebrew: 'האוניברסיטה העברית בירושלים',
      code: 'huji' as const,
      domain: 'huji.ac.il',
      location: 'Jerusalem',
      established: 1918,
    },
  ];

  const baseUniversity = faker.helpers.arrayElement(universities);

  return {
    ...baseUniversity,
    ...overrides,
  };
};

export const createMockFaculty = (overrides: Partial<TestFaculty> = {}): TestFaculty => {
  const faculties = [
    {
      name: 'Computer Science',
      nameHebrew: 'מדעי המחשב',
      code: 'CS',
    },
    {
      name: 'Mathematics',
      nameHebrew: 'מתמטיקה',
      code: 'MATH',
    },
    {
      name: 'Engineering',
      nameHebrew: 'הנדסה',
      code: 'ENG',
    },
    {
      name: 'Medicine',
      nameHebrew: 'רפואה',
      code: 'MED',
    },
    {
      name: 'Law',
      nameHebrew: 'משפטים',
      code: 'LAW',
    },
    {
      name: 'Business Administration',
      nameHebrew: 'מינהל עסקים',
      code: 'BUS',
    },
    {
      name: 'Psychology',
      nameHebrew: 'פסיכולוגיה',
      code: 'PSY',
    },
    {
      name: 'Physics',
      nameHebrew: 'פיזיקה',
      code: 'PHYS',
    },
  ];

  const baseFaculty = faker.helpers.arrayElement(faculties);

  return {
    id: faker.string.uuid(),
    universityId: 'bgu',
    ...baseFaculty,
    ...overrides,
  };
};

// ================================================================================================
// 📚 COURSE DATA FACTORIES
// ================================================================================================

export const createMockCourse = (overrides: Partial<TestCourse> = {}): TestCourse => {
  const courses = [
    {
      name: 'Introduction to Computer Science',
      nameHebrew: 'מבוא למדעי המחשב',
      code: 'CS-101',
      credits: 4,
      description: 'Basic concepts in computer science and programming',
      descriptionHebrew: 'מושגי יסוד במדעי המחשב ותכנות',
      instructorHebrew: 'פרופ׳ דוד כהן',
    },
    {
      name: 'Linear Algebra',
      nameHebrew: 'אלגברה לינארית',
      code: 'MATH-201',
      credits: 3,
      description: 'Vectors, matrices, and linear transformations',
      descriptionHebrew: 'וקטורים, מטריצות והעתקות לינאריות',
      instructorHebrew: 'ד״ר שרה לוי',
    },
    {
      name: 'Database Systems',
      nameHebrew: 'מערכות מסדי נתונים',
      code: 'CS-301',
      credits: 4,
      description: 'Design and implementation of database systems',
      descriptionHebrew: 'עיצוב ויישום מערכות מסדי נתונים',
      instructorHebrew: 'פרופ׳ אברהם ישראל',
    },
    {
      name: 'Organic Chemistry',
      nameHebrew: 'כימיה אורגנית',
      code: 'CHEM-202',
      credits: 3,
      description: 'Structure and reactions of organic compounds',
      descriptionHebrew: 'מבנה ותגובות של תרכובות אורגניות',
      instructorHebrew: 'ד״ר רחל גולד',
    },
    {
      name: 'Microeconomics',
      nameHebrew: 'מיקרו כלכלה',
      code: 'ECON-101',
      credits: 3,
      description: 'Individual economic decision making',
      descriptionHebrew: 'קבלת החלטות כלכליות פרטיות',
      instructorHebrew: 'פרופ׳ משה אברמוביץ',
    },
  ];

  const baseCourse = faker.helpers.arrayElement(courses);

  return {
    id: faker.string.uuid(),
    facultyId: faker.string.uuid(),
    semester: faker.helpers.arrayElement(['א', 'ב', 'קיץ']),
    year: faker.number.int({ min: 2023, max: 2025 }),
    prerequisites: faker.helpers.maybe(() => [
      faker.helpers.arrayElement(['MATH-101', 'CS-101', 'PHYS-101']),
    ]),
    schedule: [
      {
        day: 'Sunday',
        dayHebrew: 'יום ראשון',
        time: '10:00-12:00',
        building: 'בניין 37',
        room: 'חדר 201',
      },
    ],
    ...baseCourse,
    ...overrides,
  };
};

// ================================================================================================
// 👨‍🎓 STUDENT DATA FACTORIES
// ================================================================================================

export const createMockStudent = (overrides: Partial<TestStudent> = {}): TestStudent => {
  const hebrewFirstNames = [
    'דוד',
    'שרה',
    'משה',
    'רחל',
    'אברהם',
    'לאה',
    'יעקב',
    'רבקה',
    'יוסף',
    'מרים',
    'בנימין',
    'אסתר',
    'יצחק',
    'דינה',
    'שמעון',
  ];

  const hebrewLastNames = [
    'כהן',
    'לוי',
    'ישראל',
    'דוד',
    'מזרחי',
    'אשכנזי',
    'ספרדי',
    'גולד',
    'זילבר',
    'רוזן',
    'שפירא',
    'פרידמן',
    'ברקוביץ',
  ];

  const englishFirstNames = [
    'David',
    'Sarah',
    'Moshe',
    'Rachel',
    'Abraham',
    'Leah',
    'Jacob',
    'Rebecca',
    'Joseph',
    'Miriam',
    'Benjamin',
    'Esther',
    'Isaac',
    'Dinah',
    'Shimon',
  ];

  const englishLastNames = [
    'Cohen',
    'Levy',
    'Israel',
    'David',
    'Mizrahi',
    'Ashkenazi',
    'Sephardi',
    'Gold',
    'Silver',
    'Rosen',
    'Shapira',
    'Friedman',
    'Berkowitz',
  ];

  const firstNameHebrew = faker.helpers.arrayElement(hebrewFirstNames);
  const lastNameHebrew = faker.helpers.arrayElement(hebrewLastNames);
  const firstName = faker.helpers.arrayElement(englishFirstNames);
  const lastName = faker.helpers.arrayElement(englishLastNames);

  const degrees = [
    { english: 'bachelor', hebrew: 'תואר ראשון' },
    { english: 'master', hebrew: 'תואר שני' },
    { english: 'phd', hebrew: 'דוקטורט' },
  ];

  const selectedDegree = faker.helpers.arrayElement(degrees);

  return {
    id: faker.string.uuid(),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@bgu.ac.il`,
    firstName,
    lastName,
    firstNameHebrew,
    lastNameHebrew,
    studentId: faker.number.int({ min: 200000000, max: 299999999 }).toString(),
    universityId: 'bgu',
    facultyId: faker.string.uuid(),
    year: faker.number.int({ min: 1, max: 4 }),
    degree: selectedDegree.english as 'bachelor' | 'master' | 'phd',
    degreeHebrew: selectedDegree.hebrew,
    gpa: faker.number.float({ min: 60, max: 100, fractionDigits: 1 }),
    enrollmentDate: faker.date.past({ years: 4 }),
    ...overrides,
  };
};

// ================================================================================================
// 📊 GRADE DATA FACTORIES
// ================================================================================================

export const createMockGrade = (overrides: Partial<TestGrade> = {}): TestGrade => {
  const gradeTypes = [
    { english: 'final', hebrew: 'בחינה מסכמת' },
    { english: 'midterm', hebrew: 'בחינה אמצע' },
    { english: 'assignment', hebrew: 'מ과제' },
    { english: 'quiz', hebrew: 'בוחן' },
  ];

  const selectedType = faker.helpers.arrayElement(gradeTypes);

  return {
    id: faker.string.uuid(),
    studentId: faker.string.uuid(),
    courseId: faker.string.uuid(),
    grade: faker.number.int({ min: 50, max: 100 }),
    credits: faker.helpers.arrayElement([2, 3, 4, 5]),
    semester: faker.helpers.arrayElement(['א', 'ב', 'קיץ']),
    year: faker.number.int({ min: 2023, max: 2025 }),
    type: selectedType.english as 'final' | 'midterm' | 'assignment' | 'quiz',
    typeHebrew: selectedType.hebrew,
    date: faker.date.recent({ days: 90 }),
    ...overrides,
  };
};

// ================================================================================================
// 📝 ASSIGNMENT DATA FACTORIES
// ================================================================================================

export const createMockAssignment = (overrides: Partial<TestAssignment> = {}): TestAssignment => {
  const assignments = [
    {
      title: 'Programming Assignment 1',
      titleHebrew: 'מטלת תכנות 1',
      description: 'Implement basic data structures',
      descriptionHebrew: 'יישום מבני נתונים בסיסיים',
      type: 'homework',
      typeHebrew: 'מטלת בית',
    },
    {
      title: 'Database Project',
      titleHebrew: 'פרויקט מסד נתונים',
      description: 'Design and implement a database system',
      descriptionHebrew: 'עיצוב ויישום מערכת מסד נתונים',
      type: 'project',
      typeHebrew: 'פרויקט',
    },
    {
      title: 'Midterm Exam',
      titleHebrew: 'בחינת אמצע',
      description: 'Comprehensive exam covering chapters 1-5',
      descriptionHebrew: 'בחינה מקיפה הכוללת פרקים 1-5',
      type: 'exam',
      typeHebrew: 'בחינה',
    },
    {
      title: 'Final Presentation',
      titleHebrew: 'מצגת סיכום',
      description: 'Present your research findings',
      descriptionHebrew: 'הצגת ממצאי המחקר',
      type: 'presentation',
      typeHebrew: 'מצגת',
    },
  ];

  const baseAssignment = faker.helpers.arrayElement(assignments);

  return {
    id: faker.string.uuid(),
    courseId: faker.string.uuid(),
    dueDate: faker.date.future({ days: 30 }),
    maxGrade: faker.helpers.arrayElement([100, 10, 20, 25]),
    weight: faker.number.float({ min: 0.1, max: 0.5, fractionDigits: 1 }),
    ...baseAssignment,
    type: baseAssignment.type as 'homework' | 'project' | 'exam' | 'presentation',
    ...overrides,
  };
};

// ================================================================================================
// 🔐 AUTHENTICATION DATA FACTORIES
// ================================================================================================

export const createMockAuthUser = (overrides: Partial<User> = {}): User => {
  const student = createMockStudent();

  return {
    id: student.id,
    email: student.email,
    name: `${student.firstNameHebrew} ${student.lastNameHebrew}`,
    image: faker.image.avatar(),
    ...overrides,
  };
};

// ================================================================================================
// 🎯 SPECIALIZED DATA GENERATORS
// ================================================================================================

/**
 * Generate a complete academic semester
 */
export const createMockSemester = (
  year: number = 2024,
  semester: 'א' | 'ב' | 'קיץ' = 'א',
  courseCount: number = 5
) => {
  const courses = Array.from({ length: courseCount }, () => createMockCourse({ year, semester }));

  const student = createMockStudent();

  const grades = courses.map((course) =>
    createMockGrade({
      studentId: student.id,
      courseId: course.id,
      semester,
      year,
      credits: course.credits,
    })
  );

  const assignments = courses.flatMap((course) =>
    Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
      createMockAssignment({ courseId: course.id })
    )
  );

  return {
    student,
    courses,
    grades,
    assignments,
    totalCredits: courses.reduce((sum, course) => sum + course.credits, 0),
    gpa: grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length,
  };
};

/**
 * Generate academic transcript data
 */
export const createMockTranscript = (studentId: string, yearCount: number = 3) => {
  const semesters = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < yearCount; i++) {
    const year = currentYear - i;

    // Add fall semester (א)
    semesters.push({
      year,
      semester: 'א' as const,
      courses: Array.from({ length: faker.number.int({ min: 4, max: 6 }) }, () =>
        createMockCourse({ year, semester: 'א' })
      ),
    });

    // Add spring semester (ב)
    semesters.push({
      year,
      semester: 'ב' as const,
      courses: Array.from({ length: faker.number.int({ min: 4, max: 6 }) }, () =>
        createMockCourse({ year, semester: 'ב' })
      ),
    });

    // Maybe add summer semester (קיץ)
    if (faker.helpers.maybe(() => true, { probability: 0.3 })) {
      semesters.push({
        year,
        semester: 'קיץ' as const,
        courses: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
          createMockCourse({ year, semester: 'קיץ' })
        ),
      });
    }
  }

  const allCourses = semesters.flatMap((sem) => sem.courses);
  const allGrades = allCourses.map((course) =>
    createMockGrade({
      studentId,
      courseId: course.id,
      semester: course.semester,
      year: course.year,
      credits: course.credits,
    })
  );

  const totalCredits = allGrades.reduce((sum, grade) => sum + grade.credits, 0);
  const weightedGPA =
    allGrades.reduce((sum, grade) => sum + grade.grade * grade.credits, 0) / totalCredits;

  return {
    studentId,
    semesters,
    grades: allGrades,
    summary: {
      totalCredits,
      gpa: Math.round(weightedGPA * 10) / 10,
      completedCourses: allCourses.length,
      averageGrade: Math.round(weightedGPA),
    },
  };
};

// ================================================================================================
// 📈 BATCH DATA GENERATORS
// ================================================================================================

export const createMockUniversities = (count: number = 3) =>
  Array.from({ length: count }, () => createMockUniversity());

export const createMockStudents = (count: number = 10) =>
  Array.from({ length: count }, () => createMockStudent());

export const createMockCourses = (count: number = 20) =>
  Array.from({ length: count }, () => createMockCourse());

export const createMockGrades = (count: number = 50) =>
  Array.from({ length: count }, () => createMockGrade());

// ================================================================================================
// 🎓 EXPORT ALL FACTORIES
// ================================================================================================

export const AcademicDataFactory = {
  university: createMockUniversity,
  faculty: createMockFaculty,
  course: createMockCourse,
  student: createMockStudent,
  grade: createMockGrade,
  assignment: createMockAssignment,
  authUser: createMockAuthUser,
  semester: createMockSemester,
  transcript: createMockTranscript,
  batch: {
    universities: createMockUniversities,
    students: createMockStudents,
    courses: createMockCourses,
    grades: createMockGrades,
  },
};

export default AcademicDataFactory;
