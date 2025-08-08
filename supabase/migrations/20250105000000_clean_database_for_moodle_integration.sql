-- ניקוי הדאטהבייס לקראת אינטגרציה עם Moodle
-- Date: 2025-01-05T00:00:00

-- 1. מחיקת כל הנתונים הקיימים (Mock Data)
-- =========================================

-- מחיקת נתונים מטבלת assignments
DELETE FROM assignments;

-- מחיקת נתונים מטבלת announcements
DELETE FROM announcements;

-- מחיקת נתונים מטבלת course_files
DELETE FROM course_files;

-- מחיקת נתונים מטבלת teaching_staff
DELETE FROM teaching_staff;

-- מחיקת נתונים מטבלת exams
DELETE FROM exams;

-- מחיקת נתונים מטבלת events
DELETE FROM events;

-- מחיקת נתונים מטבלת event_registrations
DELETE FROM event_registrations;

-- מחיקת נתונים מטבלת tuition
DELETE FROM tuition;

-- מחיקת נתונים מטבלת reserves
DELETE FROM reserves;

-- מחיקת נתונים מטבלת emails
DELETE FROM emails;

-- מחיקת נתונים מטבלת notifications
DELETE FROM notifications;

-- מחיקת נתונים מטבלת course_sections
DELETE FROM course_sections;

-- מחיקת נתונים מטבלת course_items
DELETE FROM course_items;

-- מחיקת נתונים מטבלת progress_tracking
DELETE FROM progress_tracking;

-- מחיקת נתונים מטבלת content_analysis
DELETE FROM content_analysis;

-- מחיקת נתונים מטבלת course_enrollments
DELETE FROM course_enrollments;

-- מחיקת נתונים מטבלת courses
DELETE FROM courses;

-- מחיקת נתונים מטבלת sync_jobs
DELETE FROM sync_jobs;

-- 2. איפוס רצפים (sequences)
-- ===========================

-- איפוס רצפים לטבלאות (אם קיימים)
DO $$
BEGIN
    -- בדיקה ואיפוס רצפים אם קיימים
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'assignments_id_seq') THEN
        ALTER SEQUENCE assignments_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'announcements_id_seq') THEN
        ALTER SEQUENCE announcements_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'course_files_id_seq') THEN
        ALTER SEQUENCE course_files_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'teaching_staff_id_seq') THEN
        ALTER SEQUENCE teaching_staff_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'exams_id_seq') THEN
        ALTER SEQUENCE exams_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'events_id_seq') THEN
        ALTER SEQUENCE events_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'event_registrations_id_seq') THEN
        ALTER SEQUENCE event_registrations_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tuition_id_seq') THEN
        ALTER SEQUENCE tuition_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'reserves_id_seq') THEN
        ALTER SEQUENCE reserves_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'emails_id_seq') THEN
        ALTER SEQUENCE emails_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'notifications_id_seq') THEN
        ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'course_sections_id_seq') THEN
        ALTER SEQUENCE course_sections_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'course_items_id_seq') THEN
        ALTER SEQUENCE course_items_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'progress_tracking_id_seq') THEN
        ALTER SEQUENCE progress_tracking_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'content_analysis_id_seq') THEN
        ALTER SEQUENCE content_analysis_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'course_enrollments_id_seq') THEN
        ALTER SEQUENCE course_enrollments_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'courses_id_seq') THEN
        ALTER SEQUENCE courses_id_seq RESTART WITH 1;
    END IF;
END $$;

-- 3. וידוא שהטבלאות ריקות
-- =========================

-- בדיקה שכל הטבלאות ריקות
DO $$
DECLARE
    table_name text;
    row_count integer;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'assignments', 'announcements', 'course_files', 'teaching_staff',
            'exams', 'events', 'event_registrations', 'tuition', 'reserves',
            'emails', 'notifications', 'course_sections', 'course_items',
            'progress_tracking', 'content_analysis', 'course_enrollments',
            'courses', 'sync_jobs'
        )
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(table_name) INTO row_count;
        RAISE NOTICE 'Table %: % rows', table_name, row_count;
        
        IF row_count > 0 THEN
            RAISE EXCEPTION 'Table % still contains % rows', table_name, row_count;
        END IF;
    END LOOP;
END $$;

-- 4. יצירת טבלת ניטור לניקוי
-- ===========================

-- טבלה לניטור תהליך הניקוי
CREATE TABLE IF NOT EXISTS database_cleanup_log (
    id SERIAL PRIMARY KEY,
    cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    table_name TEXT NOT NULL,
    rows_deleted INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת רשומה לניטור
INSERT INTO database_cleanup_log (table_name, rows_deleted, status)
VALUES 
    ('assignments', 0, 'success'),
    ('announcements', 0, 'success'),
    ('course_files', 0, 'success'),
    ('teaching_staff', 0, 'success'),
    ('exams', 0, 'success'),
    ('events', 0, 'success'),
    ('event_registrations', 0, 'success'),
    ('tuition', 0, 'success'),
    ('reserves', 0, 'success'),
    ('emails', 0, 'success'),
    ('notifications', 0, 'success'),
    ('course_sections', 0, 'success'),
    ('course_items', 0, 'success'),
    ('progress_tracking', 0, 'success'),
    ('content_analysis', 0, 'success'),
    ('course_enrollments', 0, 'success'),
    ('courses', 0, 'success'),
    ('sync_jobs', 0, 'success');

-- 5. הודעת סיום
-- ==============

SELECT '🧹 הדאטהבייס נוקה בהצלחה לקראת אינטגרציה עם Moodle!' as message; 