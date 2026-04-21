-- ============================================================
-- Run this in Supabase SQL Editor AFTER the main migration
-- Adds voter_email to vote_log for per-user vote tracking
-- ============================================================

-- Add voter_email column if it doesn't exist
alter table vote_log add column if not exists voter_email text;

-- Index for fast lookup of a user's votes
create index if not exists vote_log_voter_email_idx on vote_log(voter_email);

-- Unique constraint: one vote per voter per category
alter table vote_log drop constraint if exists one_vote_per_category;
alter table vote_log add constraint one_vote_per_category
  unique (voter_email, category_id);
