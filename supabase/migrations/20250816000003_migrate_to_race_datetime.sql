-- Complete migration from date to race_datetime
-- This replaces the date field with a proper datetime field

-- Add new datetime column
ALTER TABLE public.races 
ADD COLUMN race_datetime timestamp with time zone;

-- Migrate existing data (convert date to datetime with default 12:00 PM)
UPDATE public.races 
SET race_datetime = (date || ' 12:00:00')::timestamp with time zone 
WHERE date IS NOT NULL;

-- Drop the active_race view temporarily (it depends on the date column)
DROP VIEW IF EXISTS public.active_race;

-- Drop the old date column
ALTER TABLE public.races 
DROP COLUMN date;

-- Recreate the active_race view (now works with race_datetime)
CREATE OR REPLACE VIEW public.active_race AS
SELECT * FROM public.races WHERE active = true;

-- Grant access to the view
GRANT SELECT ON public.active_race TO authenticated, anon;

-- Add comment
COMMENT ON COLUMN public.races.race_datetime IS 'Date and time when the race takes place';