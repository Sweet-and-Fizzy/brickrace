-- Preview bracket withdrawal impact
CREATE OR REPLACE FUNCTION "public"."preview_withdrawal_bracket_impact"(
  "target_race_id" "uuid",
  "target_racer_id" "uuid"
) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  bracket_rounds_count integer := 0;
  brackets_count integer := 0;
BEGIN
  -- Count incomplete bracket_rounds that would be forfeited
  SELECT COUNT(*) INTO bracket_rounds_count
  FROM public.bracket_rounds br
  JOIN public.brackets b ON br.bracket_id = b.id
  WHERE b.race_id = target_race_id
    AND (br.racer1_id = target_racer_id OR br.racer2_id = target_racer_id)
    AND br.completed_at IS NULL;

  -- Count incomplete brackets that would be forfeited
  SELECT COUNT(*) INTO brackets_count
  FROM public.brackets b
  WHERE b.race_id = target_race_id
    AND (b.track1_racer_id = target_racer_id OR b.track2_racer_id = target_racer_id)
    AND b.winner_racer_id IS NULL;

  RETURN json_build_object(
    'bracket_rounds_to_forfeit', bracket_rounds_count,
    'brackets_to_forfeit', brackets_count,
    'total_forfeits', bracket_rounds_count + brackets_count
  );
END;
$$;

COMMENT ON FUNCTION "public"."preview_withdrawal_bracket_impact"("target_race_id" "uuid", "target_racer_id" "uuid") IS
'Previews how many bracket matches would be forfeited if a racer withdraws from a race.';

-- Auto-forfeit brackets when racer is withdrawn
-- This function handles bracket matches (both brackets and bracket_rounds tables)
-- when a racer withdraws from a race

CREATE OR REPLACE FUNCTION "public"."handle_racer_withdrawal_brackets"(
  "target_race_id" "uuid",
  "target_racer_id" "uuid"
) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  bracket_rounds_forfeited integer := 0;
  brackets_forfeited integer := 0;
  bracket_round record;
  bracket record;
  parent_bracket_id uuid;
BEGIN
  -- Handle bracket_rounds (best-of-3 system)
  FOR bracket_round IN
    SELECT br.*, b.id as parent_bracket_id
    FROM public.bracket_rounds br
    JOIN public.brackets b ON br.bracket_id = b.id
    WHERE b.race_id = target_race_id
      AND (br.racer1_id = target_racer_id OR br.racer2_id = target_racer_id)
      AND br.completed_at IS NULL  -- Only affect incomplete rounds
  LOOP
    -- Mark round as forfeit
    UPDATE public.bracket_rounds
    SET
      is_forfeit = TRUE,
      forfeit_reason = 'Racer withdrawn from race',
      completed_at = NOW(),
      -- Set opponent as winner if there is one
      winner_racer_id = CASE
        WHEN bracket_round.racer1_id = target_racer_id THEN bracket_round.racer2_id
        WHEN bracket_round.racer2_id = target_racer_id THEN bracket_round.racer1_id
        ELSE NULL
      END,
      winner_track = CASE
        WHEN bracket_round.racer1_id = target_racer_id THEN bracket_round.racer2_track
        WHEN bracket_round.racer2_id = target_racer_id THEN bracket_round.racer1_track
        ELSE NULL
      END
    WHERE id = bracket_round.id;

    bracket_rounds_forfeited := bracket_rounds_forfeited + 1;

    -- Store parent bracket ID for later update
    parent_bracket_id := bracket_round.parent_bracket_id;
  END LOOP;

  -- Update parent brackets table for best-of-3 matches
  -- Check if all rounds are complete (via forfeit or normal play)
  IF bracket_rounds_forfeited > 0 THEN
    UPDATE public.brackets b
    SET
      is_forfeit = TRUE,
      forfeit_reason = 'Racer withdrawn from race',
      is_completed = TRUE,
      -- Determine winner based on who ISN'T the withdrawn racer
      winner_racer_id = CASE
        WHEN b.track1_racer_id = target_racer_id THEN b.track2_racer_id
        WHEN b.track2_racer_id = target_racer_id THEN b.track1_racer_id
        ELSE b.winner_racer_id  -- Keep existing if already set
      END,
      winner_track = CASE
        WHEN b.track1_racer_id = target_racer_id THEN 2
        WHEN b.track2_racer_id = target_racer_id THEN 1
        ELSE b.winner_track  -- Keep existing if already set
      END
    WHERE b.id IN (
      SELECT DISTINCT br.bracket_id
      FROM public.bracket_rounds br
      WHERE br.is_forfeit = TRUE
        AND br.forfeit_reason = 'Racer withdrawn from race'
        AND (br.racer1_id = target_racer_id OR br.racer2_id = target_racer_id)
    )
    AND b.race_id = target_race_id;
  END IF;

  -- Handle brackets table (older single-race system or overall bracket results)
  FOR bracket IN
    SELECT b.*
    FROM public.brackets b
    WHERE b.race_id = target_race_id
      AND (b.track1_racer_id = target_racer_id OR b.track2_racer_id = target_racer_id)
      AND b.winner_racer_id IS NULL  -- Only affect incomplete brackets
      AND b.match_format IS DISTINCT FROM 'best_of_3'  -- Don't double-process best-of-3
  LOOP
    -- Mark bracket as forfeit
    UPDATE public.brackets
    SET
      is_forfeit = TRUE,
      forfeit_reason = 'Racer withdrawn from race',
      -- Set opponent as winner if there is one
      winner_racer_id = CASE
        WHEN bracket.track1_racer_id = target_racer_id THEN bracket.track2_racer_id
        WHEN bracket.track2_racer_id = target_racer_id THEN bracket.track1_racer_id
        ELSE NULL
      END,
      winner_track = CASE
        WHEN bracket.track1_racer_id = target_racer_id THEN 2
        WHEN bracket.track2_racer_id = target_racer_id THEN 1
        ELSE NULL
      END
    WHERE id = bracket.id;

    brackets_forfeited := brackets_forfeited + 1;
  END LOOP;

  -- Return summary of actions taken
  RETURN json_build_object(
    'bracket_rounds_forfeited', bracket_rounds_forfeited,
    'brackets_forfeited', brackets_forfeited,
    'note', 'Incomplete bracket matches marked as forfeit, opponent awarded win'
  );
END;
$$;

COMMENT ON FUNCTION "public"."handle_racer_withdrawal_brackets"("target_race_id" "uuid", "target_racer_id" "uuid") IS
'Auto-forfeits all incomplete bracket matches when a racer is withdrawn from a race. Marks bracket_rounds and brackets as forfeit and awards wins to opponents.';

-- Update the main withdrawal endpoint to also handle brackets
-- This is called from the API endpoint /api/racers/[id]/withdraw
CREATE OR REPLACE FUNCTION "public"."handle_racer_withdrawal"(
  "target_race_id" "uuid",
  "target_racer_id" "uuid"
) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  heat_result json;
  bracket_result json;
BEGIN
  -- Handle qualifier heats
  SELECT handle_racer_withdrawal_heats(target_race_id, target_racer_id) INTO heat_result;

  -- Handle brackets
  SELECT handle_racer_withdrawal_brackets(target_race_id, target_racer_id) INTO bracket_result;

  -- Return combined results
  RETURN json_build_object(
    'heats', heat_result,
    'brackets', bracket_result
  );
END;
$$;

COMMENT ON FUNCTION "public"."handle_racer_withdrawal"("target_race_id" "uuid", "target_racer_id" "uuid") IS
'Master function that handles both qualifier heats and bracket matches when a racer is withdrawn from a race.';
