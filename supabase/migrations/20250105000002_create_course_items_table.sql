-- Migration: Create course_items table for Moodle integration
-- Date: 2025-01-05T00:00:02

-- Drop existing table if exists (to ensure clean structure)
DROP TABLE IF EXISTS course_items CASCADE;

-- Create the course_items table with proper structure
CREATE TABLE course_items (
    id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    item_name TEXT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    item_url TEXT,
    moodle_type VARCHAR(50),
    item_id VARCHAR(100),
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_course_items_course_name ON course_items(course_name);
CREATE INDEX idx_course_items_section_name ON course_items(section_name);
CREATE INDEX idx_course_items_item_type ON course_items(item_type);
CREATE INDEX idx_course_items_position ON course_items(position);
CREATE INDEX idx_course_items_moodle_type ON course_items(moodle_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE course_items ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON course_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy to allow read access for all users
CREATE POLICY "Allow read access for all users" ON course_items
    FOR SELECT USING (true);

-- Policy to allow insert/update/delete for service role
CREATE POLICY "Allow service role operations" ON course_items
    FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE course_items IS 'Stores course items extracted from Moodle courses';
COMMENT ON COLUMN course_items.course_name IS 'Name of the course';
COMMENT ON COLUMN course_items.item_name IS 'Name of the course item';
COMMENT ON COLUMN course_items.item_type IS 'Type of item (הורדה/קישור_חיצוני/דף_פנימי)';
COMMENT ON COLUMN course_items.section_name IS 'Name of the section containing the item';
COMMENT ON COLUMN course_items.item_url IS 'URL of the item';
COMMENT ON COLUMN course_items.moodle_type IS 'Moodle type of the item (resource/forum/url/etc)';
COMMENT ON COLUMN course_items.item_id IS 'Unique identifier of the item from Moodle';
COMMENT ON COLUMN course_items.position IS 'Global position of the item on the course page';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_items_updated_at 
    BEFORE UPDATE ON course_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO course_items (course_name, item_name, item_type, section_name, item_url, moodle_type, item_id, position)
-- VALUES 
--     ('Test Course', 'Test Item', 'הורדה', 'Test Section', 'https://example.com', 'resource', 'test-id', 1); 