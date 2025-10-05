-- Migration: Add race_datetime field to races table
-- Created: 2025-01-07
-- Description: Adds a race_datetime TIMESTAMPTZ column to support precise countdown timing

-- Add the new race_datetime column
ALTER TABLE races 
ADD COLUMN IF NOT EXISTS race_datetime TIMESTAMPTZ;

-- Add a comment to document the new field
COMMENT ON COLUMN races.race_datetime IS 'Full datetime for race start including time zone - replaces date field for precise timing';

-- Create an index on race_datetime for performance
CREATE INDEX IF NOT EXISTS idx_races_race_datetime ON races(race_datetime);

-- Update existing races to have datetime at noon (optional migration of existing data)
-- This sets existing races with only date to have a time of 12:00 PM
DO $$
BEGIN
	-- Only perform data backfill if the legacy 'date' column exists
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema = 'public' AND table_name = 'races' AND column_name = 'date'
	) THEN
		UPDATE public.races 
		SET race_datetime = (date + INTERVAL '12 hours')::TIMESTAMPTZ 
		WHERE race_datetime IS NULL AND date IS NOT NULL;
	END IF;
END $$;

-- Add a check constraint to ensure either race_datetime or date is provided
-- ALTER TABLE races ADD CONSTRAINT check_race_has_datetime_or_date 
-- CHECK (race_datetime IS NOT NULL OR date IS NOT NULL);

-- Note: The date column is kept for backward compatibility during transition
-- Once all races have been migrated to use race_datetime, the date column can be dropped:
-- ALTER TABLE races DROP COLUMN date;