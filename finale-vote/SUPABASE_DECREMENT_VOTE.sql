-- Add decrement_vote RPC function to support vote changes
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION decrement_vote(contestant_id uuid)
RETURNS void AS $$
  UPDATE contestants
  SET votes = GREATEST(0, votes - 1)
  WHERE id = contestant_id;
$$ LANGUAGE sql SECURITY DEFINER;
