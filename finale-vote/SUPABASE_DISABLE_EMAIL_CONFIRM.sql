-- Disable email confirmation requirement so users can sign up and log in immediately
-- Run this in Supabase SQL Editor

UPDATE auth.config SET confirm_email_change = false WHERE id = 1;

-- If the above doesn't work, use the Dashboard instead:
-- Authentication → Providers → Email → toggle OFF "Confirm email" → Save
