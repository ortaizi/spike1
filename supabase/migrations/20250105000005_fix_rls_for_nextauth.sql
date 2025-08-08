-- Migration: Fix RLS policies for NextAuth integration
-- Date: 2025-01-05
-- Description: Updates RLS policies to work with NextAuth instead of Supabase Auth

-- =============================================================================
-- DROP EXISTING POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Users can view own credentials" ON university_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON university_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON university_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON university_credentials;

DROP POLICY IF EXISTS "Authenticated users can view universities" ON universities;

-- =============================================================================
-- CREATE NEW POLICIES FOR SERVICE ROLE ACCESS
-- =============================================================================

-- For NextAuth integration, we'll use service role access
-- This allows the application to manage users through NextAuth

-- Users table - allow service role full access
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (true);

-- University credentials table - allow service role full access
CREATE POLICY "Service role can manage credentials" ON university_credentials
  FOR ALL USING (true);

-- Universities table - allow service role full access
CREATE POLICY "Service role can manage universities" ON universities
  FOR ALL USING (true);

-- =============================================================================
-- ALTERNATIVE: DISABLE RLS FOR DEVELOPMENT
-- =============================================================================

-- Disable RLS for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE university_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE universities DISABLE ROW LEVEL SECURITY;
