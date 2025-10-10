-- Fix ambiguous column reference in handle_bracket_forfeit
-- Ensure function uses unambiguous parameter names and marks bracket complete

-- Drop existing function to allow parameter name changes
DROP FUNCTION IF EXISTS public.handle_bracket_forfeit(uuid, integer, text);

CREATE OR REPLACE FUNCTION public.handle_bracket_forfeit(
  p_bracket_id uuid,
  p_forfeiting_track integer,
  p_forfeit_reason text DEFAULT 'Racer forfeit'
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bracket public.brackets%ROWTYPE;
  v_winner_track integer;
  v_winner_racer_id uuid;
  v_result json;
BEGIN
  -- Fetch bracket
  SELECT * INTO v_bracket FROM public.brackets WHERE id = p_bracket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bracket not found';
  END IF;

  -- Determine winner (opposite track of forfeit)
  v_winner_track := CASE WHEN p_forfeiting_track = 1 THEN 2 ELSE 1 END;
  v_winner_racer_id := CASE
    WHEN v_winner_track = 1 THEN v_bracket.track1_racer_id
    ELSE v_bracket.track2_racer_id
  END;

  -- Update bracket as forfeit; set explicit column references
  UPDATE public.brackets b
  SET
    is_forfeit = TRUE,
    forfeit_reason = p_forfeit_reason,
    winner_track = v_winner_track,
    winner_racer_id = v_winner_racer_id,
    is_completed = TRUE,
    updated_at = timezone('utc'::text, now())
  WHERE b.id = p_bracket_id;

  -- Return result
  v_result := json_build_object(
    'success', TRUE,
    'winner_track', v_winner_track,
    'winner_racer_id', v_winner_racer_id,
    'forfeit_reason', p_forfeit_reason
  );
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) IS 'Handles forfeit scenario unambiguously; awards opponent, marks match complete.';

-- Ensure privileges to call the function (idempotent grants)
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO anon;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO service_role;
