-- Fix race completion timestamps
-- Use created_at only for race completion time, not database record creation time

-- Remove updated_at column since we don't need it for race timing
ALTER TABLE public.qualifiers DROP COLUMN IF EXISTS updated_at;

-- Modify created_at to be nullable and remove default
ALTER TABLE public.qualifiers 
ALTER COLUMN created_at DROP DEFAULT,
ALTER COLUMN created_at DROP NOT NULL;

-- Clear created_at for unfinished races (only set when race is actually completed)
UPDATE public.qualifiers 
SET created_at = NULL 
WHERE time IS NULL OR time = 0;

-- Update the complete_heat function to set created_at when times are recorded
CREATE OR REPLACE FUNCTION public.complete_heat(
    heat_num integer,
    track1_time decimal DEFAULT NULL,
    track2_time decimal DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    active_race_id uuid;
    completion_time timestamptz := now();
BEGIN
    -- Get active race
    SELECT id INTO active_race_id FROM public.races WHERE active = true LIMIT 1;
    
    IF active_race_id IS NULL THEN
        RAISE EXCEPTION 'No active race found';
    END IF;
    
    -- Update track 1 time if provided
    IF track1_time IS NOT NULL THEN
        UPDATE public.qualifiers 
        SET time = track1_time,
            status = 'completed',
            created_at = completion_time
        WHERE race_id = active_race_id 
        AND heat_number = heat_num
        AND track_number = 1;
    END IF;
    
    -- Update track 2 time if provided
    IF track2_time IS NOT NULL THEN
        UPDATE public.qualifiers 
        SET time = track2_time,
            status = 'completed',
            created_at = completion_time
        WHERE race_id = active_race_id 
        AND heat_number = heat_num
        AND track_number = 2;
    END IF;
    
    -- Mark any remaining racers in this heat as completed (no time recorded)
    UPDATE public.qualifiers 
    SET status = 'completed'
    WHERE race_id = active_race_id 
    AND heat_number = heat_num
    AND status = 'in_progress';
END;
$$ LANGUAGE plpgsql;

-- Also update the generate_qualifier_heats function to not set created_at initially
-- This ensures created_at is only set when times are actually recorded
CREATE OR REPLACE FUNCTION public.generate_qualifier_heats(target_race_id uuid)
RETURNS void AS $$
DECLARE
    checked_in_racers CURSOR FOR 
        SELECT r.id, r.name, r.racer_number 
        FROM public.racers r
        JOIN public.checkins c ON r.id = c.racer_id
        WHERE c.race_id = target_race_id
        ORDER BY c.time ASC; -- Order by check-in time
    
    racer_count integer := 0;
    heat_number integer := 1;
    track_number integer := 1;
    current_time timestamptz := now();
BEGIN
    -- Clear existing qualifiers for this race
    DELETE FROM public.qualifiers WHERE race_id = target_race_id;
    
    -- Generate heats for checked-in racers
    FOR racer IN checked_in_racers LOOP
        racer_count := racer_count + 1;
        
        -- Insert qualifier record without created_at (will be set when time is recorded)
        INSERT INTO public.qualifiers (
            race_id, 
            racer_id, 
            heat_number, 
            track_number, 
            scheduled_order,
            status,
            time
        ) VALUES (
            target_race_id,
            racer.id,
            heat_number,
            track_number,
            heat_number,
            'scheduled',
            0
        );
        
        -- Alternate between track 1 and track 2
        IF track_number = 1 THEN
            track_number := 2;
        ELSE
            track_number := 1;
            heat_number := heat_number + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Generated % heats for % racers', heat_number - 1, racer_count;
END;
$$ LANGUAGE plpgsql;