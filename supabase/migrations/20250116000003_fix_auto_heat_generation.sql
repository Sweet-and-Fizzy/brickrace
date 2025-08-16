-- Fix auto-generation logic to ensure proper 2-racer heats and avoid duplicates

CREATE OR REPLACE FUNCTION public.complete_heat(
    heat_num integer,
    track1_time decimal DEFAULT NULL,
    track2_time decimal DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    active_race_id uuid;
    completion_time timestamptz := now();
    current_qualifying_mode text;
    min_attempts integer;
    next_heat_num integer;
    schedule_order integer;
    racer1_id uuid;
    racer2_id uuid;
    racers_available integer;
BEGIN
    -- Get active race and its qualifying mode
    SELECT id, qualifying_mode INTO active_race_id, current_qualifying_mode 
    FROM public.races 
    WHERE active = true 
    LIMIT 1;
    
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
    
    -- Auto-generate next heat if in auto mode
    IF current_qualifying_mode = 'auto' THEN
        -- Get the minimum attempt count
        SELECT MIN(attempt_count) INTO min_attempts
        FROM (
            SELECT 
                c.racer_id,
                COUNT(q.id) as attempt_count
            FROM public.checkins c
            LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id 
                AND q.race_id = c.race_id 
                AND q.status = 'completed'
                AND q.time > 0
            WHERE c.race_id = active_race_id
            GROUP BY c.racer_id
        ) racer_attempts;
        
        -- Count how many racers have the minimum attempts
        SELECT COUNT(*) INTO racers_available
        FROM (
            SELECT 
                c.racer_id,
                COUNT(q.id) as attempt_count
            FROM public.checkins c
            LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id 
                AND q.race_id = c.race_id 
                AND q.status = 'completed'
                AND q.time > 0
            WHERE c.race_id = active_race_id
            GROUP BY c.racer_id
            HAVING COUNT(q.id) = min_attempts
        ) min_attempt_racers;
        
        -- Only generate a heat if we have at least 2 racers with minimum attempts
        IF racers_available >= 2 THEN
            -- Get next heat number and schedule order
            SELECT COALESCE(MAX(heat_number), 0) + 1 INTO next_heat_num
            FROM public.qualifiers WHERE race_id = active_race_id;
            
            SELECT COALESCE(MAX(scheduled_order), 0) + 1 INTO schedule_order
            FROM public.qualifiers WHERE race_id = active_race_id;
            
            -- Get exactly 2 racers with minimum attempts
            SELECT racer_id INTO racer1_id
            FROM (
                SELECT 
                    c.racer_id,
                    COUNT(q.id) as attempt_count
                FROM public.checkins c
                LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id 
                    AND q.race_id = c.race_id 
                    AND q.status = 'completed'
                    AND q.time > 0
                WHERE c.race_id = active_race_id
                GROUP BY c.racer_id
                HAVING COUNT(q.id) = min_attempts
                ORDER BY random()
                LIMIT 1
            ) first_racer;
            
            SELECT racer_id INTO racer2_id
            FROM (
                SELECT 
                    c.racer_id,
                    COUNT(q.id) as attempt_count
                FROM public.checkins c
                LEFT JOIN public.qualifiers q ON q.racer_id = c.racer_id 
                    AND q.race_id = c.race_id 
                    AND q.status = 'completed'
                    AND q.time > 0
                WHERE c.race_id = active_race_id
                AND c.racer_id != racer1_id  -- Exclude the first racer
                GROUP BY c.racer_id
                HAVING COUNT(q.id) = min_attempts
                ORDER BY random()
                LIMIT 1
            ) second_racer;
            
            -- Insert both racers into the new heat
            INSERT INTO public.qualifiers (
                racer_id, race_id, heat_number, track_number, 
                status, scheduled_order, time
            ) VALUES 
                (racer1_id, active_race_id, next_heat_num, 1, 'scheduled', schedule_order, 0),
                (racer2_id, active_race_id, next_heat_num, 2, 'scheduled', schedule_order, 0);
            
            RAISE NOTICE 'Auto-generated heat % with 2 racers having % attempts', next_heat_num, min_attempts;
        ELSE
            RAISE NOTICE 'Only % racer(s) available with minimum attempts (%), no new heat generated', racers_available, min_attempts;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;