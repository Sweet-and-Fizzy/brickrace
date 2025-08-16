-- Fix manual heat generation to ADD heats instead of regenerating all heats
-- This ensures heat numbers accumulate properly

-- Create a new function for adding additional heats (not regenerating all)
CREATE OR REPLACE FUNCTION public.add_qualifier_heats(target_race_id uuid)
RETURNS void AS $$
DECLARE
    checked_in_racers CURSOR FOR 
        SELECT r.id, r.name, r.racer_number 
        FROM public.racers r
        JOIN public.checkins c ON r.id = c.racer_id
        WHERE c.race_id = target_race_id
        ORDER BY c.time ASC; -- Order by check-in time
    
    racer_count integer := 0;
    starting_heat_number integer;
    heat_number integer;
    track_number integer := 1;
    starting_schedule_order integer;
    schedule_order integer;
BEGIN
    -- Get the next heat number (continue from existing heats)
    SELECT COALESCE(MAX(heat_number), 0) + 1 INTO starting_heat_number
    FROM public.qualifiers WHERE race_id = target_race_id;
    
    -- Get the next schedule order
    SELECT COALESCE(MAX(scheduled_order), 0) + 1 INTO starting_schedule_order
    FROM public.qualifiers WHERE race_id = target_race_id;
    
    heat_number := starting_heat_number;
    schedule_order := starting_schedule_order;
    
    -- Generate heats for checked-in racers who have the fewest attempts
    FOR racer IN checked_in_racers LOOP
        racer_count := racer_count + 1;
        
        -- Insert qualifier record
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
            schedule_order,
            'scheduled',
            0
        );
        
        -- Alternate between track 1 and track 2
        IF track_number = 1 THEN
            track_number := 2;
        ELSE
            track_number := 1;
            heat_number := heat_number + 1;
            schedule_order := schedule_order + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Added % heats starting from heat #% for % racers', 
                 heat_number - starting_heat_number, starting_heat_number, racer_count;
END;
$$ LANGUAGE plpgsql;

-- Keep the original function but rename it to be clear about what it does
CREATE OR REPLACE FUNCTION public.regenerate_all_qualifier_heats(target_race_id uuid)
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
BEGIN
    -- Clear existing qualifiers for this race (ONLY scheduled ones, keep completed)
    DELETE FROM public.qualifiers 
    WHERE race_id = target_race_id 
    AND status IN ('scheduled', 'in_progress');
    
    -- Get the next heat number after any completed heats
    SELECT COALESCE(MAX(heat_number), 0) + 1 INTO heat_number
    FROM public.qualifiers WHERE race_id = target_race_id;
    
    -- Generate heats for checked-in racers
    FOR racer IN checked_in_racers LOOP
        racer_count := racer_count + 1;
        
        -- Insert qualifier record
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
    
    RAISE NOTICE 'Regenerated heats starting from heat #% for % racers', 
                 heat_number, racer_count;
END;
$$ LANGUAGE plpgsql;

-- Update the original function to use the new logic
CREATE OR REPLACE FUNCTION public.generate_qualifier_heats(target_race_id uuid)
RETURNS void AS $$
BEGIN
    -- Use the add function instead of regenerating all
    PERFORM public.add_qualifier_heats(target_race_id);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_qualifier_heats TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_all_qualifier_heats TO authenticated;