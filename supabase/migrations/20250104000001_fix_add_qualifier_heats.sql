-- Fix add_qualifier_heats to prioritize racers with fewer heats
-- This ensures racers with fewer heats get paired first

CREATE OR REPLACE FUNCTION add_qualifier_heats(target_race_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  racer_record RECORD;
  current_max_heat integer;
  new_heat_number integer;
  track_assignment integer;
  racer_count integer;
BEGIN
  -- Get the current maximum heat number
  SELECT COALESCE(MAX(heat_number), 0)
  INTO current_max_heat
  FROM qualifiers
  WHERE race_id = target_race_id;

  -- Start new heats from the next heat number
  new_heat_number := current_max_heat + 1;
  track_assignment := 1;
  racer_count := 0;

  -- Create heats for all checked-in racers, prioritizing those with fewest heats
  FOR racer_record IN
    SELECT
      c.racer_id,
      COALESCE(COUNT(q.id), 0) as heat_count
    FROM checkins c
    LEFT JOIN qualifiers q ON q.racer_id = c.racer_id AND q.race_id = c.race_id
    WHERE c.race_id = target_race_id
    GROUP BY c.racer_id
    ORDER BY heat_count ASC, random()  -- Prioritize racers with fewer heats
  LOOP
    INSERT INTO qualifiers (
      race_id,
      racer_id,
      heat_number,
      track_number,
      status,
      scheduled_order,
      time
    ) VALUES (
      target_race_id,
      racer_record.racer_id,
      new_heat_number,
      track_assignment,
      'scheduled',
      new_heat_number,
      0
    );

    racer_count := racer_count + 1;

    -- Alternate between track 1 and 2
    IF track_assignment = 1 THEN
      track_assignment := 2;
    ELSE
      track_assignment := 1;
      new_heat_number := new_heat_number + 1;
    END IF;
  END LOOP;

  -- If we ended with a racer alone on track 1, pair them with the racer who has the most heats
  IF track_assignment = 2 AND racer_count > 1 THEN
    FOR racer_record IN
      SELECT
        c.racer_id,
        COALESCE(COUNT(q.id), 0) as heat_count
      FROM checkins c
      LEFT JOIN qualifiers q ON q.racer_id = c.racer_id AND q.race_id = c.race_id
      WHERE c.race_id = target_race_id
      GROUP BY c.racer_id
      ORDER BY heat_count DESC, random()  -- Get racer with most heats
      LIMIT 1
    LOOP
      INSERT INTO qualifiers (
        race_id,
        racer_id,
        heat_number,
        track_number,
        status,
        scheduled_order,
        time
      ) VALUES (
        target_race_id,
        racer_record.racer_id,
        new_heat_number,
        2,  -- Track 2
        'scheduled',
        new_heat_number,
        0
      );
      EXIT;  -- Only add one racer
    END LOOP;
  END IF;
END;
$$;
