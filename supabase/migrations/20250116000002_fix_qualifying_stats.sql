-- Fix the qualifying stats function to avoid nested aggregate functions

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
    min_attempt_count integer;
BEGIN
    -- Get active race
    SELECT id INTO active_race_id FROM public.races WHERE active = true LIMIT 1;
    
    IF active_race_id IS NULL THEN
        RAISE EXCEPTION 'No active race found';
    END IF;
    
    -- First, get the minimum attempt count
    SELECT MIN(attempt_count) INTO min_attempt_count
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
    
    -- Now return the full stats using the pre-calculated min
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_racers,
        SUM(attempt_count)::integer as total_attempts,
        MIN(attempt_count)::integer as min_attempts,
        MAX(attempt_count)::integer as max_attempts,
        AVG(attempt_count) as avg_attempts,
        COUNT(CASE WHEN attempt_count = min_attempt_count THEN 1 END)::integer as racers_with_min_attempts
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