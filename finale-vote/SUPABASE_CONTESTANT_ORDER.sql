-- Add display_order column to contestants table for manual ordering
-- Run this in Supabase SQL Editor

-- 1. Add display_order column
alter table contestants add column if not exists display_order integer default 0;

-- 2. Initialize display_order based on created_at for existing contestants
-- This ensures existing contestants maintain their current order
update contestants
set display_order = subquery.row_num
from (
  select id, row_number() over (partition by category_id order by created_at) as row_num
  from contestants
) as subquery
where contestants.id = subquery.id;

-- 3. Create index for better query performance
create index if not exists idx_contestants_display_order on contestants(category_id, display_order);
