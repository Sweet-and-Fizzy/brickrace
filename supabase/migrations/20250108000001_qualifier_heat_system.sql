-- Update qualifiers table to support heat/round system
ALTER TABLE public.qualifiers 
ADD COLUMN IF NOT EXISTS heat_number integer,
ADD COLUMN IF NOT EXISTS track_number integer CHECK (track_number IN (1, 2)),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS scheduled_order integer;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_qualifiers_race_heat ON public.qualifiers(race_id, heat_number, scheduled_order);
CREATE INDEX IF NOT EXISTS idx_qualifiers_race_status ON public.qualifiers(race_id, status);

-- Create a view for the current heat
CREATE OR REPLACE VIEW public.current_heat AS
SELECT q.*, 
       r1.name as racer1_name,
       r1.racer_number as racer1_number,
       r1.image_url as racer1_image_url,
       r2.name as racer2_name,
       r2.racer_number as racer2_number,
       r2.image_url as racer2_image_url
FROM public.qualifiers q
LEFT JOIN public.racers r1 ON r1.id = q.racer_id AND q.track_number = 1
LEFT JOIN public.racers r2 ON r2.id = (
    SELECT racer_id FROM public.qualifiers q2 
    WHERE q2.race_id = q.race_id 
    AND q2.heat_number = q.heat_number 
    AND q2.track_number = 2
    LIMIT 1
)
WHERE q.race_id = (SELECT id FROM public.races WHERE active = true LIMIT 1)
AND q.status = 'in_progress'
AND q.track_number = 1;

-- Create function to get next heats
CREATE OR REPLACE FUNCTION public.get_next_heats(heat_count integer DEFAULT 2)
RETURNS TABLE (
    heat_number integer,
    track_number integer,
    racer_id uuid,
    racer_name text,
    racer_number integer,
    racer_image_url text,
    scheduled_order integer,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.heat_number,
        q.track_number,
        q.racer_id,
        r.name as racer_name,
        r.racer_number,
        r.image_url as racer_image_url,
        q.scheduled_order,
        q.status
    FROM public.qualifiers q
    JOIN public.racers r ON r.id = q.racer_id
    WHERE q.race_id = (SELECT id FROM public.races WHERE active = true LIMIT 1)
    AND q.status = 'scheduled'
    ORDER BY q.scheduled_order, q.heat_number, q.track_number
    LIMIT (heat_count * 2); -- 2 racers per heat
END;
$$ LANGUAGE plpgsql;

-- Create function to generate qualifier heats
CREATE OR REPLACE FUNCTION public.generate_qualifier_heats(target_race_id uuid)
RETURNS void AS $$
DECLARE
    heat_num integer := 1;
    schedule_order integer := 1;
    racer_record RECORD;
    track_assignment integer := 1;
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

        -- Alternate track assignment
        IF track_assignment = 1 THEN
            track_assignment := 2;
        ELSE
            track_assignment := 1;
            heat_num := heat_num + 1;
            schedule_order := schedule_order + 1;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark heat as in progress
CREATE OR REPLACE FUNCTION public.start_heat(heat_num integer)
RETURNS void AS $$
DECLARE
    active_race_id uuid;
BEGIN
    -- Get active race
    SELECT id INTO active_race_id FROM public.races WHERE active = true LIMIT 1;
    
    IF active_race_id IS NULL THEN
        RAISE EXCEPTION 'No active race found';
    END IF;

    -- Mark all qualifiers as completed if they were in progress
    UPDATE public.qualifiers 
    SET status = 'completed'
    WHERE race_id = active_race_id 
    AND status = 'in_progress';

    -- Mark the specified heat as in progress
    UPDATE public.qualifiers 
    SET status = 'in_progress'
    WHERE race_id = active_race_id 
    AND heat_number = heat_num
    AND status = 'scheduled';
END;
$$ LANGUAGE plpgsql;

-- Create function to complete heat with times
CREATE OR REPLACE FUNCTION public.complete_heat(
    heat_num integer,
    track1_time decimal DEFAULT NULL,
    track2_time decimal DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    active_race_id uuid;
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
            status = 'completed'
        WHERE race_id = active_race_id 
        AND heat_number = heat_num
        AND track_number = 1;
    END IF;

    -- Update track 2 time if provided
    IF track2_time IS NOT NULL THEN
        UPDATE public.qualifiers 
        SET time = track2_time,
            status = 'completed'
        WHERE race_id = active_race_id 
        AND heat_number = heat_num
        AND track_number = 2;
    END IF;

    -- Mark both as completed if not already
    UPDATE public.qualifiers 
    SET status = 'completed'
    WHERE race_id = active_race_id 
    AND heat_number = heat_num
    AND status = 'in_progress';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.current_heat TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_next_heats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_qualifier_heats TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_heat TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_heat TO authenticated;

-- Add RLS policies for the new functions (admin only)
DROP POLICY IF EXISTS "Only race admins can generate heats" ON public.qualifiers;
CREATE POLICY "Only race admins can generate heats" ON public.qualifiers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'race_admin'
        )
    );

DROP POLICY IF EXISTS "Only race admins can update qualifier status" ON public.qualifiers;
CREATE POLICY "Only race admins can update qualifier status" ON public.qualifiers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.raw_user_meta_data->>'role' = 'race_admin'
        )
    );