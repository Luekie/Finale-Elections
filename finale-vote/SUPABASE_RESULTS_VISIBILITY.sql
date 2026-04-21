-- Add results_visible setting (hidden by default)
-- Run this in Supabase SQL Editor

INSERT INTO settings (key, value)
VALUES ('results_visible', 'false')
ON CONFLICT (key) DO NOTHING;
