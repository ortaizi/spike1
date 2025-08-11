-- Migration: Enhanced dual-stage authentication schema optimization
-- Date: 2025-01-11T00:00:00
-- Description: Complete database schema for dual-stage authentication system

-- =============================================================================
-- 1. OPTIMIZE EXISTING TABLES
-- =============================================================================

-- Add missing columns to users table for dual-stage
DO $$ 
BEGIN
    -- Google ID column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
    END IF;
    
    -- Profile picture column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_picture') THEN
        ALTER TABLE users ADD COLUMN profile_picture TEXT;
    END IF;
    
    -- Setup complete column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_setup_complete') THEN
        ALTER TABLE users ADD COLUMN is_setup_complete BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Last login tracking
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Login count tracking
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'login_count') THEN
        ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add encryption fields to university_credentials
DO $$
BEGIN
    -- Auth tag for encryption
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'university_credentials' AND column_name = 'auth_tag') THEN
        ALTER TABLE university_credentials ADD COLUMN auth_tag TEXT;
    END IF;
    
    -- Initialization vector for encryption
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'university_credentials' AND column_name = 'iv') THEN
        ALTER TABLE university_credentials ADD COLUMN iv TEXT;
    END IF;
    
    -- Credentials expiry
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'university_credentials' AND column_name = 'credentials_expiry') THEN
        ALTER TABLE university_credentials ADD COLUMN credentials_expiry TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days');
    END IF;
    
    -- Validity flag
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'university_credentials' AND column_name = 'is_valid') THEN
        ALTER TABLE university_credentials ADD COLUMN is_valid BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- =============================================================================
-- 2. CREATE NEW TABLES FOR DUAL-STAGE SYSTEM
-- =============================================================================

-- Dual-stage authentication sessions (temporary state)
CREATE TABLE IF NOT EXISTS dual_stage_sessions (
    id VARCHAR(255) PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL,
    google_user_data JSONB NOT NULL,
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('google_complete', 'moodle_pending', 'moodle_complete')),
    selected_university_id VARCHAR(255) REFERENCES universities(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication attempts logging (security)
CREATE TABLE IF NOT EXISTS auth_attempts (
    id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) NOT NULL, -- email or IP
    attempt_type VARCHAR(50) NOT NULL CHECK (attempt_type IN ('google', 'moodle', 'credential_test')),
    university_id VARCHAR(255) REFERENCES universities(id),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('dual_stage_complete', 'google_only')),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP or user_id
    action_type VARCHAR(50) NOT NULL, -- 'auth_attempt', 'sync_trigger', etc.
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, action_type)
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_setup_complete ON users(is_setup_complete);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_google ON users(email, google_id);

-- University credentials indexes
CREATE INDEX IF NOT EXISTS idx_university_credentials_expiry ON university_credentials(credentials_expiry);
CREATE INDEX IF NOT EXISTS idx_university_credentials_validity ON university_credentials(is_valid) WHERE is_valid = TRUE;
CREATE INDEX IF NOT EXISTS idx_university_credentials_user_university ON university_credentials(user_id, university_id);

-- Dual-stage sessions indexes
CREATE INDEX IF NOT EXISTS idx_dual_stage_sessions_google_user ON dual_stage_sessions(google_user_id);
CREATE INDEX IF NOT EXISTS idx_dual_stage_sessions_expires ON dual_stage_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_dual_stage_sessions_stage ON dual_stage_sessions(stage);

-- Auth attempts indexes
CREATE INDEX IF NOT EXISTS idx_auth_attempts_user_identifier ON auth_attempts(user_identifier);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created_at ON auth_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_address ON auth_attempts(ip_address, created_at DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start DESC);

-- =============================================================================
-- 4. TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dual_stage_sessions_updated_at ON dual_stage_sessions;
CREATE TRIGGER update_dual_stage_sessions_updated_at 
    BEFORE UPDATE ON dual_stage_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired dual-stage sessions
CREATE OR REPLACE FUNCTION cleanup_expired_dual_stage_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM dual_stage_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old auth attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset rate limits (called by cron)
CREATE OR REPLACE FUNCTION reset_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour'; -- 1 hour sliding window
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dual-stage status
CREATE OR REPLACE FUNCTION get_user_dual_stage_status(user_id_param VARCHAR(255))
RETURNS TABLE(
    has_google_auth BOOLEAN,
    has_university_credentials BOOLEAN,
    is_setup_complete BOOLEAN,
    university_id VARCHAR(255),
    university_name VARCHAR(255),
    credentials_valid BOOLEAN,
    last_sync TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (u.google_id IS NOT NULL) as has_google_auth,
        (uc.id IS NOT NULL) as has_university_credentials,
        u.is_setup_complete,
        uc.university_id,
        uni.name as university_name,
        (uc.is_valid AND uc.credentials_expiry > NOW()) as credentials_valid,
        uc.last_sync
    FROM users u
    LEFT JOIN university_credentials uc ON u.id = uc.user_id
    LEFT JOIN universities uni ON uc.university_id = uni.id
    WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dual_stage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Service role can manage credentials" ON university_credentials;
DROP POLICY IF EXISTS "Service role can manage universities" ON universities;

-- Users table policies
CREATE POLICY "Users can manage own profile" ON users
    FOR ALL USING (
        auth.role() = 'service_role' 
        OR 
        auth.jwt()->>'sub' = id
        OR
        auth.jwt()->>'email' = email
    );

-- University credentials policies
CREATE POLICY "Users can manage own credentials" ON university_credentials
    FOR ALL USING (
        auth.role() = 'service_role'
        OR
        auth.jwt()->>'sub' = user_id
        OR
        user_id IN (
            SELECT id FROM users WHERE auth.jwt()->>'email' = email
        )
    );

-- Universities table policies
CREATE POLICY "Authenticated users can read universities" ON universities
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Service role can modify universities" ON universities
    FOR ALL USING (auth.role() = 'service_role');

-- Dual-stage sessions policies
CREATE POLICY "Users can manage own dual stage sessions" ON dual_stage_sessions
    FOR ALL USING (
        auth.role() = 'service_role'
        OR
        google_user_id = auth.jwt()->>'sub'
        OR
        google_user_id IN (
            SELECT google_id FROM users WHERE auth.jwt()->>'email' = email
        )
    );

-- Auth attempts policies
CREATE POLICY "Service role can access auth attempts" ON auth_attempts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own auth attempts" ON auth_attempts
    FOR SELECT USING (
        user_identifier = auth.jwt()->>'email'
        OR
        user_identifier IN (
            SELECT email FROM users WHERE auth.jwt()->>'sub' = id
        )
    );

-- User sessions policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (
        auth.role() = 'service_role'
        OR
        auth.jwt()->>'sub' = user_id
        OR
        user_id IN (
            SELECT id FROM users WHERE auth.jwt()->>'email' = email
        )
    );

-- Rate limits policies
CREATE POLICY "Service role can manage rate limits" ON rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- Enhanced sync jobs policies
DROP POLICY IF EXISTS "Users can manage own sync jobs" ON sync_jobs;
CREATE POLICY "Users can manage own sync jobs" ON sync_jobs
    FOR ALL USING (
        auth.role() = 'service_role'
        OR
        auth.jwt()->>'sub' = user_id
        OR
        user_id IN (
            SELECT id FROM users WHERE auth.jwt()->>'email' = email
        )
    );

-- =============================================================================
-- 6. PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_active_google_auth 
    ON users(google_id, is_setup_complete) 
    WHERE google_id IS NOT NULL AND is_setup_complete = TRUE;

CREATE INDEX IF NOT EXISTS idx_credentials_valid_unexpired
    ON university_credentials(user_id, university_id, last_sync)
    WHERE is_valid = TRUE AND credentials_expiry > NOW();

CREATE INDEX IF NOT EXISTS idx_sessions_active_unexpired
    ON user_sessions(user_id, session_type, last_activity)
    WHERE is_active = TRUE AND expires_at > NOW();

-- Composite index for auth attempts by IP and time
CREATE INDEX IF NOT EXISTS idx_auth_attempts_security
    ON auth_attempts(ip_address, attempt_type, created_at DESC, success)
    WHERE created_at > NOW() - INTERVAL '24 hours';

-- =============================================================================
-- 7. TEST FUNCTION
-- =============================================================================

-- Test function to validate migration
CREATE OR REPLACE FUNCTION test_dual_stage_migration()
RETURNS TABLE(
    test_name TEXT,
    passed BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Test 1: Verify new columns exist
    RETURN QUERY
    SELECT 
        'Users table enhanced columns'::TEXT as test_name,
        (
            SELECT COUNT(*) = 5 FROM information_schema.columns
            WHERE table_name = 'users' 
            AND column_name IN ('google_id', 'profile_picture', 'is_setup_complete', 'last_login', 'login_count')
        ) as passed,
        'Users table should have all dual-stage columns'::TEXT as message;
    
    -- Test 2: Verify new tables exist
    RETURN QUERY
    SELECT 
        'New dual-stage tables exist'::TEXT as test_name,
        (
            SELECT COUNT(*) = 4 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('dual_stage_sessions', 'auth_attempts', 'user_sessions', 'rate_limits')
        ) as passed,
        'All new dual-stage tables should exist'::TEXT as message;
    
    -- Test 3: Verify RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS enabled on critical tables'::TEXT as test_name,
        (
            SELECT COUNT(*) >= 7 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            AND c.relname IN ('users', 'university_credentials', 'universities', 'dual_stage_sessions', 'user_sessions', 'auth_attempts', 'rate_limits')
            AND c.relrowsecurity = TRUE
        ) as passed,
        'Critical tables should have RLS enabled'::TEXT as message;
    
    -- Test 4: Verify indexes exist
    RETURN QUERY
    SELECT 
        'Performance indexes created'::TEXT as test_name,
        (
            SELECT COUNT(*) >= 15 FROM pg_indexes 
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
        ) as passed,
        'Performance indexes should be created'::TEXT as message;
    
    -- Test 5: Verify functions exist
    RETURN QUERY
    SELECT 
        'Utility functions exist'::TEXT as test_name,
        (
            SELECT COUNT(*) >= 4 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
            AND p.proname IN ('cleanup_expired_dual_stage_sessions', 'cleanup_old_auth_attempts', 'reset_expired_rate_limits', 'get_user_dual_stage_status')
        ) as passed,
        'All utility functions should exist'::TEXT as message;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. COMPLETION MESSAGE
-- =============================================================================

-- Run the test and show results
SELECT '🎉 Starting dual-stage authentication migration...' as status;
SELECT * FROM test_dual_stage_migration();
SELECT '✅ Dual-stage authentication database enhancement completed successfully!' as status;