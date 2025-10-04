-- Fix heat generation to avoid creating single-racer heats
-- Single racers will be included in the next heat generation cycle

-- Update the add_qualifier_heats function to not create single-racer heats
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
    last_racer record;
    racers_added integer := 0;
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
        
        -- Store the racer info in case it's the last one
        last_racer := racer;
        
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
        
        racers_added := racers_added + 1;
        
        -- Alternate between track 1 and track 2
        IF track_number = 1 THEN
            track_number := 2;
        ELSE
            track_number := 1;
            heat_number := heat_number + 1;
            schedule_order := schedule_order + 1;
        END IF;
    END LOOP;
    
    -- If we ended on track 1 (odd number of racers), remove the last single racer
    IF track_number = 2 AND racers_added > 0 THEN
        -- Delete the last single-racer heat
        DELETE FROM public.qualifiers 
        WHERE race_id = target_race_id 
        AND racer_id = last_racer.id
        AND heat_number = (heat_number - 1)
        AND track_number = 1
        AND status = 'scheduled';
        
        racers_added := racers_added - 1;
        
        RAISE NOTICE 'Skipped creating single-racer heat. Racer % will be included in next generation.', last_racer.name;
    END IF;
    
    RAISE NOTICE 'Added % heats starting from heat #% for % racers', 
                 CASE WHEN racers_added > 0 THEN (racers_added + 1) / 2 ELSE 0 END, 
                 starting_heat_number, 
                 racers_added;
END;
$$ LANGUAGE plpgsql;

-- Update the regenerate function with the same logic
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
    last_racer record;
    racers_added integer := 0;
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
        
        -- Store the racer info in case it's the last one
        last_racer := racer;
        
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
        
        racers_added := racers_added + 1;
        
        -- Alternate between track 1 and track 2
        IF track_number = 1 THEN
            track_number := 2;
        ELSE
            track_number := 1;
            heat_number := heat_number + 1;
        END IF;
    END LOOP;
    
    -- If we ended on track 1 (odd number of racers), remove the last single racer
    IF track_number = 2 AND racers_added > 0 THEN
        -- Delete the last single-racer heat
        DELETE FROM public.qualifiers 
        WHERE race_id = target_race_id 
        AND racer_id = last_racer.id
        AND heat_number = (heat_number - 1)
        AND track_number = 1
        AND status = 'scheduled';
        
        racers_added := racers_added - 1;
        
        RAISE NOTICE 'Skipped creating single-racer heat. Racer % will be included in next generation.', last_racer.name;
    END IF;
    
    RAISE NOTICE 'Regenerated % heats for % racers', 
                 CASE WHEN racers_added > 0 THEN (racers_added + 1) / 2 ELSE 0 END,
                 racers_added;
END;
$$ LANGUAGE plpgsql;

-- Update the original generate_qualifier_heats function to prioritize racers with fewer attempts
CREATE OR REPLACE FUNCTION public.generate_qualifier_heats(target_race_id uuid)
RETURNS void AS $$
DECLARE
    heat_num integer := 1;
    schedule_order integer := 1;
    racer_record RECORD;
    track_assignment integer := 1;
    last_racer_id uuid;
    racers_added integer := 0;
BEGIN
    -- Clear existing scheduled qualifiers for this race
    DELETE FROM public.qualifiers 
    WHERE race_id = target_race_id 
    AND status = 'scheduled';

    -- Get all checked-in racers with their qualifier count
    -- Randomize within groups of same qualifier count for fairness
    FOR racer_record IN 
        SELECT 
            c.racer_id,
            COUNT(q.id) as qualifier_count
        FROM public.checkins c
        LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id AND q.race_id = c.race_id
        WHERE c.race_id = target_race_id
        GROUP BY c.racer_id
        ORDER BY qualifier_count, random()
    LOOP
        last_racer_id := racer_record.racer_id;
        
        -- Insert qualifier for this racer
        INSERT INTO public.qualifiers (
            racer_id,
            race_id,
            heat_number,
            track_number,
            status,
            scheduled_order,
            time
        ) VALUES (
            racer_record.racer_id,
            target_race_id,
            heat_num,
            track_assignment,
            'scheduled',
            schedule_order,
            0 -- Default time
        );
        
        racers_added := racers_added + 1;

        -- Alternate track assignment
        IF track_assignment = 1 THEN
            track_assignment := 2;
        ELSE
            track_assignment := 1;
            heat_num := heat_num + 1;
            schedule_order := schedule_order + 1;
        END IF;
    END LOOP;
    
    -- If we ended on track 1 (odd number of racers), remove the last single racer
    IF track_assignment = 2 AND racers_added > 0 THEN
        -- Delete the last single-racer heat
        DELETE FROM public.qualifiers 
        WHERE race_id = target_race_id 
        AND racer_id = last_racer_id
        AND heat_number = (heat_num - 1)
        AND track_number = 1
        AND status = 'scheduled';
        
        racers_added := racers_added - 1;
        
        RAISE NOTICE 'Skipped creating single-racer heat. Racer will be included in next generation with priority.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_qualifier_heats TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_all_qualifier_heats TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_qualifier_heats TO authenticated;