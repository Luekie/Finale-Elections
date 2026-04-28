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

-- ============================================================
-- Signup attempt rate limiting — 16 hour cooldown per device
-- ============================================================

create table if not exists signup_attempts (
  id uuid default gen_random_uuid() primary key,
  fingerprint text not null,
  email text not null,
  created_at timestamptz default now()
);

create index if not exists signup_attempts_fingerprint_idx on signup_attempts(fingerprint);
create index if not exists signup_attempts_created_at_idx on signup_attempts(created_at);

alter table signup_attempts enable row level security;

-- Anyone can read (needed to check cooldown pre-auth)
create policy "Public read signup_attempts"
  on signup_attempts for select using (true);

-- Anyone can insert (pre-auth, fingerprint logged before account exists)
create policy "Public insert signup_attempts"
  on signup_attempts for insert with check (true);
