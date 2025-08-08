-- Create users table with all required columns
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  studentId VARCHAR(100),
  faculty VARCHAR(255),
  department VARCHAR(255),
  yearOfStudy INTEGER,
  avatar VARCHAR(500),
  preferences JSONB DEFAULT '{}',
  moodleUsername VARCHAR(255),
  moodlePassword VARCHAR(255),
  moodleLastSync TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sync_jobs table for background processing
CREATE TABLE IF NOT EXISTS sync_jobs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'starting',
  progress INTEGER DEFAULT 0,
  message TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(500) NOT NULL,
  nameEn VARCHAR(500),
  description TEXT,
  credits INTEGER,
  semester VARCHAR(50),
  academicYear INTEGER,
  faculty VARCHAR(255),
  department VARCHAR(255),
  instructor VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  courseId UUID REFERENCES courses(id),
  dueDate TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(50),
  status VARCHAR(50),
  weight DECIMAL(5,2),
  maxGrade DECIMAL(5,2),
  attachments TEXT[],
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES users(id),
  courseId UUID REFERENCES courses(id),
  assignmentId UUID REFERENCES assignments(id),
  grade DECIMAL(5,2),
  maxGrade DECIMAL(5,2),
  percentage DECIMAL(5,2),
  comments TEXT,
  gradedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES users(id),
  courseId UUID REFERENCES courses(id),
  status VARCHAR(50),
  enrolledAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  courseId UUID REFERENCES courses(id),
  description TEXT,
  maxMembers INTEGER,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teamId UUID REFERENCES teams(id),
  userId UUID REFERENCES users(id),
  role VARCHAR(50),
  joinedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_studentId ON users(studentId);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_assignments_courseId ON assignments(courseId);
CREATE INDEX IF NOT EXISTS idx_grades_userId ON grades(userId);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_userId ON course_enrollments(userId);
CREATE INDEX IF NOT EXISTS idx_team_members_teamId ON team_members(teamId);
CREATE INDEX IF NOT EXISTS idx_team_members_userId ON team_members(userId);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view own sync jobs" ON sync_jobs FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own sync jobs" ON sync_jobs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own sync jobs" ON sync_jobs FOR UPDATE USING (auth.uid()::text = user_id);

-- Allow public read access to courses for now (can be restricted later)
CREATE POLICY "Public can view courses" ON courses FOR SELECT USING (true);

-- Allow authenticated users to manage their own data
CREATE POLICY "Users can manage own assignments" ON assignments FOR ALL USING (auth.uid()::text = courseId::text);
CREATE POLICY "Users can manage own grades" ON grades FOR ALL USING (auth.uid()::text = userId::text);
CREATE POLICY "Users can manage own enrollments" ON course_enrollments FOR ALL USING (auth.uid()::text = userId::text);
CREATE POLICY "Users can manage own teams" ON teams FOR ALL USING (auth.uid()::text = courseId::text);
CREATE POLICY "Users can manage own team members" ON team_members FOR ALL USING (auth.uid()::text = userId::text); 