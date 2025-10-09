-- Seed data for testing the brick race application
-- Uses conditional logic to insert or update existing racers by name

DO $$
DECLARE
  test_user_id uuid;
  racer_data record;
  existing_racer_id uuid;
BEGIN
  -- Try to find an existing user, or create a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    -- No users exist, create a test user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '550e8400-e29b-41d4-a716-446655440000',
      'authenticated',
      'authenticated',
      'seeduser@brickrace.test',
      '$2a$10$dummy.encrypted.password.hash.for.seed.user.only',
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"isRaceAdmin": true}',
      '',
      '',
      '',
      ''
    );
    test_user_id := '550e8400-e29b-41d4-a716-446655440000';
    RAISE NOTICE 'Created test user for seed data';
  ELSE
    RAISE NOTICE 'Using existing user: %', test_user_id;
  END IF;
  -- Array of racer data to insert/update
  FOR racer_data IN 
    SELECT * FROM (VALUES
      ('Lightning McQueen', 5.0, 'Radiator Springs Racing'),
      ('Speed Racer', 4.8, 'Go Team Go'),
      ('Turbo', 4.9, 'Snail Power'),
      ('The Flash', 4.7, 'Central City Speedsters'),
      ('Sonic', 4.6, 'Blue Blur Racing'),
      ('Road Runner', 4.5, 'ACME Racing'),
      ('Dash Parr', 4.4, 'The Incredibles'),
      ('Quicksilver', 4.3, 'X-Men Racing'),
      ('Speedy Gonzales', 4.2, 'Looney Tunes Racing'),
      ('Blaze', 4.1, 'Monster Machines'),
      ('Hot Wheels', 4.0, 'Mattel Racing'),
      ('Rocket Racer', 3.9, 'Space Team')
    ) AS t(name, weight, team_members)
  LOOP
    -- Check if racer with this name already exists
    SELECT id INTO existing_racer_id 
    FROM public.racers 
    WHERE name = racer_data.name 
    LIMIT 1;
    
    IF existing_racer_id IS NOT NULL THEN
      -- Update existing racer
      UPDATE public.racers 
      SET 
        weight = racer_data.weight,
        team_members = racer_data.team_members,
        updated_at = now()
      WHERE id = existing_racer_id;
      
      RAISE NOTICE 'Updated racer: %', racer_data.name;
    ELSE
      -- Insert new racer
      INSERT INTO public.racers (name, weight, team_members, user_id)
      VALUES (racer_data.name, racer_data.weight, racer_data.team_members, test_user_id);
      
      RAISE NOTICE 'Inserted new racer: %', racer_data.name;
    END IF;
    
    -- Reset for next iteration
    existing_racer_id := NULL;
  END LOOP;
END $$;

-- Create or update test race
DO $$
DECLARE
  test_race_id uuid;
  existing_race_id uuid;
BEGIN
  -- Check if test race already exists
  SELECT id INTO existing_race_id 
  FROM public.races 
  WHERE name = '2024 Championship Derby' 
  LIMIT 1;
  
  IF existing_race_id IS NOT NULL THEN
    test_race_id := existing_race_id;
    RAISE NOTICE 'Using existing race: 2024 Championship Derby';
  ELSE
    -- Insert new race
    INSERT INTO public.races (name, slug, race_datetime, active)
    VALUES ('2024 Championship Derby', '2024-championship-derby', '2024-07-15 10:00:00+00', true)
    RETURNING id INTO test_race_id;
    RAISE NOTICE 'Created new race: 2024 Championship Derby';
  END IF;
  
  -- Store the race ID for use in subsequent operations
  -- We'll use a temporary table to pass this to the next blocks
  CREATE TEMP TABLE IF NOT EXISTS temp_race_info (race_id uuid);
  DELETE FROM temp_race_info;
  INSERT INTO temp_race_info (race_id) VALUES (test_race_id);
END $$;

-- Create check-ins for all seed racers for the test race
DO $$
DECLARE
  test_race_id uuid;
  racer_record record;
  existing_checkin_id uuid;
BEGIN
  -- Get the race ID from temp table
  SELECT race_id INTO test_race_id FROM temp_race_info LIMIT 1;
  
  -- Check in all seed racers
  FOR racer_record IN 
    SELECT id, name FROM public.racers 
    WHERE name IN (
      'Lightning McQueen', 'Speed Racer', 'Turbo', 'The Flash', 'Sonic', 'Road Runner',
      'Dash Parr', 'Quicksilver', 'Speedy Gonzales', 'Blaze', 'Hot Wheels', 'Rocket Racer'
    )
  LOOP
    -- Check if already checked in
    SELECT id INTO existing_checkin_id 
    FROM public.checkins 
    WHERE racer_id = racer_record.id AND race_id = test_race_id
    LIMIT 1;
    
    IF existing_checkin_id IS NULL THEN
      -- Create check-in
      INSERT INTO public.checkins (racer_id, race_id, time)
      VALUES (racer_record.id, test_race_id, '2024-07-15 08:00:00+00');
      
      RAISE NOTICE 'Checked in: %', racer_record.name;
    ELSE
      RAISE NOTICE 'Already checked in: %', racer_record.name;
    END IF;
    
    existing_checkin_id := NULL;
  END LOOP;
END $$;

-- Create qualifying times (multiple runs per racer with realistic spread)
-- DO $$
-- DECLARE
--   test_race_id uuid;
--   racer_times record;
--   target_racer_id uuid;
--   existing_qualifier_count integer;
-- BEGIN
--   -- Get the race ID from temp table
--   SELECT race_id INTO test_race_id FROM temp_race_info LIMIT 1;
  
--   -- Only add qualifying times if they don't already exist for these racers
--   FOR racer_times IN 
--     SELECT * FROM (VALUES
--       ('Lightning McQueen', ARRAY[2.845, 2.901, 2.867], ARRAY['09:15:00', '10:45:00', '11:30:00']),
--       ('Speed Racer', ARRAY[2.923, 2.956, 2.889], ARRAY['09:20:00', '10:50:00', '11:35:00']),
--       ('Turbo', ARRAY[2.934, 2.987], ARRAY['09:25:00', '10:55:00']),
--       ('The Flash', ARRAY[2.978, 3.012, 2.945], ARRAY['09:30:00', '11:00:00', '11:40:00']),
--       ('Sonic', ARRAY[3.034, 3.067], ARRAY['09:35:00', '11:05:00']),
--       ('Road Runner', ARRAY[3.089, 3.123, 3.156], ARRAY['09:40:00', '11:10:00', '11:45:00']),
--       ('Dash Parr', ARRAY[3.178, 3.201], ARRAY['09:45:00', '11:15:00']),
--       ('Quicksilver', ARRAY[3.234, 3.267, 3.289], ARRAY['09:50:00', '11:20:00', '11:50:00']),
--       ('Speedy Gonzales', ARRAY[3.312, 3.345], ARRAY['09:55:00', '11:25:00']),
--       ('Blaze', ARRAY[3.378, 3.401, 3.423], ARRAY['10:00:00', '11:30:00', '11:55:00']),
--       ('Hot Wheels', ARRAY[3.456, 3.489], ARRAY['10:05:00', '11:35:00']),
--       ('Rocket Racer', ARRAY[3.512, 3.545, 3.578], ARRAY['10:10:00', '11:40:00', '12:00:00'])
--     ) AS t(racer_name, times, time_stamps)
--   LOOP
--     -- Get racer ID
--     SELECT id INTO target_racer_id 
--     FROM public.racers 
--     WHERE name = racer_times.racer_name 
--     LIMIT 1;
    
--     IF target_racer_id IS NOT NULL THEN
--       -- Check if this racer already has qualifying times for this race
--       SELECT COUNT(*) INTO existing_qualifier_count
--       FROM public.qualifiers 
--       WHERE racer_id = target_racer_id AND race_id = test_race_id;
      
--       IF existing_qualifier_count = 0 THEN
--         -- Insert qualifying times for this racer with realistic timestamps
--         FOR i IN 1..array_length(racer_times.times, 1) LOOP
--           INSERT INTO public.qualifiers (racer_id, race_id, time, created_at)
--           VALUES (
--             target_racer_id, 
--             test_race_id, 
--             racer_times.times[i],
--             ('2024-07-15 ' || racer_times.time_stamps[i] || '+00')::timestamp with time zone
--           );
--         END LOOP;
        
--         RAISE NOTICE 'Added % qualifying times for: %', array_length(racer_times.times, 1), racer_times.racer_name;
--       ELSE
--         -- Update existing qualifying times with realistic timestamps
--         DECLARE
--           existing_qualifier record;
--           time_index integer := 1;
--         BEGIN
--           FOR existing_qualifier IN 
--             SELECT id FROM public.qualifiers 
--             WHERE racer_id = target_racer_id AND race_id = test_race_id
--             ORDER BY time ASC
--           LOOP
--             -- Only update if we have a timestamp for this run
--             IF time_index <= array_length(racer_times.time_stamps, 1) THEN
--               UPDATE public.qualifiers 
--               SET created_at = ('2024-07-15 ' || racer_times.time_stamps[time_index] || '+00')::timestamp with time zone
--               WHERE id = existing_qualifier.id;
              
--               time_index := time_index + 1;
--             END IF;
--           END LOOP;
          
--           RAISE NOTICE 'Updated timestamps for % existing qualifying times for: %', existing_qualifier_count, racer_times.racer_name;
--         END;
--       END IF;
--     END IF;
    
--     target_racer_id := NULL;
--   END LOOP;
  
--   -- Clean up temp table
--   DROP TABLE IF EXISTS temp_race_info;
-- END $$;