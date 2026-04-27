-- Add scheduled voting time setting
-- Run this in Supabase SQL Editor

-- Insert the scheduled voting time setting (tomorrow at 6 AM CAT)
-- Format: ISO 8601 timestamp
insert into settings (key, value) 
values ('scheduled_voting_time', '')
on conflict (key) do nothing;

-- Note: The scheduled time will be set from the admin panel UI
-- All times are displayed in Central Africa Time (CAT, UTC+2)
-- Example: '2026-04-28T06:00:00+02:00' for tomorrow at 6 AM CAT
