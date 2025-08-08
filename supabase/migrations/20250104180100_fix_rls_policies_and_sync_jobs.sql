-- Fix RLS Policies and sync_jobs table structure
-- Date: 2025-01-04T18:01:00

-- 1. First, let's check if sync_jobs table exists and fix its structure
DO $$ 
BEGIN
    -- Check if sync_jobs table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_jobs') THEN
        CREATE TABLE sync_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'starting',
            progress INTEGER DEFAULT 0,
            message TEXT,
            data JSONB,
            error_details JSONB,
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'data') THEN
            ALTER TABLE sync_jobs ADD COLUMN data JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'error_details') THEN
            ALTER TABLE sync_jobs ADD COLUMN error_details JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'started_at') THEN
            ALTER TABLE sync_jobs ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'completed_at') THEN
            ALTER TABLE sync_jobs ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;
    END IF;
END $$;

-- 2. Enable RLS on sync_jobs
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for sync_jobs
DROP POLICY IF EXISTS "Users can view their own sync jobs" ON sync_jobs;
CREATE POLICY "Users can view their own sync jobs" ON sync_jobs
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync jobs" ON sync_jobs;
CREATE POLICY "Users can insert their own sync jobs" ON sync_jobs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own sync jobs" ON sync_jobs;
CREATE POLICY "Users can update their own sync jobs" ON sync_jobs
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 4. Fix courses table RLS policies
-- First, ensure courses table has user_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'user_id') THEN
        ALTER TABLE courses ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- Enable RLS on courses if not already enabled
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
CREATE POLICY "Users can view their own courses" ON courses
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own courses" ON courses;
CREATE POLICY "Users can insert their own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
CREATE POLICY "Users can update their own courses" ON courses
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 5. Fix content_analysis table RLS policies
-- First, ensure content_analysis table has user_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'content_analysis' AND column_name = 'user_id') THEN
        ALTER TABLE content_analysis ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- Enable RLS on content_analysis if not already enabled
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_analysis
DROP POLICY IF EXISTS "Users can view their own content analysis" ON content_analysis;
CREATE POLICY "Users can view their own content analysis" ON content_analysis
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own content analysis" ON content_analysis;
CREATE POLICY "Users can insert their own content analysis" ON content_analysis
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own content analysis" ON content_analysis;
CREATE POLICY "Users can update their own content analysis" ON content_analysis
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 6. Create service role bypass policy for development
-- This allows the service role to bypass RLS for development purposes
DROP POLICY IF EXISTS "Service role bypass" ON sync_jobs;
CREATE POLICY "Service role bypass" ON sync_jobs
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass" ON courses;
CREATE POLICY "Service role bypass" ON courses
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass" ON content_analysis;
CREATE POLICY "Service role bypass" ON content_analysis
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_user_id ON content_analysis(user_id); 