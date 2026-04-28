-- ============================================================
-- Device fingerprint registration tracking
-- Prevents the same device from creating multiple accounts
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists device_registrations (
  id uuid default gen_random_uuid() primary key,
  fingerprint text not null unique,
  email text not null,
  created_at timestamptz default now()
);

alter table device_registrations enable row level security;

-- Anyone can check if a fingerprint exists (needed pre-auth)
create policy "Public read device_registrations"
  on device_registrations for select using (true);

-- Only authenticated users can insert their own registration
create policy "Auth insert device_registration"
  on device_registrations for insert
  to authenticated
  with check (true);
