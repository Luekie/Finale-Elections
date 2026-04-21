-- Fix: allow unauthenticated reads on admins table
-- This is needed so the login form can check if an email is an admin
-- before the user is authenticated. Only email and name are exposed.

-- Drop the old policy
DROP POLICY IF EXISTS "Allow read for authenticated users" ON admins;

-- Allow anyone (including unauthenticated) to read the admins table
CREATE POLICY "Allow public read on admins"
  ON admins FOR SELECT
  TO anon, authenticated
  USING (true);
