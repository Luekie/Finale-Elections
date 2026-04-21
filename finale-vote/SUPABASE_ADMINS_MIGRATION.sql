-- ============================================================
-- Admins table — stores emails of users with admin access
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- Allow the app to read the admins table (to check if a user is admin)
alter table admins enable row level security;

create policy "Allow read for authenticated users"
  on admins for select
  to authenticated
  using (true);

-- ============================================================
-- HOW TO ADD ADMINS
-- ============================================================
-- Step 1: Create the user account in Supabase Auth
--   Go to Authentication → Users → Add user
--   Fill in their email and a password
--   Click "Create user"
--
-- Step 2: Insert their email into the admins table
--   Run the INSERT below with their email:

-- INSERT INTO admins (email, name) VALUES
--   ('innocent@example.com', 'Innocent'),
--   ('destiny@example.com', 'Destiny'),
--   ('matilda@example.com', 'Matilda'),
--   ('lusekero@example.com', 'Lusekero');

-- ============================================================
-- HOW TO REMOVE AN ADMIN
-- ============================================================
-- DELETE FROM admins WHERE email = 'someone@example.com';

-- ============================================================
-- HOW TO LIST ALL ADMINS
-- ============================================================
-- SELECT * FROM admins;
