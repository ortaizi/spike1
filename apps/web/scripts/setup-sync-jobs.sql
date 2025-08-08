-- =============================================================================
-- SPIKE PLATFORM - Sync Jobs Table Setup
-- =============================================================================

-- יצירת טבלת jobs לסנכרון אוטומטי
CREATE TABLE IF NOT EXISTS sync_jobs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'starting',
  progress INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at);

-- טריגר לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- יצירת טריגר אם לא קיים
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_sync_jobs_updated_at'
    ) THEN
        CREATE TRIGGER update_sync_jobs_updated_at 
            BEFORE UPDATE ON sync_jobs 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- הוספת הרשאות (אם נדרש)
-- GRANT ALL PRIVILEGES ON TABLE sync_jobs TO your_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- בדיקה שהטבלה נוצרה בהצלחה
SELECT 
    'sync_jobs table created successfully' as status,
    COUNT(*) as row_count
FROM sync_jobs;

-- הצגת מבנה הטבלה
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sync_jobs'
ORDER BY ordinal_position; 