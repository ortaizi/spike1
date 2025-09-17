export interface Tenant {
  id: string;
  name: string;
  domain: string;
  config: TenantConfig;
  createdAt: Date;
}

export interface TenantConfig {
  moodleUrl: string;
  features: string[];
  locale: string;
  theme: string;
  maxUsers: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  faculty: string;
  academicYear: number;
  semester: string;
  credits: number;
  instructor: string;
  metadata: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: AssignmentStatus;
  weight: number;
  maxGrade: number;
  metadata: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Grade {
  id: string;
  userId: string;
  assignmentId: string;
  courseId: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  feedback: string;
  gradedAt: Date;
  tenantId: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  role: EnrollmentRole;
  status: EnrollmentStatus;
  enrolledAt: Date;
  tenantId: string;
}

export interface Team {
  id: string;
  courseId: string;
  assignmentId: string;
  name: string;
  description: string;
  maxMembers: number;
  status: TeamStatus;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  tenantId: string;
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  GRADED = 'graded',
}

export enum EnrollmentRole {
  STUDENT = 'student',
  TA = 'ta',
  INSTRUCTOR = 'instructor',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DROPPED = 'dropped',
}

export enum TeamStatus {
  FORMING = 'forming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISBANDED = 'disbanded',
}

export enum TeamRole {
  MEMBER = 'member',
  LEADER = 'leader',
}

// Event types for Event Sourcing
export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  eventData: any;
  eventTime: Date;
  tenantId: string;
  correlationId?: string;
  userId?: string;
}

export interface CourseCreatedEvent extends DomainEvent {
  eventType: 'course.created';
  eventData: {
    course: Course;
  };
}

export interface AssignmentCreatedEvent extends DomainEvent {
  eventType: 'assignment.created';
  eventData: {
    assignment: Assignment;
    courseId: string;
  };
}

export interface GradeUpdatedEvent extends DomainEvent {
  eventType: 'grade.updated';
  eventData: {
    grade: Grade;
    previousGrade?: Grade;
  };
}

export interface StudentEnrolledEvent extends DomainEvent {
  eventType: 'student.enrolled';
  eventData: {
    enrollment: Enrollment;
  };
}

// Request/Response types
export interface CreateCourseRequest {
  code: string;
  name: string;
  faculty: string;
  academicYear: number;
  semester: string;
  credits: number;
  instructor: string;
  metadata?: Record<string, any>;
}

export interface UpdateCourseRequest {
  name?: string;
  faculty?: string;
  credits?: number;
  instructor?: string;
  metadata?: Record<string, any>;
}

export interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  weight: number;
  maxGrade: number;
  metadata?: Record<string, any>;
}

export interface SubmitGradeRequest {
  userId: string;
  assignmentId: string;
  score: number;
  feedback?: string;
}

export interface EnrollStudentRequest {
  userId: string;
  courseId: string;
  role?: EnrollmentRole;
}

// Database connection context
export interface DatabaseContext {
  tenantId: string;
  userId?: string;
  correlationId?: string;
}

// Service responses
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
