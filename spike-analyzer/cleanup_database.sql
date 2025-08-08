-- Database Cleanup Script for Moodle Integration
-- Keep only essential tables for course scraping and items
-- Date: 2025-08-05

-- =============================================================================
-- ESSENTIAL TABLES TO KEEP
-- =============================================================================
-- 1. users - for user management
-- 2. courses - for course list from Moodle
-- 3. course_items - for course items from Moodle
-- 4. sync_jobs - for tracking sync operations
-- 5. moodle_credentials - for Moodle authentication

-- =============================================================================
-- TABLES TO DROP (not needed for current scraping)
-- =============================================================================

-- Drop tables that are not used by the current scraping scripts
DROP TABLE IF EXISTS analysis_cache CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS content_analysis CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS course_files CASCADE;
DROP TABLE IF EXISTS course_sections CASCADE;
DROP TABLE IF EXISTS database_cleanup_log CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS progress_tracking CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS reserves CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS teaching_staff CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS tuition CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- =============================================================================
-- KEEP ESSENTIAL TABLES
-- =============================================================================

-- 1. users table (keep as is)
-- 2. courses table (keep as is)
-- 3. course_items table (keep as is)
-- 4. sync_jobs table (keep as is)
-- 5. moodle_credentials table (keep as is)

-- =============================================================================
-- VERIFY REMAINING TABLES
-- =============================================================================

-- Check what tables remain
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =============================================================================
-- CLEAN UP EXISTING DATA (keep only test data)
-- =============================================================================

-- Clear existing data from essential tables (keep structure)
DELETE FROM course_items WHERE course_name != 'Test Course';
DELETE FROM courses WHERE name NOT LIKE '%אמידה ומבחני השערות%';
DELETE FROM sync_jobs;
DELETE FROM users WHERE email NOT LIKE '%test%';

-- =============================================================================
-- VERIFY DATA
-- =============================================================================

-- Check remaining data
SELECT 'course_items' as table_name, COUNT(*) as row_count FROM course_items
UNION ALL
SELECT 'courses' as table_name, COUNT(*) as row_count FROM courses
UNION ALL
SELECT 'sync_jobs' as table_name, COUNT(*) as row_count FROM sync_jobs
UNION ALL
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'moodle_credentials' as table_name, COUNT(*) as row_count FROM moodle_credentials;

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT 'Database cleanup completed successfully!' as message;
SELECT 'Remaining tables: users, courses, course_items, sync_jobs, moodle_credentials' as info; 