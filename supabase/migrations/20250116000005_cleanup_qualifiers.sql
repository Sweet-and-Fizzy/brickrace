-- Clean up duplicate and invalid qualifier entries
-- Keep only valid completed races and remove duplicates/invalid entries

-- First, let's see what we're working with (this will be logged)
DO $$
DECLARE
    total_qualifiers integer;
    completed_qualifiers integer;
    duplicate_count integer;
BEGIN
    SELECT COUNT(*) INTO total_qualifiers FROM public.qualifiers;
    SELECT COUNT(*) INTO completed_qualifiers FROM public.qualifiers WHERE status = 'completed' AND time > 0;
    
    RAISE NOTICE 'Before cleanup: % total qualifiers, % completed with valid times', total_qualifiers, completed_qualifiers;
END $$;

-- Remove duplicate entries (keep only the earliest entry for each racer per heat)
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (
               PARTITION BY race_id, racer_id, heat_number, track_number 
               ORDER BY created_at ASC NULLS LAST, id ASC
           ) as row_num
    FROM public.qualifiers
)
DELETE FROM public.qualifiers 
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

-- Remove qualifiers with invalid data (status = 'completed' but time = 0 or NULL)
DELETE FROM public.qualifiers 
WHERE status = 'completed' 
AND (time IS NULL OR time <= 0)
AND created_at IS NULL;

-- Remove any orphaned scheduled/in_progress qualifiers that don't make sense
-- (e.g., single racers in heats, or very old scheduled heats)
WITH heat_racer_counts AS (
    SELECT race_id, heat_number, COUNT(*) as racer_count
    FROM public.qualifiers 
    WHERE status IN ('scheduled', 'in_progress')
    GROUP BY race_id, heat_number
)
DELETE FROM public.qualifiers 
WHERE status IN ('scheduled', 'in_progress')
AND (race_id, heat_number) IN (
    SELECT race_id, heat_number 
    FROM heat_racer_counts 
    WHERE racer_count = 1  -- Remove single-racer heats
);

-- Clean up any qualifiers without a valid racer or race
DELETE FROM public.qualifiers 
WHERE racer_id NOT IN (SELECT id FROM public.racers)
OR race_id NOT IN (SELECT id FROM public.races);

-- Reset sequence for heat numbers by updating scheduled_order to match heat_number
UPDATE public.qualifiers 
SET scheduled_order = heat_number 
WHERE scheduled_order IS NULL OR scheduled_order != heat_number;

-- Final summary
DO $$
DECLARE
    total_qualifiers integer;
    completed_qualifiers integer;
    scheduled_qualifiers integer;
    active_race_name text;
BEGIN
    SELECT COUNT(*) INTO total_qualifiers FROM public.qualifiers;
    SELECT COUNT(*) INTO completed_qualifiers FROM public.qualifiers WHERE status = 'completed' AND time > 0;
    SELECT COUNT(*) INTO scheduled_qualifiers FROM public.qualifiers WHERE status = 'scheduled';
    
    SELECT name INTO active_race_name FROM public.races WHERE active = true LIMIT 1;
    
    RAISE NOTICE 'After cleanup: % total qualifiers, % completed, % scheduled for race "%"', 
                 total_qualifiers, completed_qualifiers, scheduled_qualifiers, active_race_name;
END $$;