import { DatabaseManager } from '../config/database';
import { logger } from '../config/logging';
import {
  DashboardQueryModel,
  CourseQueryModel,
  AssignmentQueryModel,
  StudentProgressQueryModel,
  GradeAnalyticsQueryModel,
  TeacherDashboardQueryModel,
  FacultyAnalyticsQueryModel
} from './query-models';

export class QueryHandlers {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // Dashboard Queries

  async getDashboardSummary(
    userId: string,
    tenantId: string
  ): Promise<DashboardQueryModel | null> {
    try {
      const query = `
        SELECT * FROM academic_${tenantId}.dashboard_summary
        WHERE user_id = $1
      `;

      const result = await this.dbManager.executeQuery(tenantId, query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        userId: row.user_id,
        tenantId: row.tenant_id,
        enrolledCourses: parseInt(row.enrolled_courses) || 0,
        activeCourses: parseInt(row.active_courses) || 0,
        completedAssignments: parseInt(row.completed_assignments) || 0,
        pendingAssignments: parseInt(row.pending_assignments) || 0,
        overdueAssignments: parseInt(row.overdue_assignments) || 0,
        averageGrade: parseFloat(row.average_grade) || 0,
        totalCredits: parseInt(row.total_credits) || 0,
        gpaScore: parseFloat(row.gpa_score) || 0,
        lastSyncAt: row.last_sync_at || new Date(),
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('Failed to get dashboard summary', {
        userId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getTeacherDashboard(
    userId: string,
    tenantId: string
  ): Promise<TeacherDashboardQueryModel | null> {
    try {
      // Get teacher's course overview
      const courseOverviewQuery = `
        SELECT
          COUNT(DISTINCT c.id) as total_courses,
          COUNT(DISTINCT CASE WHEN c.semester = 'fall' AND c.academic_year = EXTRACT(year FROM NOW()) THEN c.id END) as active_courses,
          COUNT(DISTINCT e.user_id) as total_students
        FROM academic_${tenantId}.courses c
        LEFT JOIN academic_${tenantId}.enrollments e ON c.id = e.course_id AND e.status = 'active'
        WHERE c.instructor ILIKE '%' || (SELECT email FROM users WHERE id = $1) || '%'
      `;

      // Get grading workload
      const workloadQuery = `
        SELECT
          COUNT(CASE WHEN g.id IS NULL THEN a.id END) as pending_grading,
          COUNT(CASE WHEN g.id IS NULL AND a.due_date < NOW() THEN a.id END) as overdue_grading,
          COUNT(CASE WHEN g.graded_at > NOW() - INTERVAL '7 days' THEN g.id END) as recent_submissions
        FROM academic_${tenantId}.courses c
        LEFT JOIN academic_${tenantId}.assignments a ON c.id = a.course_id AND a.status = 'published'
        LEFT JOIN academic_${tenantId}.grades g ON a.id = g.assignment_id
        WHERE c.instructor ILIKE '%' || (SELECT email FROM users WHERE id = $1) || '%'
      `;

      // Get course-specific stats
      const courseStatsQuery = `
        SELECT
          c.id,
          c.code,
          c.name,
          COUNT(DISTINCT e.user_id) as student_count,
          ROUND(AVG(g.percentage), 2) as average_grade,
          COUNT(CASE WHEN g.id IS NULL AND a.status = 'published' THEN a.id END) as pending_grading,
          MAX(GREATEST(a.created_at, g.graded_at)) as last_activity
        FROM academic_${tenantId}.courses c
        LEFT JOIN academic_${tenantId}.enrollments e ON c.id = e.course_id AND e.status = 'active'
        LEFT JOIN academic_${tenantId}.assignments a ON c.id = a.course_id
        LEFT JOIN academic_${tenantId}.grades g ON a.id = g.assignment_id
        WHERE c.instructor ILIKE '%' || (SELECT email FROM users WHERE id = $1) || '%'
        GROUP BY c.id, c.code, c.name
        ORDER BY last_activity DESC
      `;

      // Get recent grading activity
      const recentGradesQuery = `
        SELECT
          u.name as student_name,
          c.code as course_code,
          a.title as assignment_title,
          g.percentage as grade,
          g.graded_at
        FROM academic_${tenantId}.grades g
        JOIN academic_${tenantId}.assignments a ON g.assignment_id = a.id
        JOIN academic_${tenantId}.courses c ON a.course_id = c.id
        LEFT JOIN users u ON g.user_id = u.id
        WHERE c.instructor ILIKE '%' || (SELECT email FROM users WHERE id = $1) || '%'
        ORDER BY g.graded_at DESC
        LIMIT 10
      `;

      const [overviewResult, workloadResult, courseStatsResult, recentGradesResult] = await Promise.all([
        this.dbManager.executeQuery(tenantId, courseOverviewQuery, [userId]),
        this.dbManager.executeQuery(tenantId, workloadQuery, [userId]),
        this.dbManager.executeQuery(tenantId, courseStatsQuery, [userId]),
        this.dbManager.executeQuery(tenantId, recentGradesQuery, [userId])
      ]);

      const overview = overviewResult.rows[0] || {};
      const workload = workloadResult.rows[0] || {};

      return {
        userId,
        tenantId,
        totalCourses: parseInt(overview.total_courses) || 0,
        activeCourses: parseInt(overview.active_courses) || 0,
        totalStudents: parseInt(overview.total_students) || 0,
        pendingGrading: parseInt(workload.pending_grading) || 0,
        overdueGrading: parseInt(workload.overdue_grading) || 0,
        recentSubmissions: parseInt(workload.recent_submissions) || 0,
        averageClassPerformance: 0, // Calculate if needed
        strugglingStudents: 0, // Calculate if needed
        topPerformers: 0, // Calculate if needed
        courses: courseStatsResult.rows.map(row => ({
          id: row.id,
          code: row.code,
          name: row.name,
          studentCount: parseInt(row.student_count) || 0,
          averageGrade: parseFloat(row.average_grade) || 0,
          pendingGrading: parseInt(row.pending_grading) || 0,
          lastActivity: row.last_activity || new Date()
        })),
        recentGrades: recentGradesResult.rows.map(row => ({
          studentName: row.student_name || 'Anonymous',
          courseCode: row.course_code,
          assignmentTitle: row.assignment_title,
          grade: parseFloat(row.grade) || 0,
          gradedAt: row.graded_at
        })),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to get teacher dashboard', {
        userId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Course Queries

  async getCourseById(courseId: string, tenantId: string): Promise<CourseQueryModel | null> {
    try {
      const query = `
        SELECT * FROM academic_${tenantId}.course_summary
        WHERE id = $1
      `;

      const result = await this.dbManager.executeQuery(tenantId, query, [courseId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.mapRowToCourse(row);
    } catch (error) {
      logger.error('Failed to get course by id', {
        courseId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getCoursesByUser(
    userId: string,
    tenantId: string,
    options: {
      semester?: string;
      academicYear?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ courses: CourseQueryModel[]; total: number }> {
    try {
      let whereClause = `
        WHERE cs.id IN (
          SELECT DISTINCT e.course_id
          FROM academic_${tenantId}.enrollments e
          WHERE e.user_id = $1 AND e.status = 'active'
        )
      `;
      const values: any[] = [userId];
      let valueIndex = 1;

      if (options.semester) {
        whereClause += ` AND cs.semester = $${++valueIndex}`;
        values.push(options.semester);
      }

      if (options.academicYear) {
        whereClause += ` AND cs.academic_year = $${++valueIndex}`;
        values.push(options.academicYear);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM academic_${tenantId}.course_summary cs
        ${whereClause}
      `;
      const countResult = await this.dbManager.executeQuery(tenantId, countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get courses with pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const coursesQuery = `
        SELECT * FROM academic_${tenantId}.course_summary cs
        ${whereClause}
        ORDER BY cs.semester DESC, cs.code ASC
        LIMIT $${++valueIndex} OFFSET $${++valueIndex}
      `;
      values.push(limit, offset);

      const coursesResult = await this.dbManager.executeQuery(tenantId, coursesQuery, values);
      const courses = coursesResult.rows.map(row => this.mapRowToCourse(row));

      return { courses, total };
    } catch (error) {
      logger.error('Failed to get courses by user', {
        userId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Assignment Queries

  async getAssignmentsByUser(
    userId: string,
    tenantId: string,
    options: {
      status?: string;
      courseId?: string;
      dueBefore?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ assignments: AssignmentQueryModel[]; total: number }> {
    try {
      let whereClause = `
        WHERE a.course_id IN (
          SELECT DISTINCT e.course_id
          FROM academic_${tenantId}.enrollments e
          WHERE e.user_id = $1 AND e.status = 'active'
        )
      `;
      const values: any[] = [userId];
      let valueIndex = 1;

      if (options.status) {
        whereClause += ` AND a.status = $${++valueIndex}`;
        values.push(options.status);
      }

      if (options.courseId) {
        whereClause += ` AND a.course_id = $${++valueIndex}`;
        values.push(options.courseId);
      }

      if (options.dueBefore) {
        whereClause += ` AND a.due_date <= $${++valueIndex}`;
        values.push(options.dueBefore);
      }

      const query = `
        SELECT
          a.id,
          a.course_id,
          c.code as course_code,
          c.name as course_name,
          a.title,
          a.description,
          a.due_date,
          a.status,
          a.weight,
          a.max_grade,
          a.tenant_id,
          a.created_at,
          a.updated_at,
          -- Submission info for this user
          CASE WHEN g.id IS NOT NULL THEN 1 ELSE 0 END as is_submitted,
          g.score,
          g.percentage,
          g.letter_grade,
          g.graded_at
        FROM academic_${tenantId}.assignments a
        JOIN academic_${tenantId}.courses c ON a.course_id = c.id
        LEFT JOIN academic_${tenantId}.grades g ON a.id = g.assignment_id AND g.user_id = $1
        ${whereClause}
        ORDER BY
          CASE WHEN a.due_date IS NULL THEN 1 ELSE 0 END,
          a.due_date ASC,
          a.created_at DESC
        LIMIT $${++valueIndex} OFFSET $${++valueIndex}
      `;

      const limit = options.limit || 50;
      const offset = options.offset || 0;
      values.push(limit, offset);

      const result = await this.dbManager.executeQuery(tenantId, query, values);

      const assignments: AssignmentQueryModel[] = result.rows.map(row => ({
        id: row.id,
        courseId: row.course_id,
        courseCode: row.course_code,
        courseName: row.course_name,
        title: row.title,
        description: row.description,
        dueDate: row.due_date,
        status: row.status,
        weight: parseFloat(row.weight),
        maxGrade: parseInt(row.max_grade),
        totalSubmissions: 0, // Would need separate query
        gradedSubmissions: 0,
        pendingGrading: 0,
        submissionRate: 0,
        gradingProgress: 0,
        tenantId: row.tenant_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return { assignments, total: assignments.length };
    } catch (error) {
      logger.error('Failed to get assignments by user', {
        userId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Student Progress Queries

  async getStudentProgress(
    userId: string,
    tenantId: string,
    courseId?: string
  ): Promise<StudentProgressQueryModel[]> {
    try {
      let query = `
        SELECT * FROM academic_${tenantId}.student_progress
        WHERE user_id = $1
      `;
      const values: any[] = [userId];

      if (courseId) {
        query += ' AND course_id = $2';
        values.push(courseId);
      }

      query += ' ORDER BY course_code';

      const result = await this.dbManager.executeQuery(tenantId, query, values);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        courseId: row.course_id,
        courseCode: row.course_code,
        courseName: row.course_name,
        enrollmentStatus: row.enrollment_status,
        enrolledAt: row.enrolled_at,
        totalAssignments: parseInt(row.total_assignments) || 0,
        submittedAssignments: parseInt(row.submitted_assignments) || 0,
        gradedAssignments: parseInt(row.graded_assignments) || 0,
        pendingAssignments: parseInt(row.pending_assignments) || 0,
        overdueAssignments: parseInt(row.overdue_assignments) || 0,
        currentGrade: parseFloat(row.current_grade) || 0,
        letterGrade: row.letter_grade || 'N/A',
        gpaPoints: this.calculateGpaPoints(row.letter_grade),
        assignments: [], // Would need separate query for detailed assignment breakdown
        gradesTrend: row.grades_trend || 'stable',
        recentPerformance: parseFloat(row.recent_performance) || 0,
        tenantId: row.tenant_id,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('Failed to get student progress', {
        userId,
        tenantId,
        courseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Grade Analytics Queries

  async getGradeAnalytics(
    userId: string,
    tenantId: string,
    options: {
      courseId?: string;
      assignmentId?: string;
      limit?: number;
    } = {}
  ): Promise<GradeAnalyticsQueryModel[]> {
    try {
      let whereClause = 'WHERE g.user_id = $1';
      const values: any[] = [userId];
      let valueIndex = 1;

      if (options.courseId) {
        whereClause += ` AND g.course_id = $${++valueIndex}`;
        values.push(options.courseId);
      }

      if (options.assignmentId) {
        whereClause += ` AND g.assignment_id = $${++valueIndex}`;
        values.push(options.assignmentId);
      }

      const query = `
        SELECT
          g.id,
          g.course_id,
          g.assignment_id,
          g.user_id,
          g.score,
          g.max_score,
          g.percentage,
          g.letter_grade,
          g.graded_at,
          g.tenant_id,
          c.code as course_code,
          c.name as course_name,
          a.title as assignment_title,
          a.due_date,
          a.weight,
          -- Class statistics
          (SELECT AVG(gg.percentage) FROM academic_${tenantId}.grades gg WHERE gg.assignment_id = g.assignment_id) as class_average,
          (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gg.percentage) FROM academic_${tenantId}.grades gg WHERE gg.assignment_id = g.assignment_id) as class_median,
          -- Student rank
          (SELECT COUNT(*) + 1 FROM academic_${tenantId}.grades gg WHERE gg.assignment_id = g.assignment_id AND gg.percentage > g.percentage) as student_rank,
          -- Percentile rank
          ROUND(
            (SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM academic_${tenantId}.grades gg WHERE gg.assignment_id = g.assignment_id)
             FROM academic_${tenantId}.grades gg WHERE gg.assignment_id = g.assignment_id AND gg.percentage < g.percentage),
            2
          ) as percentile_rank
        FROM academic_${tenantId}.grades g
        JOIN academic_${tenantId}.assignments a ON g.assignment_id = a.id
        JOIN academic_${tenantId}.courses c ON g.course_id = c.id
        ${whereClause}
        ORDER BY g.graded_at DESC
        LIMIT $${++valueIndex}
      `;

      values.push(options.limit || 50);

      const result = await this.dbManager.executeQuery(tenantId, query, values);

      return result.rows.map(row => ({
        id: row.id,
        courseId: row.course_id,
        assignmentId: row.assignment_id,
        userId: row.user_id,
        score: parseFloat(row.score),
        maxScore: parseFloat(row.max_score),
        percentage: parseFloat(row.percentage),
        letterGrade: row.letter_grade,
        weight: parseFloat(row.weight),
        gradedAt: row.graded_at,
        courseCode: row.course_code,
        courseName: row.course_name,
        assignmentTitle: row.assignment_title,
        dueDate: row.due_date,
        classAverage: parseFloat(row.class_average) || 0,
        classMedian: parseFloat(row.class_median) || 0,
        studentRank: parseInt(row.student_rank) || 1,
        percentileRank: parseFloat(row.percentile_rank) || 0,
        performanceLevel: this.calculatePerformanceLevel(parseFloat(row.percentage)),
        improvementNeeded: parseFloat(row.percentage) < 70,
        tenantId: row.tenant_id
      }));
    } catch (error) {
      logger.error('Failed to get grade analytics', {
        userId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Utility methods

  private mapRowToCourse(row: any): CourseQueryModel {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      nameHe: row.name_he,
      faculty: row.faculty,
      academicYear: parseInt(row.academic_year),
      semester: row.semester,
      credits: parseInt(row.credits),
      instructor: row.instructor,
      description: row.description,
      descriptionHe: row.description_he,
      totalStudents: parseInt(row.total_students) || 0,
      activeStudents: parseInt(row.active_students) || 0,
      totalAssignments: parseInt(row.total_assignments) || 0,
      publishedAssignments: parseInt(row.published_assignments) || 0,
      completedAssignments: parseInt(row.completed_assignments) || 0,
      averageGrade: parseFloat(row.average_grade) || 0,
      medianGrade: parseFloat(row.median_grade) || 0,
      gradeDistribution: [], // Would need separate calculation
      lastAssignmentCreated: row.last_assignment_created,
      lastGradeEntered: row.last_grade_entered,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private calculateGpaPoints(letterGrade: string): number {
    switch (letterGrade?.toUpperCase()) {
      case 'A': return 4.0;
      case 'B': return 3.0;
      case 'C': return 2.0;
      case 'D': return 1.0;
      default: return 0.0;
    }
  }

  private calculatePerformanceLevel(percentage: number): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 70) return 'average';
    if (percentage >= 60) return 'below_average';
    return 'poor';
  }
}