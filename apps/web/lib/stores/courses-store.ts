import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  faculty: string;
  department: string;
  semester: 'A' | 'B' | 'C';
  year: number;
  credits: number;
  instructor?: string;
  assignments: Assignment[];
  enrollments: CourseEnrollment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  courseId: string;
  course: Course;
  submissions: AssignmentSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'dropped';
  grade?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  status: 'draft' | 'submitted' | 'graded';
  submittedAt?: Date;
  grade?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CoursesState {
  courses: Course[];
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  removeCourse: (id: string) => void;
  
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  removeAssignment: (id: string) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getActiveCourses: () => Course[];
  getUpcomingAssignments: () => Assignment[];
  getCourseById: (id: string) => Course | undefined;
  getAssignmentById: (id: string) => Assignment | undefined;
}

export const useCoursesStore = create<CoursesState>()(
  devtools(
    (set, get) => ({
      courses: [],
      assignments: [],
      isLoading: false,
      error: null,

      setCourses: (courses) => set({ courses, error: null }),
      
      addCourse: (course) => set((state) => ({
        courses: [...state.courses, course]
      })),
      
      updateCourse: (id, updates) => set((state) => ({
        courses: state.courses.map(course =>
          course.id === id ? { ...course, ...updates } : course
        )
      })),
      
      removeCourse: (id) => set((state) => ({
        courses: state.courses.filter(course => course.id !== id)
      })),
      
      setAssignments: (assignments) => set({ assignments, error: null }),
      
      addAssignment: (assignment) => set((state) => ({
        assignments: [...state.assignments, assignment]
      })),
      
      updateAssignment: (id, updates) => set((state) => ({
        assignments: state.assignments.map(assignment =>
          assignment.id === id ? { ...assignment, ...updates } : assignment
        )
      })),
      
      removeAssignment: (id) => set((state) => ({
        assignments: state.assignments.filter(assignment => assignment.id !== id)
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      // Computed
      getActiveCourses: () => {
        const state = get();
        return state.courses.filter(course => 
          course.enrollments.some(enrollment => enrollment.status === 'active')
        );
      },
      
      getUpcomingAssignments: () => {
        const state = get();
        const now = new Date();
        return state.assignments
          .filter(assignment => assignment.dueDate > now)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      },
      
      getCourseById: (id) => {
        const state = get();
        return state.courses.find(course => course.id === id);
      },
      
      getAssignmentById: (id) => {
        const state = get();
        return state.assignments.find(assignment => assignment.id === id);
      },
    }),
    {
      name: 'courses-store',
    }
  )
); 