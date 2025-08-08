export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';

// Re-export types for convenience
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
} from '@prisma/client'; 