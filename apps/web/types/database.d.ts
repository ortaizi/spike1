export interface User {
  id: string;
  email: string;
  name: string;
  studentId: string | null;
  faculty: string | null;
  department: string | null;
  yearOfStudy: number | null;
  avatar: string | null;
  preferences: UserPreferences;
  moodleUsername: string | null;
  moodlePassword: string | null;
  moodleLastSync?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface UserPreferences {
  language: 'he' | 'en';
  notifications: boolean;
  theme: 'light' | 'dark';
  onboardingCompleted: boolean;
  universityId: string;
  universityName: string;
  moodleData?: any;
}
export interface Course {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  credits: number;
  semester: string;
  academicYear: number;
  faculty: string;
  department: string;
  instructor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  dueDate: string;
  priority: string;
  status: string;
  weight: number | null;
  maxGrade: number | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}
export interface Grade {
  id: string;
  userId: string;
  courseId: string;
  assignmentId: string | null;
  grade: number;
  maxGrade: number;
  percentage: number;
  comments: string | null;
  gradedAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface Team {
  id: string;
  name: string;
  courseId: string;
  description: string | null;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  instructor: string;
  isNew: boolean;
  priority: 'normal' | 'important' | 'urgent';
  category: 'general' | 'exam' | 'assignment' | 'event';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface CourseFile {
  id: string;
  courseId: string;
  name: string;
  type: 'syllabus' | 'formulas' | 'lectures' | 'assignments' | 'other';
  fileType?: string;
  url?: string;
  lastUpdated: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface TeachingStaff {
  id: string;
  courseId: string;
  name: string;
  title: string;
  email?: string;
  officeHours?: string;
  phone?: string;
  office?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Exam {
  id: string;
  courseId: string;
  title: string;
  type: 'midterm' | 'final' | 'quiz' | 'assignment';
  examDate: string;
  duration?: number;
  location?: string;
  instructions?: string;
  weight?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Event {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  type: 'workshop' | 'conference' | 'seminar' | 'meeting';
  isMandatory: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface Tuition {
  id: string;
  userId: string;
  academicYear: number;
  semester: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentMethod?: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Reserves {
  id: string;
  userId: string;
  unit: string;
  groupNumber?: number;
  daysCompleted: number;
  daysRequired: number;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'exempt';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Email {
  id: string;
  userId: string;
  subject: string;
  sender: string;
  content?: string;
  isRead: boolean;
  isImportant: boolean;
  category: 'general' | 'academic' | 'administrative' | 'financial';
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'general' | 'academic' | 'financial' | 'system';
  isRead: boolean;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CourseItem {
  id: string;
  sectionId: string;
  title: string;
  type: 'video' | 'document' | 'assignment' | 'quiz' | 'link';
  description?: string;
  duration?: string;
  dueDate?: string;
  url?: string;
  fileType?: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}
export interface ProgressTracking {
  id: string;
  userId: string;
  courseId: string;
  itemId?: string;
  itemType: 'assignment' | 'course_item' | 'exam';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progressPercentage: number;
  startedAt?: string;
  completedAt?: string;
  timeSpent: number;
  createdAt: string;
  updatedAt: string;
}
export interface CreateUserInput {
  email: string;
  name: string;
  studentId?: string;
  faculty?: string;
  department?: string;
  yearOfStudy?: number;
  avatar?: string;
  preferences?: UserPreferences;
  moodleUsername?: string;
  moodlePassword?: string;
}
export interface UpdateUserInput {
  id: string;
  email?: string;
  name?: string;
  studentId?: string;
  faculty?: string;
  department?: string;
  yearOfStudy?: number;
  avatar?: string;
  preferences?: UserPreferences;
  moodleUsername?: string;
  moodlePassword?: string;
}
export interface CreateCourseInput {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  credits: number;
  semester: string;
  academicYear: number;
  faculty: string;
  department: string;
  instructor?: string;
  isActive?: boolean;
}
export interface UpdateCourseInput {
  id: string;
  code?: string;
  name?: string;
  nameEn?: string;
  description?: string;
  credits?: number;
  semester?: string;
  academicYear?: number;
  faculty?: string;
  department?: string;
  instructor?: string;
  isActive?: boolean;
}
export interface CreateAssignmentInput {
  title: string;
  description?: string;
  courseId: string;
  dueDate: string;
  priority: string;
  status: string;
  weight?: number;
  maxGrade?: number;
  attachments?: string[];
}
export interface UpdateAssignmentInput {
  id: string;
  title?: string;
  description?: string;
  courseId?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  weight?: number;
  maxGrade?: number;
  attachments?: string[];
}
export interface CreateGradeInput {
  userId: string;
  courseId: string;
  assignmentId?: string;
  grade: number;
  maxGrade: number;
  percentage: number;
  comments?: string;
  gradedAt: string;
}
export interface UpdateGradeInput {
  id: string;
  userId?: string;
  courseId?: string;
  assignmentId?: string;
  grade?: number;
  maxGrade?: number;
  percentage?: number;
  comments?: string;
  gradedAt?: string;
}
export interface CreateEnrollmentInput {
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
}
export interface CreateTeamInput {
  name: string;
  courseId: string;
  description?: string;
  maxMembers: number;
}
export interface UpdateTeamInput {
  id: string;
  name?: string;
  courseId?: string;
  description?: string;
  maxMembers?: number;
}
export interface CreateTeamMemberInput {
  teamId: string;
  userId: string;
  role: string;
  joinedAt: string;
}
export interface CreateAnnouncementInput {
  courseId: string;
  title: string;
  content: string;
  instructor: string;
  priority?: 'normal' | 'important' | 'urgent';
  category?: 'general' | 'exam' | 'assignment' | 'event';
}
export interface CreateCourseFileInput {
  courseId: string;
  name: string;
  type: 'syllabus' | 'formulas' | 'lectures' | 'assignments' | 'other';
  fileType?: string;
  url?: string;
}
export interface CreateTeachingStaffInput {
  courseId: string;
  name: string;
  title: string;
  email?: string;
  officeHours?: string;
  phone?: string;
  office?: string;
}
export interface CreateExamInput {
  courseId: string;
  title: string;
  type: 'midterm' | 'final' | 'quiz' | 'assignment';
  examDate: string;
  duration?: number;
  location?: string;
  instructions?: string;
  weight?: number;
}
export interface CreateEventInput {
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  type: 'workshop' | 'conference' | 'seminar' | 'meeting';
  isMandatory?: boolean;
  maxParticipants?: number;
}
export interface CreateTuitionInput {
  userId: string;
  academicYear: number;
  semester: string;
  amount: number;
  dueDate: string;
}
export interface CreateReservesInput {
  userId: string;
  unit: string;
  groupNumber?: number;
  daysRequired?: number;
  startDate?: string;
  endDate?: string;
}
export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category?: 'general' | 'academic' | 'financial' | 'system';
  actionUrl?: string;
  expiresAt?: string;
}
export interface CreateCourseSectionInput {
  courseId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}
export interface CreateCourseItemInput {
  sectionId: string;
  title: string;
  type: 'video' | 'document' | 'assignment' | 'quiz' | 'link';
  description?: string;
  duration?: string;
  dueDate?: string;
  url?: string;
  fileType?: string;
  orderIndex?: number;
}
export interface CreateProgressTrackingInput {
  userId: string;
  courseId: string;
  itemId?: string;
  itemType: 'assignment' | 'course_item' | 'exam';
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progressPercentage?: number;
  timeSpent?: number;
}
export interface UserFilters {
  faculty?: string;
  department?: string;
  yearOfStudy?: number;
}
export interface CourseFilters {
  faculty?: string;
  department?: string;
  semester?: string;
  academicYear?: number;
  isActive?: boolean;
  instructor?: string;
}
export interface AssignmentFilters {
  courseId?: string;
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}
export interface GradeFilters {
  userId?: string;
  courseId?: string;
  assignmentId?: string;
  gradeFrom?: number;
  gradeTo?: number;
}
export interface AnnouncementFilters {
  courseId?: string;
  priority?: 'normal' | 'important' | 'urgent';
  category?: 'general' | 'exam' | 'assignment' | 'event';
  isNew?: boolean;
}
export interface ExamFilters {
  courseId?: string;
  type?: 'midterm' | 'final' | 'quiz' | 'assignment';
  examDateFrom?: string;
  examDateTo?: string;
}
export interface EventFilters {
  type?: 'workshop' | 'conference' | 'seminar' | 'meeting';
  eventDateFrom?: string;
  eventDateTo?: string;
  isMandatory?: boolean;
}
export interface NotificationFilters {
  userId?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  category?: 'general' | 'academic' | 'financial' | 'system';
  isRead?: boolean;
}
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
//# sourceMappingURL=database.d.ts.map
