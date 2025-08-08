-- Migration: Add NextAuth tables and two-step authentication system
-- Date: 2025-01-05
-- Description: Creates tables for NextAuth integration and university credentials management

-- =============================================================================
-- NEXT AUTH TABLES
-- =============================================================================

-- Users table for NextAuth integration
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  profile_picture TEXT,
  university_id VARCHAR(255),
  is_setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  login_url TEXT NOT NULL,
  sync_method VARCHAR(50) DEFAULT 'moodle',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- University credentials table (encrypted)
CREATE TABLE IF NOT EXISTS university_credentials (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id VARCHAR(255) NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  encrypted_username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id);
CREATE INDEX IF NOT EXISTS idx_users_setup_complete ON users(is_setup_complete);

-- University credentials indexes
CREATE INDEX IF NOT EXISTS idx_university_credentials_user_id ON university_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_university_credentials_university_id ON university_credentials(university_id);
CREATE INDEX IF NOT EXISTS idx_university_credentials_last_sync ON university_credentials(last_sync);

-- Universities table indexes
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for university_credentials table
CREATE TRIGGER update_university_credentials_updated_at 
    BEFORE UPDATE ON university_credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA - UNIVERSITIES
-- =============================================================================

-- Insert default universities
INSERT INTO universities (id, name, login_url, sync_method) VALUES
  ('bgu', 'אוניברסיטת בן-גוריון', 'https://moodle.bgu.ac.il', 'moodle'),
  ('technion', 'הטכניון', 'https://moodle.technion.ac.il', 'moodle'),
  ('huji', 'האוניברסיטה העברית', 'https://moodle.huji.ac.il', 'moodle'),
  ('tau', 'אוניברסיטת תל-אביב', 'https://moodle.tau.ac.il', 'moodle')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- University credentials policies
CREATE POLICY "Users can view own credentials" ON university_credentials
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own credentials" ON university_credentials
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own credentials" ON university_credentials
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own credentials" ON university_credentials
  FOR DELETE USING (auth.uid()::text = user_id);

-- Universities table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view universities" ON universities
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- FUNCTIONS FOR ENCRYPTION/DECRYPTION
-- =============================================================================

-- Function to encrypt text (placeholder - will be implemented in application)
CREATE OR REPLACE FUNCTION encrypt_text(text_to_encrypt TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This is a placeholder. Actual encryption will be done in the application
  -- using crypto libraries for better security
  RETURN text_to_encrypt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt text (placeholder - will be implemented in application)
CREATE OR REPLACE FUNCTION decrypt_text(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This is a placeholder. Actual decryption will be done in the application
  -- using crypto libraries for better security
  RETURN encrypted_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user setup is complete
CREATE OR REPLACE FUNCTION is_user_setup_complete(user_id_param VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
  setup_complete BOOLEAN;
BEGIN
  SELECT is_setup_complete INTO setup_complete
  FROM users
  WHERE id = user_id_param;
  
  RETURN COALESCE(setup_complete, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user university credentials
CREATE OR REPLACE FUNCTION get_user_university_credentials(user_id_param VARCHAR(255))
RETURNS TABLE(
  university_id VARCHAR(255),
  university_name VARCHAR(255),
  encrypted_username TEXT,
  encrypted_password TEXT,
  last_sync TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.university_id,
    u.name as university_name,
    uc.encrypted_username,
    uc.encrypted_password,
    uc.last_sync
  FROM university_credentials uc
  JOIN universities u ON uc.university_id = u.id
  WHERE uc.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 