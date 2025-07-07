-- Rollback Migration: Remove race_datetime field from races table
-- Created: 2025-01-07
-- Description: Rollback script to remove the race_datetime column if needed

-- Remove the index
DROP INDEX IF EXISTS idx_races_race_datetime;

-- Remove the race_datetime column
ALTER TABLE races DROP COLUMN IF EXISTS race_datetime;

-- Remove any constraints that were added
-- ALTER TABLE races DROP CONSTRAINT IF EXISTS check_race_has_datetime_or_date;