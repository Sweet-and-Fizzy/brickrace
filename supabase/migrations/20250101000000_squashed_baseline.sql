

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_qualifier_heats"("target_race_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."add_qualifier_heats"("target_race_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_race_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only generate slug if not provided or if name changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := generate_unique_slug(generate_slug(NEW.name), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_race_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_racer_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_racer_slug(new.name, new.id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."auto_generate_racer_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_withdrawal_permission"("user_id" "uuid", "target_race_id" "uuid", "target_racer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user is a race admin via JWT metadata
  -- Note: This function runs with SECURITY DEFINER so auth.jwt() won't work here
  -- Instead, we'll check if the user owns the racer
  IF EXISTS (
    SELECT 1 FROM public.racers 
    WHERE id = target_racer_id AND user_id = user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- No permission (admin check will be done in the API layer)
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_withdrawal_permission"("user_id" "uuid", "target_race_id" "uuid", "target_racer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_heat"("heat_num" integer, "track1_time" numeric DEFAULT NULL::numeric, "track2_time" numeric DEFAULT NULL::numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."complete_heat"("heat_num" integer, "track1_time" numeric, "track2_time" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_active_race"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If this race is being set to active, deactivate all others
  IF NEW.active = true THEN
    UPDATE public.races 
    SET active = false 
    WHERE id != NEW.id AND active = true;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_active_race"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_active_race_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If this new race is being set to active, deactivate all others
  IF NEW.active = true THEN
    UPDATE public.races 
    SET active = false 
    WHERE active = true;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_active_race_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_double_elimination_structure"("race_id" "uuid", "racer_ids" "uuid"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  racer_count integer;
  bracket_pairs json[];
  result json;
BEGIN
  racer_count := array_length(racer_ids, 1);
  
  IF racer_count < 2 THEN
    RAISE EXCEPTION 'Need at least 2 racers for double elimination';
  END IF;
  
  -- Clear existing brackets for this race
  DELETE FROM public.brackets WHERE race_id = race_id;
  
  -- Generate initial winner bracket pairs
  -- For now, just pair racers sequentially (can be enhanced with seeding later)
  bracket_pairs := ARRAY[]::json[];
  
  FOR i IN 1..racer_count BY 2 LOOP
    IF i + 1 <= racer_count THEN
      -- Regular pairing
      bracket_pairs := bracket_pairs || json_build_object(
        'round_number', 1,
        'bracket_group', 'winner',
        'track1_racer_id', racer_ids[i],
        'track2_racer_id', racer_ids[i + 1]
      )::json;
    ELSE
      -- Odd racer gets a bye (automatic advance)
      bracket_pairs := bracket_pairs || json_build_object(
        'round_number', 1,
        'bracket_group', 'winner',
        'track1_racer_id', racer_ids[i],
        'track2_racer_id', null,
        'winner_track', 1,
        'winner_racer_id', racer_ids[i]
      )::json;
    END IF;
  END LOOP;
  
  result := json_build_object(
    'bracket_pairs', bracket_pairs,
    'total_brackets', array_length(bracket_pairs, 1)
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_double_elimination_structure"("race_id" "uuid", "racer_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_double_elimination_structure"("race_id" "uuid", "racer_ids" "uuid"[]) IS 'Generates initial double elimination bracket structure';



CREATE OR REPLACE FUNCTION "public"."generate_qualifier_heats"("target_race_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_qualifier_heats"("target_race_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_racer_slug"("racer_name" "text", "racer_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Convert name to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(racer_name);
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If slug is empty after cleaning, use part of the UUID
  if base_slug = '' or base_slug is null then
    base_slug := 'racer-' || substring(racer_id::text, 1, 8);
  end if;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  while exists (select 1 from public.racers where slug = final_slug and id != racer_id) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  
  return final_slug;
end;
$$;


ALTER FUNCTION "public"."generate_racer_slug"("racer_name" "text", "racer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single hyphen
    )
  );
END;
$$;


ALTER FUNCTION "public"."generate_slug"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_slug"("base_slug" "text", "race_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  final_slug TEXT;
  counter INT := 1;
  slug_exists BOOLEAN;
BEGIN
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current race if updating)
  IF race_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug AND id != race_id) INTO slug_exists;
  ELSE
    SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug) INTO slug_exists;
  END IF;
  
  -- If slug exists, append numbers until we find a unique one
  WHILE slug_exists LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
    
    IF race_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug AND id != race_id) INTO slug_exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug) INTO slug_exists;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_slug"("base_slug" "text", "race_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_heats"("heat_count" integer DEFAULT 2) RETURNS TABLE("heat_number" integer, "track_number" integer, "racer_id" "uuid", "racer_name" "text", "racer_number" integer, "racer_image_url" "text", "scheduled_order" integer, "status" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_next_heats"("heat_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_qualifying_stats"() RETURNS TABLE("total_racers" integer, "total_attempts" integer, "min_attempts" integer, "max_attempts" integer, "avg_attempts" numeric, "racers_with_min_attempts" integer)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_qualifying_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_bracket_forfeit"("bracket_id" "uuid", "forfeiting_track" integer, "forfeit_reason" "text" DEFAULT 'Racer forfeit'::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  bracket_record public.brackets;
  winner_track integer;
  winner_racer_id uuid;
  result json;
BEGIN
  -- Get the bracket
  SELECT * INTO bracket_record FROM public.brackets WHERE id = bracket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bracket not found';
  END IF;
  
  -- Determine winner (opposite track of forfeit)
  winner_track := CASE WHEN forfeiting_track = 1 THEN 2 ELSE 1 END;
  winner_racer_id := CASE 
    WHEN winner_track = 1 THEN bracket_record.track1_racer_id 
    ELSE bracket_record.track2_racer_id 
  END;
  
  -- Update bracket as forfeit
  UPDATE public.brackets 
  SET 
    is_forfeit = true,
    forfeit_reason = forfeit_reason,
    winner_track = winner_track,
    winner_racer_id = winner_racer_id
  WHERE id = bracket_id;
  
  -- Return result
  result := json_build_object(
    'success', true,
    'winner_track', winner_track,
    'winner_racer_id', winner_racer_id,
    'forfeit_reason', forfeit_reason
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."handle_bracket_forfeit"("bracket_id" "uuid", "forfeiting_track" integer, "forfeit_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_bracket_forfeit"("bracket_id" "uuid", "forfeiting_track" integer, "forfeit_reason" "text") IS 'Handles forfeit scenario and determines winner automatically';



CREATE OR REPLACE FUNCTION "public"."handle_racer_withdrawal_heats"("target_race_id" "uuid", "target_racer_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  scheduled_heats_count integer := 0;
  in_progress_heats_count integer := 0;
  completed_heats_count integer := 0;
  removed_from_scheduled integer := 0;
BEGIN
  -- Count heats by status
  SELECT COUNT(*) INTO scheduled_heats_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'scheduled';
    
  SELECT COUNT(*) INTO in_progress_heats_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'in_progress';
    
  SELECT COUNT(*) INTO completed_heats_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'completed';

  -- Remove racer from scheduled heats only (preserve completed results)
  DELETE FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'scheduled';
  
  GET DIAGNOSTICS removed_from_scheduled = ROW_COUNT;

  -- Leave in_progress heats alone (let them finish naturally)
  -- Leave completed heats alone (preserve results for current standings)
  
  -- Return summary of actions taken
  RETURN json_build_object(
    'scheduled_heats_removed', removed_from_scheduled,
    'in_progress_heats_continuing', in_progress_heats_count,
    'completed_heats_preserved', completed_heats_count,
    'note', 'Completed results remain in standings, only future heats affected'
  );
END;
$$;


ALTER FUNCTION "public"."handle_racer_withdrawal_heats"("target_race_id" "uuid", "target_racer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_race_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
      RETURN FALSE;
    END IF;

    -- Check user metadata for admin status
    RETURN (
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
      OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );
  END;
  $$;


ALTER FUNCTION "public"."is_race_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."preview_withdrawal_heat_impact"("target_race_id" "uuid", "target_racer_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  scheduled_count integer := 0;
  in_progress_count integer := 0;
  completed_count integer := 0;
BEGIN
  -- Count heats by status
  SELECT COUNT(*) INTO scheduled_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'scheduled';
    
  SELECT COUNT(*) INTO in_progress_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'in_progress';
    
  SELECT COUNT(*) INTO completed_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'completed';

  RETURN json_build_object(
    'scheduled_heats_to_remove', scheduled_count,
    'in_progress_heats_to_continue', in_progress_count,
    'completed_heats_to_preserve', completed_count,
    'keeps_current_standings', true,
    'excluded_from_future_only', true
  );
END;
$$;


ALTER FUNCTION "public"."preview_withdrawal_heat_impact"("target_race_id" "uuid", "target_racer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_qualifying_mode"("mode" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.races 
    SET qualifying_mode = mode
    WHERE active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active race found';
    END IF;
    
    RAISE NOTICE 'Qualifying mode set to: %', mode;
END;
$$;


ALTER FUNCTION "public"."set_qualifying_mode"("mode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_heat"("heat_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."start_heat"("heat_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_challonge_tournaments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_challonge_tournaments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_racer_slug_on_name_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if old.name != new.name and (new.slug = old.slug or new.slug is null) then
    new.slug := generate_racer_slug(new.name, new.id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."update_racer_slug_on_name_change"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."races" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "image_url" "text",
    "active" boolean DEFAULT false,
    "qualifying_mode" "text" DEFAULT 'auto'::"text",
    "slug" "text" NOT NULL,
    "race_datetime" timestamp with time zone,
    "end_time" timestamp with time zone,
    "description" "text",
    CONSTRAINT "races_qualifying_mode_check" CHECK (("qualifying_mode" = ANY (ARRAY['auto'::"text", 'manual'::"text", 'brackets'::"text"])))
);

ALTER TABLE ONLY "public"."races" REPLICA IDENTITY FULL;


ALTER TABLE "public"."races" OWNER TO "postgres";


COMMENT ON COLUMN "public"."races"."qualifying_mode" IS 'Controls heat generation: auto=generate after each completion, manual=admin controlled, brackets=qualifying finished';



COMMENT ON COLUMN "public"."races"."race_datetime" IS 'Date and time when the race takes place';



COMMENT ON COLUMN "public"."races"."end_time" IS 'Optional end time for the race event';



COMMENT ON COLUMN "public"."races"."description" IS 'HTML description of the race event';



CREATE OR REPLACE VIEW "public"."active_race" AS
 SELECT "races"."id",
    "races"."created_at",
    "races"."updated_at",
    "races"."name",
    "races"."image_url",
    "races"."active",
    "races"."qualifying_mode",
    "races"."slug",
    "races"."race_datetime"
   FROM "public"."races"
  WHERE ("races"."active" = true);


ALTER TABLE "public"."active_race" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."award_definitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "voteable" boolean DEFAULT false,
    "active" boolean DEFAULT true
);


ALTER TABLE "public"."award_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."award_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "award_definition_id" "uuid" NOT NULL,
    "race_id" "uuid" NOT NULL,
    "racer_id" "uuid" NOT NULL,
    "voter_id" "uuid" NOT NULL
);


ALTER TABLE "public"."award_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."racers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "weight" numeric,
    "team_members" "text",
    "user_id" "uuid" NOT NULL,
    "image_url" "text",
    "photos" "text"[],
    "videos" "text"[],
    "racer_number" integer NOT NULL,
    "slug" "text" NOT NULL
);

ALTER TABLE ONLY "public"."racers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."racers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."award_vote_counts" AS
 SELECT "av"."award_definition_id",
    "av"."race_id",
    "av"."racer_id",
    "count"(*) AS "vote_count",
    "r"."name" AS "racer_name",
    "ad"."name" AS "award_name"
   FROM (("public"."award_votes" "av"
     JOIN "public"."racers" "r" ON (("av"."racer_id" = "r"."id")))
     JOIN "public"."award_definitions" "ad" ON (("av"."award_definition_id" = "ad"."id")))
  GROUP BY "av"."award_definition_id", "av"."race_id", "av"."racer_id", "r"."name", "ad"."name";


ALTER TABLE "public"."award_vote_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."awards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "award_definition_id" "uuid" NOT NULL,
    "racer_id" "uuid" NOT NULL,
    "race_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "notes" "text"
);


ALTER TABLE "public"."awards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brackets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "race_id" "uuid" NOT NULL,
    "track1_racer_id" "uuid",
    "track2_racer_id" "uuid",
    "track1_time" numeric,
    "track2_time" numeric,
    "bracket_type" "text",
    "bracket_group" "text" DEFAULT 'winner'::"text",
    "round_number" integer DEFAULT 1,
    "parent_bracket_winner_id" "uuid",
    "parent_bracket_loser_id" "uuid",
    "is_forfeit" boolean DEFAULT false,
    "forfeit_reason" "text",
    "winner_track" integer,
    "winner_racer_id" "uuid",
    "match_number" integer,
    "challonge_match_id" "text",
    "challonge_round" integer,
    "challonge_suggested_play_order" integer,
    CONSTRAINT "brackets_bracket_group_check" CHECK (("bracket_group" = ANY (ARRAY['winner'::"text", 'loser'::"text", 'final'::"text"]))),
    CONSTRAINT "brackets_bracket_type_check" CHECK (("bracket_type" = ANY (ARRAY['double_elimination'::"text", 'single_elimination'::"text"]))),
    CONSTRAINT "brackets_winner_track_check" CHECK (("winner_track" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."brackets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."brackets"."bracket_group" IS 'Double elimination group: winner, loser, or final bracket';



COMMENT ON COLUMN "public"."brackets"."round_number" IS 'Round number within the bracket group';



COMMENT ON COLUMN "public"."brackets"."parent_bracket_winner_id" IS 'Bracket that feeds winner to this bracket';



COMMENT ON COLUMN "public"."brackets"."parent_bracket_loser_id" IS 'Bracket that feeds loser to this bracket';



COMMENT ON COLUMN "public"."brackets"."is_forfeit" IS 'True if this bracket was decided by forfeit';



COMMENT ON COLUMN "public"."brackets"."forfeit_reason" IS 'Reason for forfeit if applicable';



COMMENT ON COLUMN "public"."brackets"."winner_track" IS 'Which track won: 1 or 2';



COMMENT ON COLUMN "public"."brackets"."winner_racer_id" IS 'ID of the winning racer';



COMMENT ON COLUMN "public"."brackets"."match_number" IS 'Match number within the bracket group and round for display purposes';



COMMENT ON COLUMN "public"."brackets"."challonge_match_id" IS 'Challonge match ID for sync mapping';



COMMENT ON COLUMN "public"."brackets"."challonge_round" IS 'Challonge round number (negative for elimination, positive for winners)';



COMMENT ON COLUMN "public"."brackets"."challonge_suggested_play_order" IS 'Challonge suggested play order for match sequencing';



CREATE TABLE IF NOT EXISTS "public"."challonge_match_sync" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bracket_id" "uuid" NOT NULL,
    "challonge_tournament_id" "uuid" NOT NULL,
    "challonge_match_id" "text" NOT NULL,
    "winner_participant_id" "text" NOT NULL,
    "scores_csv" "text" NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challonge_match_sync" OWNER TO "postgres";


COMMENT ON TABLE "public"."challonge_match_sync" IS 'Tracks synchronization between internal bracket results and Challonge tournament matches';



COMMENT ON COLUMN "public"."challonge_match_sync"."bracket_id" IS 'Reference to the internal bracket that was synced';



COMMENT ON COLUMN "public"."challonge_match_sync"."challonge_tournament_id" IS 'Reference to the Challonge tournament';



COMMENT ON COLUMN "public"."challonge_match_sync"."challonge_match_id" IS 'Challonge match ID (from their API)';



COMMENT ON COLUMN "public"."challonge_match_sync"."winner_participant_id" IS 'Challonge participant ID of the winner';



COMMENT ON COLUMN "public"."challonge_match_sync"."scores_csv" IS 'Match scores in CSV format (e.g., "12.345-13.678")';



COMMENT ON COLUMN "public"."challonge_match_sync"."synced_at" IS 'When the sync occurred';



CREATE TABLE IF NOT EXISTS "public"."challonge_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challonge_tournament_id" "uuid" NOT NULL,
    "racer_id" "uuid" NOT NULL,
    "challonge_participant_id" character varying NOT NULL,
    "seed_position" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challonge_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challonge_tournaments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "race_id" "uuid" NOT NULL,
    "challonge_tournament_id" character varying NOT NULL,
    "challonge_url" character varying NOT NULL,
    "tournament_type" character varying DEFAULT 'double_elimination'::character varying,
    "status" character varying DEFAULT 'pending'::character varying,
    "embed_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challonge_tournaments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "challonge_tournaments_tournament_type_check" CHECK ((("tournament_type")::"text" = ANY ((ARRAY['single_elimination'::character varying, 'double_elimination'::character varying])::"text"[])))
);


ALTER TABLE "public"."challonge_tournaments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "racer_id" "uuid" NOT NULL,
    "race_id" "uuid" NOT NULL,
    "time" timestamp with time zone NOT NULL
);

ALTER TABLE ONLY "public"."checkins" REPLICA IDENTITY FULL;


ALTER TABLE "public"."checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qualifiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone,
    "racer_id" "uuid" NOT NULL,
    "race_id" "uuid" NOT NULL,
    "time" numeric NOT NULL,
    "heat_number" integer,
    "track_number" integer,
    "status" "text" DEFAULT 'scheduled'::"text",
    "scheduled_order" integer,
    "completed_at" timestamp with time zone,
    CONSTRAINT "qualifiers_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "qualifiers_track_number_check" CHECK (("track_number" = ANY (ARRAY[1, 2])))
);

ALTER TABLE ONLY "public"."qualifiers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."qualifiers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."current_heat" AS
 SELECT "q"."id",
    "q"."created_at",
    "q"."racer_id",
    "q"."race_id",
    "q"."time",
    "q"."heat_number",
    "q"."track_number",
    "q"."status",
    "q"."scheduled_order",
    "r1"."name" AS "racer1_name",
    "r1"."racer_number" AS "racer1_number",
    "r1"."image_url" AS "racer1_image_url",
    "r2"."name" AS "racer2_name",
    "r2"."racer_number" AS "racer2_number",
    "r2"."image_url" AS "racer2_image_url"
   FROM (("public"."qualifiers" "q"
     LEFT JOIN "public"."racers" "r1" ON ((("r1"."id" = "q"."racer_id") AND ("q"."track_number" = 1))))
     LEFT JOIN "public"."racers" "r2" ON (("r2"."id" = ( SELECT "q2"."racer_id"
           FROM "public"."qualifiers" "q2"
          WHERE (("q2"."race_id" = "q"."race_id") AND ("q2"."heat_number" = "q"."heat_number") AND ("q2"."track_number" = 2))
         LIMIT 1))))
  WHERE (("q"."race_id" = ( SELECT "races"."id"
           FROM "public"."races"
          WHERE ("races"."active" = true)
         LIMIT 1)) AND ("q"."status" = 'in_progress'::"text") AND ("q"."track_number" = 1));


ALTER TABLE "public"."current_heat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."general_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "race_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "featured" boolean DEFAULT false,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "credit" "text",
    CONSTRAINT "general_photos_category_check" CHECK (("category" = ANY (ARRAY['crowd'::"text", 'setup'::"text", 'awards'::"text", 'venue'::"text", 'action'::"text", 'general'::"text"]))),
    CONSTRAINT "general_photos_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."general_photos" OWNER TO "postgres";


COMMENT ON TABLE "public"."general_photos" IS 'Stores general race photos uploaded by users (non-racer-specific photos like crowd shots, setup photos, etc.)';



COMMENT ON COLUMN "public"."general_photos"."category" IS 'Category of photo: crowd, setup, awards, venue, action, general';



COMMENT ON COLUMN "public"."general_photos"."race_id" IS 'Associated race (optional - can be NULL for general photos)';



COMMENT ON COLUMN "public"."general_photos"."user_id" IS 'User who uploaded the photo';



COMMENT ON COLUMN "public"."general_photos"."status" IS 'Approval status: pending, approved, rejected';



COMMENT ON COLUMN "public"."general_photos"."featured" IS 'Whether photo is featured on homepage/galleries';



COMMENT ON COLUMN "public"."general_photos"."credit" IS 'Optional photographer credit for the photo';



CREATE TABLE IF NOT EXISTS "public"."race_withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "race_id" "uuid" NOT NULL,
    "racer_id" "uuid" NOT NULL,
    "withdrawn_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "withdrawn_by" "uuid",
    "reason" "text"
);


ALTER TABLE "public"."race_withdrawals" OWNER TO "postgres";


COMMENT ON TABLE "public"."race_withdrawals" IS 'Tracks which racers have been withdrawn from specific races, excluding them from qualifiers and brackets for that race only';



CREATE SEQUENCE IF NOT EXISTS "public"."racers_racer_number_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."racers_racer_number_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."racers_racer_number_seq" OWNED BY "public"."racers"."racer_number";



CREATE TABLE IF NOT EXISTS "public"."sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "website_url" "text",
    "logo_url" "text",
    "sponsorship_amount" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."sponsors" OWNER TO "postgres";


ALTER TABLE ONLY "public"."racers" ALTER COLUMN "racer_number" SET DEFAULT "nextval"('"public"."racers_racer_number_seq"'::"regclass");



ALTER TABLE ONLY "public"."award_definitions"
    ADD CONSTRAINT "award_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."award_votes"
    ADD CONSTRAINT "award_votes_award_definition_id_race_id_voter_id_key" UNIQUE ("award_definition_id", "race_id", "voter_id");



ALTER TABLE ONLY "public"."award_votes"
    ADD CONSTRAINT "award_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."awards"
    ADD CONSTRAINT "awards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challonge_match_sync"
    ADD CONSTRAINT "challonge_match_sync_bracket_id_key" UNIQUE ("bracket_id");



ALTER TABLE ONLY "public"."challonge_match_sync"
    ADD CONSTRAINT "challonge_match_sync_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challonge_participants"
    ADD CONSTRAINT "challonge_participants_challonge_tournament_id_racer_id_key" UNIQUE ("challonge_tournament_id", "racer_id");



ALTER TABLE ONLY "public"."challonge_participants"
    ADD CONSTRAINT "challonge_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challonge_tournaments"
    ADD CONSTRAINT "challonge_tournaments_challonge_tournament_id_key" UNIQUE ("challonge_tournament_id");



ALTER TABLE ONLY "public"."challonge_tournaments"
    ADD CONSTRAINT "challonge_tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."general_photos"
    ADD CONSTRAINT "general_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qualifiers"
    ADD CONSTRAINT "qualifiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."race_withdrawals"
    ADD CONSTRAINT "race_withdrawals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."race_withdrawals"
    ADD CONSTRAINT "race_withdrawals_race_id_racer_id_key" UNIQUE ("race_id", "racer_id");



ALTER TABLE ONLY "public"."racers"
    ADD CONSTRAINT "racers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."racers"
    ADD CONSTRAINT "racers_racer_number_key" UNIQUE ("racer_number");



ALTER TABLE ONLY "public"."racers"
    ADD CONSTRAINT "racers_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_brackets_bracket_group" ON "public"."brackets" USING "btree" ("bracket_group");



CREATE INDEX "idx_brackets_challonge_match" ON "public"."brackets" USING "btree" ("challonge_match_id") WHERE ("challonge_match_id" IS NOT NULL);



CREATE INDEX "idx_brackets_group_round_match" ON "public"."brackets" USING "btree" ("race_id", "bracket_group", "round_number", "match_number");



CREATE INDEX "idx_brackets_parent_loser" ON "public"."brackets" USING "btree" ("parent_bracket_loser_id");



CREATE INDEX "idx_brackets_parent_winner" ON "public"."brackets" USING "btree" ("parent_bracket_winner_id");



CREATE INDEX "idx_brackets_round_number" ON "public"."brackets" USING "btree" ("round_number");



CREATE INDEX "idx_brackets_winner_racer" ON "public"."brackets" USING "btree" ("winner_racer_id");



CREATE INDEX "idx_challonge_match_sync_bracket" ON "public"."challonge_match_sync" USING "btree" ("bracket_id");



CREATE INDEX "idx_challonge_match_sync_match" ON "public"."challonge_match_sync" USING "btree" ("challonge_match_id");



CREATE INDEX "idx_challonge_match_sync_tournament" ON "public"."challonge_match_sync" USING "btree" ("challonge_tournament_id");



CREATE INDEX "idx_challonge_participants_racer_id" ON "public"."challonge_participants" USING "btree" ("racer_id");



CREATE INDEX "idx_challonge_participants_tournament_id" ON "public"."challonge_participants" USING "btree" ("challonge_tournament_id");



CREATE INDEX "idx_challonge_tournaments_race_id" ON "public"."challonge_tournaments" USING "btree" ("race_id");



CREATE INDEX "idx_challonge_tournaments_status" ON "public"."challonge_tournaments" USING "btree" ("status");



CREATE INDEX "idx_general_photos_category" ON "public"."general_photos" USING "btree" ("category");



CREATE INDEX "idx_general_photos_featured" ON "public"."general_photos" USING "btree" ("featured");



CREATE INDEX "idx_general_photos_race_id" ON "public"."general_photos" USING "btree" ("race_id");



CREATE INDEX "idx_general_photos_status" ON "public"."general_photos" USING "btree" ("status");



CREATE INDEX "idx_general_photos_uploaded_at" ON "public"."general_photos" USING "btree" ("uploaded_at" DESC);



CREATE INDEX "idx_general_photos_user_id" ON "public"."general_photos" USING "btree" ("user_id");



CREATE INDEX "idx_qualifiers_race_heat" ON "public"."qualifiers" USING "btree" ("race_id", "heat_number", "scheduled_order");



CREATE INDEX "idx_qualifiers_race_status" ON "public"."qualifiers" USING "btree" ("race_id", "status");



CREATE INDEX "idx_race_withdrawals_race_id" ON "public"."race_withdrawals" USING "btree" ("race_id");



CREATE INDEX "idx_race_withdrawals_racer_id" ON "public"."race_withdrawals" USING "btree" ("racer_id");



CREATE INDEX "idx_racers_slug" ON "public"."racers" USING "btree" ("slug");



CREATE INDEX "idx_races_slug" ON "public"."races" USING "btree" ("slug");



CREATE INDEX "idx_sponsors_active" ON "public"."sponsors" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_sponsors_display_order" ON "public"."sponsors" USING "btree" ("display_order", "created_at" DESC);



CREATE OR REPLACE TRIGGER "ensure_single_active_race_insert_trigger" BEFORE INSERT ON "public"."races" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_active_race_insert"();



CREATE OR REPLACE TRIGGER "ensure_single_active_race_trigger" BEFORE UPDATE OF "active" ON "public"."races" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_active_race"();



CREATE OR REPLACE TRIGGER "handle_award_definitions_updated_at" BEFORE UPDATE ON "public"."award_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_awards_updated_at" BEFORE UPDATE ON "public"."awards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_racers_updated_at" BEFORE UPDATE ON "public"."racers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_races_updated_at" BEFORE UPDATE ON "public"."races" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "racer_slug_trigger" BEFORE INSERT ON "public"."racers" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_racer_slug"();



CREATE OR REPLACE TRIGGER "racer_slug_update_trigger" BEFORE UPDATE ON "public"."racers" FOR EACH ROW WHEN (("old"."name" IS DISTINCT FROM "new"."name")) EXECUTE FUNCTION "public"."update_racer_slug_on_name_change"();



CREATE OR REPLACE TRIGGER "races_slug_trigger" BEFORE INSERT OR UPDATE ON "public"."races" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_race_slug"();



CREATE OR REPLACE TRIGGER "update_challonge_tournaments_updated_at" BEFORE UPDATE ON "public"."challonge_tournaments" FOR EACH ROW EXECUTE FUNCTION "public"."update_challonge_tournaments_updated_at"();



CREATE OR REPLACE TRIGGER "update_general_photos_updated_at" BEFORE UPDATE ON "public"."general_photos" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."award_votes"
    ADD CONSTRAINT "award_votes_award_definition_id_fkey" FOREIGN KEY ("award_definition_id") REFERENCES "public"."award_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."award_votes"
    ADD CONSTRAINT "award_votes_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."award_votes"
    ADD CONSTRAINT "award_votes_racer_id_fkey" FOREIGN KEY ("racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."award_votes"
    ADD CONSTRAINT "award_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."awards"
    ADD CONSTRAINT "awards_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."awards"
    ADD CONSTRAINT "awards_award_definition_id_fkey" FOREIGN KEY ("award_definition_id") REFERENCES "public"."award_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."awards"
    ADD CONSTRAINT "awards_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."awards"
    ADD CONSTRAINT "awards_racer_id_fkey" FOREIGN KEY ("racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_parent_bracket_loser_id_fkey" FOREIGN KEY ("parent_bracket_loser_id") REFERENCES "public"."brackets"("id");



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_parent_bracket_winner_id_fkey" FOREIGN KEY ("parent_bracket_winner_id") REFERENCES "public"."brackets"("id");



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_track1_racer_id_fkey" FOREIGN KEY ("track1_racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_track2_racer_id_fkey" FOREIGN KEY ("track2_racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_winner_racer_id_fkey" FOREIGN KEY ("winner_racer_id") REFERENCES "public"."racers"("id");



ALTER TABLE ONLY "public"."challonge_match_sync"
    ADD CONSTRAINT "challonge_match_sync_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "public"."brackets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challonge_match_sync"
    ADD CONSTRAINT "challonge_match_sync_challonge_tournament_id_fkey" FOREIGN KEY ("challonge_tournament_id") REFERENCES "public"."challonge_tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challonge_participants"
    ADD CONSTRAINT "challonge_participants_challonge_tournament_id_fkey" FOREIGN KEY ("challonge_tournament_id") REFERENCES "public"."challonge_tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challonge_participants"
    ADD CONSTRAINT "challonge_participants_racer_id_fkey" FOREIGN KEY ("racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challonge_tournaments"
    ADD CONSTRAINT "challonge_tournaments_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_racer_id_fkey" FOREIGN KEY ("racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."general_photos"
    ADD CONSTRAINT "general_photos_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."general_photos"
    ADD CONSTRAINT "general_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."qualifiers"
    ADD CONSTRAINT "qualifiers_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."qualifiers"
    ADD CONSTRAINT "qualifiers_racer_id_fkey" FOREIGN KEY ("racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."race_withdrawals"
    ADD CONSTRAINT "race_withdrawals_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."race_withdrawals"
    ADD CONSTRAINT "race_withdrawals_racer_id_fkey" FOREIGN KEY ("racer_id") REFERENCES "public"."racers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."race_withdrawals"
    ADD CONSTRAINT "race_withdrawals_withdrawn_by_fkey" FOREIGN KEY ("withdrawn_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."racers"
    ADD CONSTRAINT "racers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage award definitions" ON "public"."award_definitions" TO "authenticated" USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text"))) WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Admins can manage challonge participants" ON "public"."challonge_participants" USING ((("auth"."uid"() IS NOT NULL) AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"json" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"json" ->> 'isRaceAdmin'::"text") = 'true'::"text"))));



CREATE POLICY "Admins can manage challonge tournaments" ON "public"."challonge_tournaments" USING ((("auth"."uid"() IS NOT NULL) AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"json" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"json" ->> 'isRaceAdmin'::"text") = 'true'::"text"))));



CREATE POLICY "Admins can manage sponsors" ON "public"."sponsors" USING ((("auth"."role"() = 'authenticated'::"text") AND "public"."is_race_admin"())) WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND "public"."is_race_admin"()));



CREATE POLICY "Admins can view challonge match sync records" ON "public"."challonge_match_sync" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Allow all reads on qualifiers" ON "public"."qualifiers" FOR SELECT USING (true);



CREATE POLICY "Anyone can view brackets" ON "public"."brackets" FOR SELECT USING (true);



CREATE POLICY "Anyone can view checkins" ON "public"."checkins" FOR SELECT USING (true);



CREATE POLICY "Anyone can view qualifiers" ON "public"."qualifiers" FOR SELECT USING (true);



CREATE POLICY "Anyone can view racers" ON "public"."racers" FOR SELECT USING (true);



CREATE POLICY "Anyone can view races" ON "public"."races" FOR SELECT USING (true);



CREATE POLICY "Authenticated can view all award definitions" ON "public"."award_definitions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated can view racers" ON "public"."racers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can vote" ON "public"."award_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "voter_id"));



CREATE POLICY "Everyone can view award definitions" ON "public"."award_definitions" FOR SELECT USING (("active" = true));



CREATE POLICY "Everyone can view awards" ON "public"."awards" FOR SELECT USING (true);



CREATE POLICY "Everyone can view brackets" ON "public"."brackets" FOR SELECT USING (true);



CREATE POLICY "Everyone can view checkins" ON "public"."checkins" FOR SELECT USING (true);



CREATE POLICY "Everyone can view qualifiers" ON "public"."qualifiers" FOR SELECT USING (true);



CREATE POLICY "Everyone can view vote counts" ON "public"."award_votes" FOR SELECT USING (true);



CREATE POLICY "Public and timing system can read races" ON "public"."races" FOR SELECT USING (true);



CREATE POLICY "Public can view active award definitions" ON "public"."award_definitions" FOR SELECT USING (("active" = true));



CREATE POLICY "Public can view active sponsors" ON "public"."sponsors" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view challonge participants" ON "public"."challonge_participants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."challonge_tournaments" "ct"
     JOIN "public"."races" "r" ON (("r"."id" = "ct"."race_id")))
  WHERE (("ct"."id" = "challonge_participants"."challonge_tournament_id") AND ("r"."active" = true)))));



CREATE POLICY "Public can view challonge tournaments" ON "public"."challonge_tournaments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."races"
  WHERE (("races"."id" = "challonge_tournaments"."race_id") AND ("races"."active" = true)))));



CREATE POLICY "Public can view racers" ON "public"."racers" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "public"."racers" FOR SELECT USING (true);



CREATE POLICY "Race admins and racer owners can manage withdrawals" ON "public"."race_withdrawals" USING (((("auth"."role"() = 'authenticated'::"text") AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text"))) OR ("auth"."uid"() IN ( SELECT "racers"."user_id"
   FROM "public"."racers"
  WHERE ("racers"."id" = "race_withdrawals"."racer_id")))));



CREATE POLICY "Race admins can delete all photos" ON "public"."general_photos" FOR DELETE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can delete award definitions" ON "public"."award_definitions" FOR DELETE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can delete awards" ON "public"."awards" FOR DELETE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can delete brackets" ON "public"."brackets" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text"))));



CREATE POLICY "Race admins can delete checkins" ON "public"."checkins" FOR DELETE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can delete qualifiers" ON "public"."qualifiers" FOR DELETE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can delete races" ON "public"."races" FOR DELETE USING (((("auth"."jwt"() ->> 'role'::"text") = 'race_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'race_admin'::"text")));



CREATE POLICY "Race admins can insert award definitions" ON "public"."award_definitions" FOR INSERT WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can insert awards" ON "public"."awards" FOR INSERT WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can insert brackets" ON "public"."brackets" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text"))));



CREATE POLICY "Race admins can insert checkins" ON "public"."checkins" FOR INSERT WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can insert qualifiers" ON "public"."qualifiers" FOR INSERT WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can insert races" ON "public"."races" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'race_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'race_admin'::"text")));



CREATE POLICY "Race admins can manage races" ON "public"."races" USING ((("auth"."role"() = 'authenticated'::"text") AND "public"."is_race_admin"())) WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND "public"."is_race_admin"()));



CREATE POLICY "Race admins can update all photos" ON "public"."general_photos" FOR UPDATE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can update award definitions" ON "public"."award_definitions" FOR UPDATE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can update awards" ON "public"."awards" FOR UPDATE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can update brackets" ON "public"."brackets" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text")))) WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text"))));



CREATE POLICY "Race admins can update checkins" ON "public"."checkins" FOR UPDATE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can update qualifiers" ON "public"."qualifiers" FOR UPDATE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Race admins can update race active status" ON "public"."races" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = 'race_admin'::"text") OR ((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'race_admin'::"text")));



CREATE POLICY "Race admins can view all photos" ON "public"."general_photos" FOR SELECT USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "System can manage challonge match sync records" ON "public"."challonge_match_sync" USING (true);



CREATE POLICY "Timing system can delete qualifiers" ON "public"."qualifiers" FOR DELETE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'timing_system'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Timing system can insert qualifiers" ON "public"."qualifiers" FOR INSERT WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'timing_system'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Timing system can read racers" ON "public"."racers" FOR SELECT USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'timing_system'::"text") OR ("auth"."uid"() = "user_id") OR true));



CREATE POLICY "Timing system can update qualifiers" ON "public"."qualifiers" FOR UPDATE USING (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'timing_system'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text"))) WITH CHECK (((((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'timing_system'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Users can create own racers" ON "public"."racers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own photos" ON "public"."general_photos" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own racers or admins can delete any" ON "public"."racers" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Users can delete their own racers" ON "public"."racers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own votes" ON "public"."award_votes" FOR DELETE USING (("auth"."uid"() = "voter_id"));



CREATE POLICY "Users can insert own photos" ON "public"."general_photos" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own racers" ON "public"."racers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own photos" ON "public"."general_photos" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own racers or admins can update any" ON "public"."racers" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text"))) WITH CHECK ((("auth"."uid"() = "user_id") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isRaceAdmin'::"text") = 'true'::"text") OR (((("auth"."jwt"() ->> 'user_metadata'::"text"))::"jsonb" ->> 'isAdmin'::"text") = 'true'::"text")));



CREATE POLICY "Users can update their own racers" ON "public"."racers" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own votes" ON "public"."award_votes" FOR UPDATE USING (("auth"."uid"() = "voter_id")) WITH CHECK (("auth"."uid"() = "voter_id"));



CREATE POLICY "Users can view own photos and approved photos" ON "public"."general_photos" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("status" = 'approved'::"text")));



CREATE POLICY "Users can view their own votes" ON "public"."award_votes" FOR SELECT USING (("auth"."uid"() = "voter_id"));



CREATE POLICY "Users can view withdrawals" ON "public"."race_withdrawals" FOR SELECT USING (true);



ALTER TABLE "public"."award_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."award_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."awards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brackets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challonge_match_sync" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challonge_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challonge_tournaments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."general_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qualifiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."race_withdrawals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."racers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."races" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_qualifier_heats"("target_race_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_qualifier_heats"("target_race_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_qualifier_heats"("target_race_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_race_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_race_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_race_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_racer_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_racer_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_racer_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_withdrawal_permission"("user_id" "uuid", "target_race_id" "uuid", "target_racer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_withdrawal_permission"("user_id" "uuid", "target_race_id" "uuid", "target_racer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_withdrawal_permission"("user_id" "uuid", "target_race_id" "uuid", "target_racer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_heat"("heat_num" integer, "track1_time" numeric, "track2_time" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_heat"("heat_num" integer, "track1_time" numeric, "track2_time" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_heat"("heat_num" integer, "track1_time" numeric, "track2_time" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_active_race"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_active_race"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_active_race"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_active_race_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_active_race_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_active_race_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_double_elimination_structure"("race_id" "uuid", "racer_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_double_elimination_structure"("race_id" "uuid", "racer_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_double_elimination_structure"("race_id" "uuid", "racer_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_qualifier_heats"("target_race_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_qualifier_heats"("target_race_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_qualifier_heats"("target_race_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_racer_slug"("racer_name" "text", "racer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_racer_slug"("racer_name" "text", "racer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_racer_slug"("racer_name" "text", "racer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_slug"("base_slug" "text", "race_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("base_slug" "text", "race_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("base_slug" "text", "race_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_heats"("heat_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_heats"("heat_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_heats"("heat_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_qualifying_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_qualifying_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_qualifying_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_bracket_forfeit"("bracket_id" "uuid", "forfeiting_track" integer, "forfeit_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_bracket_forfeit"("bracket_id" "uuid", "forfeiting_track" integer, "forfeit_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_bracket_forfeit"("bracket_id" "uuid", "forfeiting_track" integer, "forfeit_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_racer_withdrawal_heats"("target_race_id" "uuid", "target_racer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_racer_withdrawal_heats"("target_race_id" "uuid", "target_racer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_racer_withdrawal_heats"("target_race_id" "uuid", "target_racer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_race_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_race_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_race_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."preview_withdrawal_heat_impact"("target_race_id" "uuid", "target_racer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."preview_withdrawal_heat_impact"("target_race_id" "uuid", "target_racer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."preview_withdrawal_heat_impact"("target_race_id" "uuid", "target_racer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_all_qualifier_heats"("target_race_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_qualifying_mode"("mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_qualifying_mode"("mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_qualifying_mode"("mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_heat"("heat_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."start_heat"("heat_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_heat"("heat_num" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_challonge_tournaments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_challonge_tournaments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_challonge_tournaments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_racer_slug_on_name_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_racer_slug_on_name_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_racer_slug_on_name_change"() TO "service_role";



GRANT ALL ON TABLE "public"."races" TO "anon";
GRANT ALL ON TABLE "public"."races" TO "authenticated";
GRANT ALL ON TABLE "public"."races" TO "service_role";



GRANT ALL ON TABLE "public"."active_race" TO "anon";
GRANT ALL ON TABLE "public"."active_race" TO "authenticated";
GRANT ALL ON TABLE "public"."active_race" TO "service_role";



GRANT ALL ON TABLE "public"."award_definitions" TO "anon";
GRANT ALL ON TABLE "public"."award_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."award_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."award_votes" TO "anon";
GRANT ALL ON TABLE "public"."award_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."award_votes" TO "service_role";



GRANT ALL ON TABLE "public"."racers" TO "anon";
GRANT ALL ON TABLE "public"."racers" TO "authenticated";
GRANT ALL ON TABLE "public"."racers" TO "service_role";



GRANT ALL ON TABLE "public"."award_vote_counts" TO "anon";
GRANT ALL ON TABLE "public"."award_vote_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."award_vote_counts" TO "service_role";



GRANT ALL ON TABLE "public"."awards" TO "anon";
GRANT ALL ON TABLE "public"."awards" TO "authenticated";
GRANT ALL ON TABLE "public"."awards" TO "service_role";



GRANT ALL ON TABLE "public"."brackets" TO "anon";
GRANT ALL ON TABLE "public"."brackets" TO "authenticated";
GRANT ALL ON TABLE "public"."brackets" TO "service_role";



GRANT ALL ON TABLE "public"."challonge_match_sync" TO "anon";
GRANT ALL ON TABLE "public"."challonge_match_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."challonge_match_sync" TO "service_role";



GRANT ALL ON TABLE "public"."challonge_participants" TO "anon";
GRANT ALL ON TABLE "public"."challonge_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."challonge_participants" TO "service_role";



GRANT ALL ON TABLE "public"."challonge_tournaments" TO "anon";
GRANT ALL ON TABLE "public"."challonge_tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."challonge_tournaments" TO "service_role";



GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";



GRANT ALL ON TABLE "public"."qualifiers" TO "anon";
GRANT ALL ON TABLE "public"."qualifiers" TO "authenticated";
GRANT ALL ON TABLE "public"."qualifiers" TO "service_role";



GRANT ALL ON TABLE "public"."current_heat" TO "anon";
GRANT ALL ON TABLE "public"."current_heat" TO "authenticated";
GRANT ALL ON TABLE "public"."current_heat" TO "service_role";



GRANT ALL ON TABLE "public"."general_photos" TO "anon";
GRANT ALL ON TABLE "public"."general_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."general_photos" TO "service_role";



GRANT ALL ON TABLE "public"."race_withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."race_withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."race_withdrawals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."racers_racer_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."racers_racer_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."racers_racer_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sponsors" TO "anon";
GRANT ALL ON TABLE "public"."sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsors" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
