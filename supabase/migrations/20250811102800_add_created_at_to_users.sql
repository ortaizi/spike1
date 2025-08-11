-- Migration: Add created_at column to users table
-- Date: 2025-08-11T10:28:00
-- Description: Fix Google OAuth AccessDenied error by adding missing created_at column
-- Issue: PGRST204 - "Could not find the 'created_at' column of 'users' in the schema cache"

-- =============================================================================
-- 1. BACKUP SAFETY CHECK
-- =============================================================================

-- Verify users table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Users table does not exist. Migration aborted for safety.';
    END IF;
    
    -- Log current users count for verification
    RAISE NOTICE 'Starting migration: Found % existing users', (SELECT COUNT(*) FROM public.users);
END $$;

-- =============================================================================
-- 2. ADD CREATED_AT COLUMN WITH SAFETY
-- =============================================================================

DO $$ 
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        -- Add column with default value for safety
        ALTER TABLE public.users 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        RAISE NOTICE '✅ Added created_at column to users table with default NOW()';
    ELSE
        RAISE NOTICE '⚠️ created_at column already exists, skipping addition';
    END IF;
END $$;

-- =============================================================================
-- 3. UPDATE EXISTING RECORDS SAFELY  
-- =============================================================================

-- Update existing records to use updated_at as created_at (best approximation)
DO $$
DECLARE
    updated_rows INTEGER;
BEGIN
    -- Only update where created_at is null or default
    UPDATE public.users 
    SET created_at = COALESCE(updated_at, NOW())
    WHERE created_at IS NULL OR created_at = '1970-01-01'::timestamptz;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RAISE NOTICE '✅ Updated % existing user records with created_at timestamps', updated_rows;
END $$;

-- =============================================================================
-- 4. ADD PERFORMANCE INDEX
-- =============================================================================

-- Add index for created_at queries (user analytics, reporting)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
RAISE NOTICE '✅ Added performance index for created_at queries';

-- =============================================================================
-- 5. UPDATE TRIGGER FOR CREATED_AT IMMUTABILITY
-- =============================================================================

-- Ensure created_at cannot be modified after creation (data integrity)
CREATE OR REPLACE FUNCTION protect_created_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent updates to created_at (immutable field)
    IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
        NEW.created_at = OLD.created_at;
        RAISE NOTICE 'protected created_at from modification for user: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to protect created_at
DROP TRIGGER IF EXISTS protect_users_created_at ON public.users;
CREATE TRIGGER protect_users_created_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION protect_created_at();

RAISE NOTICE '✅ Added created_at protection trigger';

-- =============================================================================
-- 6. VERIFY MIGRATION SUCCESS
-- =============================================================================

DO $$
DECLARE
    total_users INTEGER;
    users_with_created_at INTEGER;
    users_without_created_at INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO users_with_created_at FROM public.users WHERE created_at IS NOT NULL;
    SELECT COUNT(*) INTO users_without_created_at FROM public.users WHERE created_at IS NULL;
    
    RAISE NOTICE '📊 Migration Verification:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Users with created_at: %', users_with_created_at;  
    RAISE NOTICE '   Users without created_at: %', users_without_created_at;
    
    IF users_without_created_at > 0 THEN
        RAISE WARNING '⚠️ % users still missing created_at timestamps', users_without_created_at;
    END IF;
    
    -- Verify column exists with correct type
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'created_at' 
        AND data_type = 'timestamp with time zone'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '✅ created_at column verified: TIMESTAMPTZ NOT NULL';
    ELSE
        RAISE EXCEPTION '❌ created_at column verification failed';
    END IF;
END $$;

-- =============================================================================
-- 7. COMPLETION MESSAGE
-- =============================================================================

SELECT '🎉 Migration completed successfully!' as status;
SELECT 'Google OAuth created_at column issue fixed' as fix_applied;
SELECT 'Next step: Run npm run db:generate to update TypeScript types' as next_action;