-- ============================================================
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- 1. Drop old tables if they exist (cascade handles dependent policies + vote_log)
drop table if exists vote_log  cascade;
drop table if exists contestants cascade;
drop table if exists categories  cascade;

-- 2. Drop settings policies if they exist (table stays)
drop policy if exists "Public read settings"   on settings;
drop policy if exists "Public update settings" on settings;
drop policy if exists "Public insert settings" on settings;

-- 3. Categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 4. Contestants
create table contestants (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  image_url text,
  votes integer default 0,
  created_at timestamptz default now()
);

-- 5. Vote log
create table vote_log (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade,
  contestant_id uuid references contestants(id) on delete cascade,
  fingerprint text,
  created_at timestamptz default now()
);

-- 6. Settings
create table if not exists settings (
  key text primary key,
  value text not null
);
insert into settings (key, value) values ('voting_open', 'false')
on conflict (key) do nothing;

-- 7. Enable RLS
alter table categories  enable row level security;
alter table contestants enable row level security;
alter table vote_log    enable row level security;
alter table settings    enable row level security;

-- 8. Policies
create policy "Public all categories"  on categories  for all using (true) with check (true);
create policy "Public all contestants" on contestants for all using (true) with check (true);
create policy "Public all vote_log"    on vote_log    for all using (true) with check (true);
create policy "Public read settings"   on settings    for select using (true);
create policy "Public update settings" on settings    for update using (true);
create policy "Public insert settings" on settings    for insert with check (true);

-- 9. Increment vote function
create or replace function increment_vote(contestant_id uuid)
returns void as $$
  update contestants set votes = votes + 1 where id = contestant_id;
$$ language sql;

-- 10. Seed the 30 award categories
insert into categories (name, display_order) values
  ('G.O.A.T OF OUR TIME', 1),
  ('LEADER OF OUR TIME', 2),
  ('YAZA OF OUR TIME', 3),
  ('POLITICIAN OF OUR TIME', 4),
  ('MOST BEAUTIFUL STUDENT OF OUR TIME', 5),
  ('HANDSOME OF OUR TIME', 6),
  ('BEST COUPLE OF OUR TIME', 7),
  ('BEST DRESSED STUDENT OF OUR TIME (MALE)', 8),
  ('BEST DRESSED STUDENT OF OUR TIME (FEMALE)', 9),
  ('BEST ENTREPRENEUR OF OUR TIME (MALE)', 10),
  ('BEST ENTREPRENEUR OF OUR TIME (FEMALE)', 11),
  ('BEST ATHLETE OF OUR TIME (MALE)', 12),
  ('BEST ATHLETE OF OUR TIME (FEMALE)', 13),
  ('BADDIE OF OUR TIME', 14),
  ('CHIDAKWA OF OUR TIME', 15),
  ('NJINGA OF OUR TIME', 16),
  ('FRIEND GROUP OF OUR TIME (MEN)', 17),
  ('FRIEND GROUP OF OUR TIME (WOMEN)', 18),
  ('NYASH OF OUR TIME', 19),
  ('NTUKWANI OF OUR TIME', 20),
  ('SWAZI OF OUR TIME', 21),
  ('MOST SOCIABLE PERSON (MALE)', 22),
  ('MOST SOCIABLE PERSON (FEMALE)', 23),
  ('BEST DUO OF OUR TIME', 24),
  ('PONA OF OUR TIME', 25),
  ('BEST EVENT ORGANISER', 26),
  ('PEER MENTOR OF OUR TIME', 27),
  ('INNOVATOR OF OUR TIME', 28),
  ('MOST LAUDABLE OF OUR TIME', 29),
  ('MOST CONFIDENT OF OUR TIME', 30)
on conflict (name) do nothing;
