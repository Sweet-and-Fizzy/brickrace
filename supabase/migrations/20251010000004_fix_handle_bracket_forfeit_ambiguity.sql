-- Recreate handle_bracket_forfeit with original parameter names to satisfy Supabase RPC lookup
-- and qualify column references to avoid ambiguity.

-- 1) Drop existing function (any previous definition with same arg types)
DROP FUNCTION IF EXISTS public.handle_bracket_forfeit(uuid, integer, text);

-- 2) Create function with original parameter names expected by clients
CREATE OR REPLACE FUNCTION public.handle_bracket_forfeit(
  bracket_id uuid,
  forfeiting_track integer,
  forfeit_reason text DEFAULT 'Racer forfeit'
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bracket public.brackets%ROWTYPE;
  v_winner_track integer;
  v_winner_racer_id uuid;
  v_result json;
BEGIN
  -- Fetch bracket
  SELECT * INTO v_bracket FROM public.brackets WHERE id = bracket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bracket not found';
  END IF;

  -- Determine winner (opposite track of forfeit)
  v_winner_track := CASE WHEN forfeiting_track = 1 THEN 2 ELSE 1 END;
  v_winner_racer_id := CASE
    WHEN v_winner_track = 1 THEN v_bracket.track1_racer_id
    ELSE v_bracket.track2_racer_id
  END;

  -- Update bracket as forfeit; qualify target columns
  UPDATE public.brackets AS b
  SET
    is_forfeit      = TRUE,
    forfeit_reason  = forfeit_reason,
    winner_track    = v_winner_track,
    winner_racer_id = v_winner_racer_id,
    is_completed    = TRUE,
    updated_at      = timezone('utc'::text, now())
  WHERE b.id = bracket_id;

  -- Return result
  v_result := json_build_object(
    'success', TRUE,
    'winner_track', v_winner_track,
    'winner_racer_id', v_winner_racer_id,
    'forfeit_reason', forfeit_reason
  );
  RETURN v_result;
END;
$$;

-- 3) Re-grant execution to roles used by the app
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO anon;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO service_role;

COMMENT ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) IS 'Handles bracket forfeits: awards opponent, marks bracket completed; parameter names match original RPC usage.';
-- Fix ambiguous column reference in handle_bracket_forfeit
-- Drop and recreate with unambiguous parameter names and explicit column refs

-- 1) Drop existing function to allow changing parameter names
DROP FUNCTION IF EXISTS public.handle_bracket_forfeit(uuid, integer, text);

-- 2) Recreate function with parameter prefixes and explicit column references
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

  -- Update bracket as forfeit; qualify target columns
  UPDATE public.brackets AS b
  SET
    is_forfeit    = TRUE,
    forfeit_reason = p_forfeit_reason,
    winner_track   = v_winner_track,
    winner_racer_id = v_winner_racer_id,
    is_completed   = TRUE,
    updated_at     = timezone('utc'::text, now())
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

-- 3) Re-grant access
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO anon;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) TO service_role;

COMMENT ON FUNCTION public.handle_bracket_forfeit(uuid, integer, text) IS 'Handles forfeit scenario and determines winner automatically (unambiguous parameters)';
-- Fix ambiguous column reference in handle_bracket_forfeit
-- Ensure function uses unambiguous parameter names and marks bracket complete

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
