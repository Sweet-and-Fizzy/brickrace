# Database Migration: Add race_datetime Field

This migration adds a new `race_datetime` field to the `races` table to support precise countdown timing.

## SQL Commands

Run these commands in your Supabase SQL editor:

### 1. Add the new race_datetime column

```sql
-- Add race_datetime column to races table
ALTER TABLE races
ADD COLUMN race_datetime TIMESTAMPTZ;
```

### 2. (Optional) Migrate existing data

If you have existing races and want to convert their dates to datetimes (defaults to noon):

```sql
-- Update existing races to have datetime at noon
UPDATE races
SET race_datetime = (date + INTERVAL '12 hours')::TIMESTAMPTZ
WHERE race_datetime IS NULL AND date IS NOT NULL;
```

### 3. (Optional) Remove old date column

After confirming everything works, you can remove the old date column:

```sql
-- Remove the old date column (only after confirming everything works)
-- ALTER TABLE races DROP COLUMN date;
```

## Frontend Changes

The frontend has been updated to:

1. **Race Creation/Editing**: Now includes both date and time pickers
2. **Countdown Timer**: Uses the full datetime for precise timing
3. **Display**: Shows full date and time information
4. **Backward Compatibility**: Falls back to the old `date` field if `race_datetime` is not available

## Testing

1. Create a new race with a specific date and time
2. Verify the countdown timer shows the correct time remaining
3. Check that existing races still display properly
4. Confirm race editing allows you to update both date and time

## Rollback

If you need to rollback:

```sql
-- Remove the race_datetime column
ALTER TABLE races DROP COLUMN race_datetime;
```

The frontend will automatically fall back to using the `date` field.
