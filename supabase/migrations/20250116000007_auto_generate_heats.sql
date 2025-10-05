-- Auto-generate heats after completion and add bracket transition controls
-- Add qualifying_mode to races table to control when to stop generating heats

-- Add qualifying mode to races table
ALTER TABLE public.races 
ADD COLUMN IF NOT EXISTS qualifying_mode text DEFAULT 'auto' CHECK (qualifying_mode IN ('auto', 'manual', 'brackets'));

-- Comment for the column
COMMENT ON COLUMN public.races.qualifying_mode IS 'Controls heat generation: auto=generate after each completion, manual=admin controlled, brackets=qualifying finished';

-- Enhanced complete_heat function with auto-generation
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
    racer_counts RECORD;
    min_attempts integer;
    max_attempts integer;
    next_heat_num integer;
    track_assignment integer := 1;
    schedule_order integer;
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
    
    -- Auto-generate next heat if in auto mode and conditions are met
    IF current_qualifying_mode = 'auto' THEN
        -- Get attempt count statistics
        SELECT 
            MIN(attempt_count) as min_attempts,
            MAX(attempt_count) as max_attempts
        INTO min_attempts, max_attempts
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
        
        -- Only generate new heat if there's a gap in attempts (some racers have fewer attempts)
        -- or if no one has any attempts yet (min_attempts will be 0)
        IF min_attempts < max_attempts OR (min_attempts = 0 AND max_attempts = 0) THEN
            -- Get next heat number
            SELECT COALESCE(MAX(heat_number), 0) + 1 
            INTO next_heat_num
            FROM public.qualifiers 
            WHERE race_id = active_race_id;
            
            -- Get next schedule order
            SELECT COALESCE(MAX(scheduled_order), 0) + 1
            INTO schedule_order
            FROM public.qualifiers 
            WHERE race_id = active_race_id;
            
            -- Generate one new heat with racers who have the fewest attempts
            FOR racer_counts IN 
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
                LIMIT 2
            LOOP
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
                    racer_counts.racer_id,
                    active_race_id,
                    next_heat_num,
                    track_assignment,
                    'scheduled',
                    schedule_order,
                    0
                );
                
                -- Alternate track assignment
                IF track_assignment = 1 THEN
                    track_assignment := 2;
                ELSE
                    EXIT; -- Only create heats with 2 racers
                END IF;
            END LOOP;
            
            RAISE NOTICE 'Auto-generated heat % with racers having % attempts', next_heat_num, min_attempts;
        ELSE
            RAISE NOTICE 'All racers have equal attempts (%), no new heat generated', min_attempts;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to set qualifying mode for active race
CREATE OR REPLACE FUNCTION public.set_qualifying_mode(mode text)
RETURNS void AS $$
BEGIN
    UPDATE public.races 
    SET qualifying_mode = mode
    WHERE active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active race found';
    END IF;
    
    RAISE NOTICE 'Qualifying mode set to: %', mode;
END;
$$ LANGUAGE plpgsql;

-- Function to get qualifying statistics for the active race
CREATE OR REPLACE FUNCTION public.get_qualifying_stats()
RETURNS TABLE (
    total_racers integer,
    total_attempts integer,
    min_attempts integer,
    max_attempts integer,
    avg_attempts numeric,
    racers_with_min_attempts integer
) AS $$
DECLARE
    active_race_id uuid;
BEGIN
    -- Get active race
    SELECT id INTO active_race_id FROM public.races WHERE active = true LIMIT 1;
    
    IF active_race_id IS NULL THEN
        RAISE EXCEPTION 'No active race found';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_racers,
        SUM(attempt_count)::integer as total_attempts,
        MIN(attempt_count)::integer as min_attempts,
        MAX(attempt_count)::integer as max_attempts,
        AVG(attempt_count) as avg_attempts,
        COUNT(CASE WHEN attempt_count = MIN(attempt_count) THEN 1 END)::integer as racers_with_min_attempts
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
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_qualifying_mode TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_qualifying_stats TO authenticated, anon;

-- Update existing races to auto mode
UPDATE public.races SET qualifying_mode = 'auto' WHERE qualifying_mode IS NULL;