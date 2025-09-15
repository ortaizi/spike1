// CQRS Query Models - Optimized read models for dashboard and reporting

export interface DashboardQueryModel {
  userId: string;
  tenantId: string;
  enrolledCourses: number;
  activeCourses: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;
  averageGrade: number;
  totalCredits: number;
  gpaScore: number;
  lastSyncAt: Date;
  updatedAt: Date;
}

export interface CourseQueryModel {
  id: string;
  code: string;
  name: string;
  nameHe?: string; // Hebrew name
  faculty: string;
  academicYear: number;
  semester: string;
  credits: number;
  instructor: string;
  description?: string;
  descriptionHe?: string; // Hebrew description

  // Enrollment statistics
  totalStudents: number;
  activeStudents: number;

  // Assignment statistics
  totalAssignments: number;
  publishedAssignments: number;
  completedAssignments: number;

  // Grade statistics
  averageGrade: number;
  medianGrade: number;
  gradeDistribution: {
    range: string; // "90-100", "80-89", etc.
    count: number;
    percentage: number;
  }[];

  // Recent activity
  lastAssignmentCreated?: Date;
  lastGradeEntered?: Date;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentQueryModel {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: string;
  weight: number;
  maxGrade: number;

  // Submission statistics
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;

  // Grade statistics
  averageGrade?: number;
  highestGrade?: number;
  lowestGrade?: number;

  // Progress indicators
  submissionRate: number; // percentage
  gradingProgress: number; // percentage

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgressQueryModel {
  id: string;
  userId: string;
  courseId: string;
  courseCode: string;
  courseName: string;

  // Current status
  enrollmentStatus: string;
  enrolledAt: Date;

  // Assignment progress
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;

  // Grade information
  currentGrade: number; // percentage
  letterGrade: string;
  gpaPoints: number;

  // Detailed grade breakdown
  assignments: {
    id: string;
    title: string;
    dueDate?: Date;
    maxGrade: number;
    weight: number;
    score?: number;
    percentage?: number;
    letterGrade?: string;
    gradedAt?: Date;
    status: 'pending' | 'submitted' | 'graded' | 'overdue';
  }[];

  // Trend analysis
  gradesTrend: 'improving' | 'declining' | 'stable';
  recentPerformance: number; // last 3 assignments average

  tenantId: string;
  updatedAt: Date;
}

export interface GradeAnalyticsQueryModel {
  id: string;
  courseId: string;
  assignmentId: string;
  userId: string;

  // Basic grade info
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  weight: number;
  gradedAt: Date;

  // Contextual information
  courseCode: string;
  courseName: string;
  assignmentTitle: string;
  dueDate?: Date;

  // Statistical context
  classAverage: number;
  classMedian: number;
  studentRank: number; // 1-based rank in class
  percentileRank: number; // 0-100 percentile

  // Performance indicators
  performanceLevel: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  improvementNeeded: boolean;

  tenantId: string;
}

export interface TeacherDashboardQueryModel {
  userId: string;
  tenantId: string;

  // Course overview
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;

  // Assignment workload
  pendingGrading: number;
  overdueGrading: number;
  recentSubmissions: number; // last 7 days

  // Performance insights
  averageClassPerformance: number;
  strugglingStudents: number; // students below threshold
  topPerformers: number; // students above threshold

  // Course-specific stats
  courses: {
    id: string;
    code: string;
    name: string;
    studentCount: number;
    averageGrade: number;
    pendingGrading: number;
    lastActivity: Date;
  }[];

  // Recent activity
  recentGrades: {
    studentName: string;
    courseCode: string;
    assignmentTitle: string;
    grade: number;
    gradedAt: Date;
  }[];

  updatedAt: Date;
}

export interface FacultyAnalyticsQueryModel {
  facultyName: string;
  tenantId: string;
  academicYear: number;
  semester: string;

  // Overall statistics
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;

  // Performance metrics
  averageGPA: number;
  passRate: number; // percentage of students passing
  completionRate: number; // percentage of students completing

  // Course distribution
  coursesByLevel: {
    level: string; // "100", "200", "300", "400"
    count: number;
    averageGrade: number;
  }[];

  // Department comparison
  departmentComparison: {
    department: string;
    averageGrade: number;
    studentCount: number;
    courseCount: number;
  }[];

  // Trend analysis
  performanceTrend: {
    semester: string;
    year: number;
    averageGrade: number;
    studentCount: number;
  }[];

  updatedAt: Date;
}

// Materialized view definitions for PostgreSQL

export const DASHBOARD_QUERY_VIEW = `
CREATE MATERIALIZED VIEW IF NOT EXISTS academic_{tenant_id}.dashboard_summary AS
SELECT
  e.user_id,
  e.tenant_id,
  COUNT(DISTINCT e.course_id) as enrolled_courses,
  COUNT(DISTINCT CASE WHEN c.semester = $1 THEN e.course_id END) as active_courses,
  COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN a.id END) as completed_assignments,
  COUNT(DISTINCT CASE WHEN g.id IS NULL AND a.status = 'published' THEN a.id END) as pending_assignments,
  COUNT(DISTINCT CASE WHEN g.id IS NULL AND a.due_date < NOW() THEN a.id END) as overdue_assignments,
  ROUND(AVG(g.percentage), 2) as average_grade,
  SUM(c.credits) as total_credits,
  ROUND(AVG(
    CASE
      WHEN g.percentage >= 90 THEN 4.0
      WHEN g.percentage >= 80 THEN 3.0
      WHEN g.percentage >= 70 THEN 2.0
      WHEN g.percentage >= 60 THEN 1.0
      ELSE 0.0
    END
  ), 2) as gpa_score,
  MAX(g.graded_at) as last_sync_at,
  NOW() as updated_at
FROM academic_{tenant_id}.enrollments e
JOIN academic_{tenant_id}.courses c ON e.course_id = c.id
LEFT JOIN academic_{tenant_id}.assignments a ON c.id = a.course_id
LEFT JOIN academic_{tenant_id}.grades g ON a.id = g.assignment_id AND e.user_id = g.user_id
WHERE e.status = 'active'
GROUP BY e.user_id, e.tenant_id;
`;

export const COURSE_QUERY_VIEW = `
CREATE MATERIALIZED VIEW IF NOT EXISTS academic_{tenant_id}.course_summary AS
SELECT
  c.id,
  c.code,
  c.name,
  c.faculty,
  c.academic_year,
  c.semester,
  c.credits,
  c.instructor,
  c.description,
  c.tenant_id,
  c.created_at,
  c.updated_at,

  -- Enrollment statistics
  COUNT(DISTINCT e.user_id) as total_students,
  COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.user_id END) as active_students,

  -- Assignment statistics
  COUNT(DISTINCT a.id) as total_assignments,
  COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published_assignments,
  COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN a.id END) as completed_assignments,

  -- Grade statistics
  ROUND(AVG(g.percentage), 2) as average_grade,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY g.percentage) as median_grade,

  -- Recent activity
  MAX(a.created_at) as last_assignment_created,
  MAX(g.graded_at) as last_grade_entered

FROM academic_{tenant_id}.courses c
LEFT JOIN academic_{tenant_id}.enrollments e ON c.id = e.course_id
LEFT JOIN academic_{tenant_id}.assignments a ON c.id = a.course_id
LEFT JOIN academic_{tenant_id}.grades g ON a.id = g.assignment_id
GROUP BY c.id, c.code, c.name, c.faculty, c.academic_year, c.semester,
         c.credits, c.instructor, c.description, c.tenant_id,
         c.created_at, c.updated_at;
`;

export const STUDENT_PROGRESS_VIEW = `
CREATE MATERIALIZED VIEW IF NOT EXISTS academic_{tenant_id}.student_progress AS
SELECT
  CONCAT(e.user_id, '_', c.id) as id,
  e.user_id,
  c.id as course_id,
  c.code as course_code,
  c.name as course_name,
  e.status as enrollment_status,
  e.enrolled_at,
  e.tenant_id,

  -- Assignment counts
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN g.id IS NOT NULL THEN a.id END) as submitted_assignments,
  COUNT(CASE WHEN g.id IS NOT NULL THEN g.id END) as graded_assignments,
  COUNT(CASE WHEN g.id IS NULL AND a.status = 'published' THEN a.id END) as pending_assignments,
  COUNT(CASE WHEN g.id IS NULL AND a.due_date < NOW() THEN a.id END) as overdue_assignments,

  -- Current grade calculation
  ROUND(
    SUM(g.percentage * a.weight) / NULLIF(SUM(CASE WHEN g.id IS NOT NULL THEN a.weight END), 0),
    2
  ) as current_grade,

  -- Letter grade calculation
  CASE
    WHEN ROUND(SUM(g.percentage * a.weight) / NULLIF(SUM(CASE WHEN g.id IS NOT NULL THEN a.weight END), 0), 2) >= 90 THEN 'A'
    WHEN ROUND(SUM(g.percentage * a.weight) / NULLIF(SUM(CASE WHEN g.id IS NOT NULL THEN a.weight END), 0), 2) >= 80 THEN 'B'
    WHEN ROUND(SUM(g.percentage * a.weight) / NULLIF(SUM(CASE WHEN g.id IS NOT NULL THEN a.weight END), 0), 2) >= 70 THEN 'C'
    WHEN ROUND(SUM(g.percentage * a.weight) / NULLIF(SUM(CASE WHEN g.id IS NOT NULL THEN a.weight END), 0), 2) >= 60 THEN 'D'
    ELSE 'F'
  END as letter_grade,

  -- Performance trend (simplified)
  CASE
    WHEN AVG(CASE WHEN g.graded_at > NOW() - INTERVAL '30 days' THEN g.percentage END) >
         AVG(CASE WHEN g.graded_at <= NOW() - INTERVAL '30 days' THEN g.percentage END) THEN 'improving'
    WHEN AVG(CASE WHEN g.graded_at > NOW() - INTERVAL '30 days' THEN g.percentage END) <
         AVG(CASE WHEN g.graded_at <= NOW() - INTERVAL '30 days' THEN g.percentage END) THEN 'declining'
    ELSE 'stable'
  END as grades_trend,

  -- Recent performance (last 3 assignments)
  (
    SELECT AVG(sub_g.percentage)
    FROM academic_{tenant_id}.grades sub_g
    JOIN academic_{tenant_id}.assignments sub_a ON sub_g.assignment_id = sub_a.id
    WHERE sub_g.user_id = e.user_id AND sub_a.course_id = c.id
    ORDER BY sub_g.graded_at DESC
    LIMIT 3
  ) as recent_performance,

  NOW() as updated_at

FROM academic_{tenant_id}.enrollments e
JOIN academic_{tenant_id}.courses c ON e.course_id = c.id
LEFT JOIN academic_{tenant_id}.assignments a ON c.id = a.course_id
LEFT JOIN academic_{tenant_id}.grades g ON a.id = g.assignment_id AND e.user_id = g.user_id
WHERE e.status = 'active'
GROUP BY e.user_id, c.id, c.code, c.name, e.status, e.enrolled_at, e.tenant_id;
`;

// Refresh functions for materialized views
export const REFRESH_QUERIES = {
  dashboard: (tenantId: string) => `REFRESH MATERIALIZED VIEW CONCURRENTLY academic_${tenantId}.dashboard_summary;`,
  courses: (tenantId: string) => `REFRESH MATERIALIZED VIEW CONCURRENTLY academic_${tenantId}.course_summary;`,
  studentProgress: (tenantId: string) => `REFRESH MATERIALIZED VIEW CONCURRENTLY academic_${tenantId}.student_progress;`
};

// Query model update triggers
export const UPDATE_TRIGGERS = `
-- Trigger function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_query_models_{tenant_id}()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh in background (non-blocking)
  PERFORM pg_notify('refresh_views', '{tenant_id}');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic refresh
CREATE TRIGGER refresh_on_grade_change_{tenant_id}
  AFTER INSERT OR UPDATE OR DELETE ON academic_{tenant_id}.grades
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_query_models_{tenant_id}();

CREATE TRIGGER refresh_on_enrollment_change_{tenant_id}
  AFTER INSERT OR UPDATE OR DELETE ON academic_{tenant_id}.enrollments
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_query_models_{tenant_id}();

CREATE TRIGGER refresh_on_assignment_change_{tenant_id}
  AFTER INSERT OR UPDATE OR DELETE ON academic_{tenant_id}.assignments
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_query_models_{tenant_id}();
`;