-- Fix regenerate_all_qualifier_heats to exclude withdrawn racers
-- This prevents withdrawn racers from being re-added when admin regenerates heats

CREATE OR REPLACE FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    checked_in_racers CURSOR FOR
        SELECT r.id, r.name, r.racer_number
        FROM public.racers r
        JOIN public.checkins c ON r.id = c.racer_id
        WHERE c.race_id = target_race_id
        -- CRITICAL FIX: Exclude withdrawn racers
        AND r.id NOT IN (
            SELECT racer_id
            FROM public.race_withdrawals
            WHERE race_id = target_race_id
        )
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

    -- Generate heats for checked-in racers (excluding withdrawn)
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

    RAISE NOTICE 'Regenerated % heats for % racers (excluding withdrawn)',
                 CASE WHEN racers_added > 0 THEN (racers_added + 1) / 2 ELSE 0 END,
                 racers_added;
END;
$$;

COMMENT ON FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") IS
'Regenerates all qualifier heats for a race, excluding withdrawn racers. Preserves completed heats and only removes scheduled/in-progress heats.';
