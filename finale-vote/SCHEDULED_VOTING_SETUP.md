# Scheduled Voting Setup

This feature allows the election controller to schedule voting to open automatically at a specific time.

## Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add scheduled voting time setting
insert into settings (key, value) 
values ('scheduled_voting_time', '')
on conflict (key) do nothing;
```

Or simply run the `SUPABASE_SCHEDULED_VOTING.sql` file.

## Features

### Automatic Voting Opening
- Set a specific date and time for voting to open automatically
- The system checks every minute if the scheduled time has been reached
- When the time arrives, voting opens automatically
- The schedule is cleared after voting opens

### Quick Schedule Button
- "Set Tomorrow at 6:00 AM" button for quick scheduling
- Automatically calculates tomorrow's date at 6:00 AM local time

### Manual Schedule
- Use the datetime picker to set any custom date and time
- Shows the currently scheduled time if one is set
- Can clear the schedule at any time

### Visual Indicators
- Shows scheduled time on the voting toggle card when voting is closed
- Real-time countdown visible to all admins
- Schedule button only visible to `lusekero@elections.com`

## How to Use

1. Log in as `lusekero@elections.com`
2. Navigate to Admin → Manage
3. When voting is closed, click the "⏰ Schedule" button
4. Either:
   - Click "Set Tomorrow at 6:00 AM" for quick setup
   - Or use the datetime picker to choose a custom time
5. Click "Schedule" to confirm
6. The scheduled time will appear on the voting card
7. Voting will open automatically at the scheduled time

## Permissions

- Only `lusekero@elections.com` can schedule voting
- Other admins can see the scheduled time but cannot modify it
- Manual opening/closing still works and takes precedence over scheduled times

## Notes

- The timer runs on the client side (browser)
- All connected clients will check the schedule independently
- If voting is manually opened before the scheduled time, the schedule is ignored
- The schedule is cleared automatically after voting opens
- All times are displayed in Central Africa Time (CAT, UTC+2)
- The datetime picker uses local browser time but displays are formatted to CAT
