-- Fix missing columns in tables
-- Date: 2025-01-04T18:40:00

-- 1. Fix courses table - add missing columns
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'created_at') THEN
        ALTER TABLE courses ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'user_id') THEN
        ALTER TABLE courses ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- 2. Fix content_analysis table - add missing columns
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'content_analysis' AND column_name = 'updated_at') THEN
        ALTER TABLE content_analysis ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'content_analysis' AND column_name = 'created_at') THEN
        ALTER TABLE content_analysis ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'content_analysis' AND column_name = 'user_id') THEN
        ALTER TABLE content_analysis ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- 3. Fix users table - add missing columns
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_user_id ON content_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Update RLS policies to include user_id
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
CREATE POLICY "Users can view their own courses" ON courses
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own courses" ON courses;
CREATE POLICY "Users can insert their own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
CREATE POLICY "Users can update their own courses" ON courses
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 6. Service role bypass policies
DROP POLICY IF EXISTS "Service role bypass" ON courses;
CREATE POLICY "Service role bypass" ON courses
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass" ON content_analysis;
CREATE POLICY "Service role bypass" ON content_analysis
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass" ON users;
CREATE POLICY "Service role bypass" ON users
    FOR ALL USING (auth.role() = 'service_role'); 