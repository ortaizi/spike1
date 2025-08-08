import { supabase } from '../db'
import type {
  User,
  Course,
  Assignment,
  Grade,
  CourseEnrollment,
  Team,
  TeamMember,
  CreateUserInput,
  UpdateUserInput,
  CreateCourseInput,
  UpdateCourseInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CreateGradeInput,
  UpdateGradeInput,
  CreateEnrollmentInput,
  CreateTeamInput,
  UpdateTeamInput,
  CreateTeamMemberInput,
  UserFilters,
  CourseFilters,
  AssignmentFilters,
  GradeFilters,
  DatabaseResult,
  PaginatedResponse,
} from '../../types/database'

// Generic error handler
function handleDatabaseError(error: unknown): DatabaseResult<never> {
  console.error('Database operation failed:', error)
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    }
  }
  
  return {
    success: false,
    error: 'Unknown database error occurred',
  }
}

// User Operations
export async function createUser(input: CreateUserInput): Promise<DatabaseResult<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as User,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getUserById(id: string): Promise<DatabaseResult<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return {
        success: false,
        error: 'User not found',
      }
    }
    
    return {
      success: true,
      data: data as User,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateUser(input: UpdateUserInput): Promise<DatabaseResult<User>> {
  try {
    const { id, ...data } = input
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: updatedUser as User,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function deleteUser(id: string): Promise<DatabaseResult<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as User,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getUsers(filters?: UserFilters, page = 1, limit = 10): Promise<DatabaseResult<PaginatedResponse<User>>> {
  try {
    let query = supabase.from('users').select('*', { count: 'exact' })
    
    if (filters?.faculty) {
      query = query.eq('faculty', filters.faculty)
    }
    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    if (filters?.yearOfStudy) {
      query = query.eq('yearOfStudy', filters.yearOfStudy)
    }
    
    const { data: users, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('createdAt', { ascending: false })
    
    if (error) throw error
    
    return {
      success: true,
      data: {
        data: users as User[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

// Course Operations
export async function createCourse(input: CreateCourseInput): Promise<DatabaseResult<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Course,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getCourseById(id: string): Promise<DatabaseResult<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return {
        success: false,
        error: 'Course not found',
      }
    }
    
    return {
      success: true,
      data: data as Course,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateCourse(input: UpdateCourseInput): Promise<DatabaseResult<Course>> {
  try {
    const { id, ...data } = input
    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: updatedCourse as Course,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function deleteCourse(id: string): Promise<DatabaseResult<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Course,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getCourses(filters?: CourseFilters, page = 1, limit = 10): Promise<DatabaseResult<PaginatedResponse<Course>>> {
  try {
    let query = supabase.from('courses').select('*', { count: 'exact' })
    
    if (filters?.faculty) {
      query = query.eq('faculty', filters.faculty)
    }
    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    if (filters?.semester) {
      query = query.eq('semester', filters.semester)
    }
    if (filters?.academicYear) {
      query = query.eq('academicYear', filters.academicYear)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('isActive', filters.isActive)
    }
    if (filters?.instructor) {
      query = query.eq('instructor', filters.instructor)
    }
    
    const { data: courses, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('createdAt', { ascending: false })
    
    if (error) throw error
    
    return {
      success: true,
      data: {
        data: courses as Course[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

// Assignment Operations
export async function createAssignment(input: CreateAssignmentInput): Promise<DatabaseResult<Assignment>> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Assignment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getAssignmentById(id: string): Promise<DatabaseResult<Assignment>> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return {
        success: false,
        error: 'Assignment not found',
      }
    }
    
    return {
      success: true,
      data: data as Assignment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateAssignment(input: UpdateAssignmentInput): Promise<DatabaseResult<Assignment>> {
  try {
    const { id, ...data } = input
    const { data: updatedAssignment, error } = await supabase
      .from('assignments')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: updatedAssignment as Assignment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function deleteAssignment(id: string): Promise<DatabaseResult<Assignment>> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Assignment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getAssignments(filters?: AssignmentFilters, page = 1, limit = 10): Promise<DatabaseResult<PaginatedResponse<Assignment>>> {
  try {
    let query = supabase.from('assignments').select('*', { count: 'exact' })
    
    if (filters?.courseId) {
      query = query.eq('courseId', filters.courseId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.dueDateFrom) {
      query = query.gte('dueDate', filters.dueDateFrom)
    }
    if (filters?.dueDateTo) {
      query = query.lte('dueDate', filters.dueDateTo)
    }
    
    const { data: assignments, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('dueDate', { ascending: true })
    
    if (error) throw error
    
    return {
      success: true,
      data: {
        data: assignments as Assignment[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

// Grade Operations
export async function createGrade(input: CreateGradeInput): Promise<DatabaseResult<Grade>> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Grade,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getGradeById(id: string): Promise<DatabaseResult<Grade>> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return {
        success: false,
        error: 'Grade not found',
      }
    }
    
    return {
      success: true,
      data: data as Grade,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateGrade(input: UpdateGradeInput): Promise<DatabaseResult<Grade>> {
  try {
    const { id, ...data } = input
    const { data: updatedGrade, error } = await supabase
      .from('grades')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: updatedGrade as Grade,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function deleteGrade(id: string): Promise<DatabaseResult<Grade>> {
  try {
    const { data, error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Grade,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getGrades(filters?: GradeFilters, page = 1, limit = 10): Promise<DatabaseResult<PaginatedResponse<Grade>>> {
  try {
    let query = supabase.from('grades').select('*', { count: 'exact' })
    
    if (filters?.userId) {
      query = query.eq('userId', filters.userId)
    }
    if (filters?.courseId) {
      query = query.eq('courseId', filters.courseId)
    }
    if (filters?.assignmentId) {
      query = query.eq('assignmentId', filters.assignmentId)
    }
    if (filters?.gradeFrom) {
      query = query.gte('grade', filters.gradeFrom)
    }
    if (filters?.gradeTo) {
      query = query.lte('grade', filters.gradeTo)
    }
    
    const { data: grades, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('gradedAt', { ascending: false })
    
    if (error) throw error
    
    return {
      success: true,
      data: {
        data: grades as Grade[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

// Enrollment Operations
export async function createEnrollment(input: CreateEnrollmentInput): Promise<DatabaseResult<CourseEnrollment>> {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as CourseEnrollment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getEnrollmentById(id: string): Promise<DatabaseResult<CourseEnrollment>> {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return {
        success: false,
        error: 'Enrollment not found',
      }
    }
    
    return {
      success: true,
      data: data as CourseEnrollment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateEnrollment(id: string, status: 'ACTIVE' | 'DROPPED' | 'COMPLETED'): Promise<DatabaseResult<CourseEnrollment>> {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as CourseEnrollment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function deleteEnrollment(id: string): Promise<DatabaseResult<CourseEnrollment>> {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as CourseEnrollment,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

// Team Operations
export async function createTeam(input: CreateTeamInput): Promise<DatabaseResult<Team>> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Team,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function getTeamById(id: string): Promise<DatabaseResult<Team>> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return {
        success: false,
        error: 'Team not found',
      }
    }
    
    return {
      success: true,
      data: data as Team,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateTeam(input: UpdateTeamInput): Promise<DatabaseResult<Team>> {
  try {
    const { id, ...data } = input
    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: updatedTeam as Team,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function deleteTeam(id: string): Promise<DatabaseResult<Team>> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as Team,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

// Team Member Operations
export async function addTeamMember(input: CreateTeamMemberInput): Promise<DatabaseResult<TeamMember>> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as TeamMember,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function removeTeamMember(teamId: string, userId: string): Promise<DatabaseResult<TeamMember>> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .delete()
      .eq('teamId', teamId)
      .eq('userId', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as TeamMember,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: 'LEADER' | 'MEMBER' | 'OBSERVER'): Promise<DatabaseResult<TeamMember>> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .update({
        role,
        updatedAt: new Date().toISOString(),
      })
      .eq('teamId', teamId)
      .eq('userId', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as TeamMember,
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
} 