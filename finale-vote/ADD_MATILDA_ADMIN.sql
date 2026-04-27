-- Add matilda@elections.com as an admin viewer
-- Run this in Supabase SQL Editor

-- Step 1: Add to admins table as viewer
INSERT INTO admins (email, name, role)
VALUES ('matilda@elections.com', 'Matilda Admin', 'viewer')
ON CONFLICT (email) DO UPDATE 
SET name = 'Matilda Admin', role = 'viewer';

-- Step 2: Create the auth user
-- You need to do this via Supabase Dashboard
-- Go to: Authentication > Users > Add User
-- Email: matilda@elections.com
-- Password: Finale2026
-- Auto Confirm User: YES (check this box)

-- Viewer role permissions:
-- ✓ Can view all categories and contestants
-- ✓ Can view analytics and vote logs
-- ✗ Cannot add/edit/delete categories or contestants
-- ✗ Cannot open/close voting
-- ✗ Cannot show/hide results
-- ✗ Cannot reset votes
