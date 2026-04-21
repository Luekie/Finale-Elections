-- ============================================================
-- Run this in Supabase SQL Editor
-- Sets your admin PIN in the settings table
-- Change 'FINALE2026' to whatever PIN you want
-- (mix of CAPS and numbers recommended e.g. FIN2026EC)
-- ============================================================

insert into settings (key, value)
values ('admin_pin', 'FINALE2026')
on conflict (key) do update set value = excluded.value;
