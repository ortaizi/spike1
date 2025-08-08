-- הוספת עמודות פרטי התחברות למודל
-- Date: 2025-01-05T00:00:01

-- הוספת עמודות לטבלת users
DO $$ 
BEGIN
    -- הוספת עמודת moodleUsername אם לא קיימת
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'moodleUsername') THEN
        ALTER TABLE users ADD COLUMN moodleUsername TEXT;
    END IF;
    
    -- הוספת עמודת moodlePassword אם לא קיימת
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'moodlePassword') THEN
        ALTER TABLE users ADD COLUMN moodlePassword TEXT;
    END IF;
    
    -- הוספת עמודת moodleLastSync אם לא קיימת
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'moodleLastSync') THEN
        ALTER TABLE users ADD COLUMN moodleLastSync TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- הוספת עמודת moodleUniversity אם לא קיימת
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'moodleUniversity') THEN
        ALTER TABLE users ADD COLUMN moodleUniversity TEXT;
    END IF;
END $$;

-- יצירת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_users_moodle_username ON users(moodleUsername);
CREATE INDEX IF NOT EXISTS idx_users_moodle_university ON users(moodleUniversity);

-- הוספת הערות לעמודות
COMMENT ON COLUMN users.moodleUsername IS 'שם משתמש במערכת Moodle';
COMMENT ON COLUMN users.moodlePassword IS 'סיסמה במערכת Moodle (מוצפנת)';
COMMENT ON COLUMN users.moodleLastSync IS 'תאריך הסנכרון האחרון עם Moodle';
COMMENT ON COLUMN users.moodleUniversity IS 'אוניברסיטה (bgu, technion, huji, tau)';

-- הודעת סיום
SELECT '✅ עמודות פרטי התחברות למודל נוספו בהצלחה!' as message; 