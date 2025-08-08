-- Fix RLS policies for users table
-- This script adds policies that allow user creation and management

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create new policies that work with our authentication system
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Enable insert for service role" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on id" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Alternative: Disable RLS temporarily for development
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy for development
CREATE POLICY "Enable all access for development" ON users
    FOR ALL USING (true)
    WITH CHECK (true); 