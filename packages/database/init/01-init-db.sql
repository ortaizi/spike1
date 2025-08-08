-- Database Initialization Script for Spike Platform
-- Sets up security, performance, and monitoring

-- Create application user with limited privileges
CREATE USER spike_app WITH PASSWORD 'spike_app_password';

-- Grant necessary privileges
GRANT CONNECT ON DATABASE spike_dev TO spike_app;
GRANT USAGE ON SCHEMA public TO spike_app;
GRANT CREATE ON SCHEMA public TO spike_app;

-- Create extensions for performance and functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Set up Row Level Security (RLS) for multi-tenant access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for courses table
CREATE POLICY "Users can view courses they are enrolled in" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_enrollments.course_id = courses.id 
            AND course_enrollments.user_id = auth.uid()
        )
    );

-- Create RLS policies for assignments table
CREATE POLICY "Users can view assignments for their courses" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_enrollments.course_id = assignments.course_id 
            AND course_enrollments.user_id = auth.uid()
        )
    );

-- Create RLS policies for grades table
CREATE POLICY "Users can view their own grades" ON grades
    FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for course_enrollments table
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
    FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for teams table
CREATE POLICY "Users can view teams they are members of" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Create RLS policies for team_members table
CREATE POLICY "Users can view team members for their teams" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.team_id = team_members.team_id 
            AND tm.user_id = auth.uid()
        )
    );

-- Create RLS policies for assignment_submissions table
CREATE POLICY "Users can view their own submissions" ON assignment_submissions
    FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for reminders table
CREATE POLICY "Users can view their own reminders" ON reminders
    FOR SELECT USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_faculty ON courses(faculty);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_academic_year ON courses(academic_year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grades_user_id ON grades(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grades_course_id ON grades(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_course_id ON teams(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reminders_assignment_id ON reminders(assignment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reminders_reminder_date ON reminders(reminder_date);

-- Create full-text search indexes for Hebrew content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_name_fts ON courses USING gin(to_tsvector('hebrew', name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_title_fts ON assignments USING gin(to_tsvector('hebrew', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_description_fts ON assignments USING gin(to_tsvector('hebrew', description));

-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_faculty_year ON courses(faculty, academic_year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_course_due ON assignments(course_id, due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grades_user_course ON grades(user_id, course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_user_status ON course_enrollments(user_id, status);

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO spike_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO spike_app;

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for calculating grade percentage
CREATE OR REPLACE FUNCTION calculate_grade_percentage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.percentage = (NEW.grade / NEW.max_grade) * 100;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic grade percentage calculation
CREATE TRIGGER calculate_grade_percentage_trigger 
    BEFORE INSERT OR UPDATE ON grades 
    FOR EACH ROW EXECUTE FUNCTION calculate_grade_percentage();

-- Create view for user dashboard data
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.student_id,
    u.faculty,
    u.department,
    u.year_of_study,
    COUNT(DISTINCT ce.course_id) as enrolled_courses,
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'PENDING' THEN a.id END) as pending_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'IN_PROGRESS' THEN a.id END) as in_progress_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'SUBMITTED' THEN a.id END) as submitted_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'GRADED' THEN a.id END) as graded_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'OVERDUE' THEN a.id END) as overdue_assignments,
    COUNT(DISTINCT t.id) as total_teams,
    COUNT(DISTINCT r.id) as total_reminders
FROM users u
LEFT JOIN course_enrollments ce ON u.id = ce.user_id AND ce.status = 'ACTIVE'
LEFT JOIN assignments a ON ce.course_id = a.course_id
LEFT JOIN team_members tm ON u.id = tm.user_id
LEFT JOIN teams t ON tm.team_id = t.id
LEFT JOIN reminders r ON u.id = r.user_id
GROUP BY u.id, u.name, u.email, u.student_id, u.faculty, u.department, u.year_of_study;

-- Grant permissions on view
GRANT SELECT ON user_dashboard TO spike_app;

-- Create function for cleaning up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete reminders older than 1 year
    DELETE FROM reminders WHERE reminder_date < CURRENT_DATE - INTERVAL '1 year';
    
    -- Delete assignment submissions older than 2 years
    DELETE FROM assignment_submissions WHERE submitted_at < CURRENT_DATE - INTERVAL '2 years';
    
    -- Log cleanup
    RAISE NOTICE 'Cleanup completed at %', CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Create a scheduled job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

COMMIT; 