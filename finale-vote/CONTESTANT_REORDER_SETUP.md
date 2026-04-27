# Contestant Reordering Setup

This feature allows super admins to reorder contestants within each category using up/down arrow buttons.

## Database Setup

Run the following SQL migration in your Supabase SQL Editor:

```sql
-- Add display_order column to contestants table
alter table contestants add column if not exists display_order integer default 0;

-- Initialize display_order based on created_at for existing contestants
update contestants
set display_order = subquery.row_num
from (
  select id, row_number() over (partition by category_id order by created_at) as row_num
  from contestants
) as subquery
where contestants.id = subquery.id;

-- Create index for better query performance
create index if not exists idx_contestants_display_order on contestants(category_id, display_order);
```

Or simply run the `SUPABASE_CONTESTANT_ORDER.sql` file in the Supabase SQL Editor.

## Features

- **Up/Down Arrows**: Click the ↑ or ↓ buttons next to each contestant to move them up or down in the list
- **Visual Feedback**: Buttons are disabled when a contestant is at the top (can't move up) or bottom (can't move down)
- **Real-time Updates**: Changes are immediately reflected across all connected clients
- **Super Admin Only**: Only super admins can see and use the reorder buttons

## How It Works

1. Contestants are now ordered by `display_order` column (then by `created_at` as fallback)
2. When you click an arrow button, the contestant swaps positions with the one above/below it
3. The `display_order` values are updated in the database
4. All clients receive the update via real-time subscriptions

## Usage

1. Log in as a super admin
2. Navigate to Admin → Manage
3. Expand a category
4. Use the ↑ and ↓ buttons next to each contestant to reorder them
5. The order is saved automatically and reflected in the voting panel
