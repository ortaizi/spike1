import { createClient } from '@supabase/supabase-js'
import { env } from "./env"

// Supabase client configuration
// Always use remote Supabase URLs from environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('🔧 Supabase client configuration:', {
  url: supabaseUrl,
  isLocalDB: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'),
  isRemoteDB: !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    // Try to connect to Supabase without querying a specific table
    const { error } = await supabase.auth.getSession()
    if (error) throw error
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Export types for use in other files
export interface User {
  id: string
  email: string
  name: string
  studentId: string | null
  faculty: string | null
  department: string | null
  yearOfStudy: number | null
  avatar: string | null
  preferences: any
  moodleUsername: string | null
  moodlePassword: string | null
  moodleLastSync?: string | null
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  code: string
  name: string
  nameEn: string | null
  description: string | null
  credits: number
  semester: string
  academicYear: number
  faculty: string
  department: string
  instructor: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  courseId: string
  dueDate: string
  priority: string
  status: string
  weight: number | null
  maxGrade: number | null
  attachments: string[]
  createdAt: string
  updatedAt: string
}

export interface Grade {
  id: string
  userId: string
  courseId: string
  assignmentId: string | null
  grade: number
  maxGrade: number
  percentage: number
  comments: string | null
  gradedAt: string
  createdAt: string
  updatedAt: string
}

export interface CourseEnrollment {
  id: string
  userId: string
  courseId: string
  status: string
  enrolledAt: string
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  courseId: string
  description: string | null
  maxMembers: number
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: string
  joinedAt: string
  createdAt: string
  updatedAt: string
}

export default supabase 