-- Allow forfeit updates on completed matches
-- This fixes the issue where withdrawals fail with "Cannot modify rounds of a completed match"

CREATE OR REPLACE FUNCTION public.prevent_completed_match_round_changes()
RETURNS TRIGGER AS $$
DECLARE
  br public.brackets%ROWTYPE;
BEGIN
  SELECT * INTO br FROM public.brackets WHERE id = COALESCE(NEW.bracket_id, OLD.bracket_id);

  -- Allow forfeit updates even on completed matches (for withdrawals)
  IF NEW.is_forfeit = TRUE AND NEW.forfeit_reason IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Block other updates to completed matches
  IF br.match_format = 'best_of_3' AND br.is_completed THEN
    RAISE EXCEPTION 'Cannot modify rounds of a completed match';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.prevent_completed_match_round_changes() IS
'Prevents modification of bracket_rounds for completed matches, except when forfeiting (for withdrawals).';
