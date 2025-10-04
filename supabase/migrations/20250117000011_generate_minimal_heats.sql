-- Generate minimal heats: just enough for current + 2 upcoming
-- Takes 2 racers with fewest qualifiers each time

CREATE OR REPLACE FUNCTION public.add_qualifier_heats(target_race_id uuid)
RETURNS void AS $$
DECLARE
    racer1_record RECORD;
    racer2_record RECORD;
    starting_heat_number integer;
    current_heat_number integer;
    starting_schedule_order integer;
    current_schedule_order integer;
    heats_generated integer := 0;
    target_heats integer := 3; -- Generate up to 3 heats (current + 2 upcoming)
    existing_scheduled_heats integer;
BEGIN
    -- Count existing scheduled heats
    SELECT COUNT(DISTINCT heat_number) INTO existing_scheduled_heats
    FROM public.qualifiers 
    WHERE race_id = target_race_id 
    AND status = 'scheduled';
    
    -- Only generate heats if we have fewer than 3 scheduled heats
    IF existing_scheduled_heats >= target_heats THEN
        RAISE NOTICE 'Already have % scheduled heats. No need to generate more.', existing_scheduled_heats;
        RETURN;
    END IF;
    
    -- Calculate how many more heats we need
    target_heats := target_heats - existing_scheduled_heats;
    
    -- Get the next heat number
    SELECT COALESCE(MAX(q.heat_number), 0) + 1 INTO starting_heat_number
    FROM public.qualifiers q 
    WHERE q.race_id = target_race_id;
    
    -- Get the next schedule order
    SELECT COALESCE(MAX(q.scheduled_order), 0) + 1 INTO starting_schedule_order
    FROM public.qualifiers q 
    WHERE q.race_id = target_race_id;
    
    current_heat_number := starting_heat_number;
    current_schedule_order := starting_schedule_order;
    
    RAISE NOTICE 'Generating % additional heats starting from heat #%', target_heats, starting_heat_number;
    
    -- Generate the target number of heats
    WHILE heats_generated < target_heats LOOP
        -- Get the 2 racers with the fewest qualifiers
        SELECT 
            c.racer_id,
            COUNT(q.id) as qualifier_count
        INTO racer1_record
        FROM public.checkins c
        LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id AND q.race_id = c.race_id
        WHERE c.race_id = target_race_id
        GROUP BY c.racer_id
        ORDER BY COUNT(q.id) ASC, random()
        LIMIT 1;
        
        -- Get the 2nd racer with fewest qualifiers (excluding the first)
        SELECT 
            c.racer_id,
            COUNT(q.id) as qualifier_count
        INTO racer2_record
        FROM public.checkins c
        LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id AND q.race_id = c.race_id
        WHERE c.race_id = target_race_id
        AND c.racer_id != racer1_record.racer_id
        GROUP BY c.racer_id
        ORDER BY COUNT(q.id) ASC, random()
        LIMIT 1;
        
        -- Make sure we found 2 different racers
        IF racer1_record.racer_id IS NULL OR racer2_record.racer_id IS NULL THEN
            RAISE NOTICE 'Could not find 2 different racers for heat generation.';
            EXIT;
        END IF;
        
        RAISE NOTICE 'Creating heat #%: Racer % (% quals) vs Racer % (% quals)', 
                     current_heat_number, 
                     racer1_record.racer_id, racer1_record.qualifier_count,
                     racer2_record.racer_id, racer2_record.qualifier_count;
        
        -- Insert racer 1 on track 1
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
            racer1_record.racer_id,
            current_heat_number,
            1,
            current_schedule_order,
            'scheduled',
            0
        );
        
        -- Insert racer 2 on track 2
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
            racer2_record.racer_id,
            current_heat_number,
            2,
            current_schedule_order,
            'scheduled',
            0
        );
        
        -- Move to next heat
        current_heat_number := current_heat_number + 1;
        current_schedule_order := current_schedule_order + 1;
        heats_generated := heats_generated + 1;
    END LOOP;
    
    RAISE NOTICE 'Generated % heats starting from heat #%', heats_generated, starting_heat_number;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_qualifier_heats TO authenticated;