-- Add role column to admins table
-- 'super' = full edit access, 'viewer' = read-only dashboard

ALTER TABLE admins ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'viewer';

-- Set super admins
UPDATE admins SET role = 'super' WHERE name ILIKE 'Destiny';
UPDATE admins SET role = 'super' WHERE name ILIKE 'Chinangwa';
UPDATE admins SET role = 'super' WHERE name ILIKE 'Lusekero';

-- Matilda stays as 'viewer' (default)
-- Verify:
-- SELECT name, email, role FROM admins;
