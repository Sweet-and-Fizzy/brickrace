-- Prevent current_round from exceeding total_rounds and block further round completion after match is complete

-- 1) Add a CHECK constraint to clamp current_round at the table level (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'chk_current_round_le_total'
      AND n.nspname = 'public'
      AND t.relname = 'brackets'
  ) THEN
    ALTER TABLE public.brackets
      ADD CONSTRAINT chk_current_round_le_total
      CHECK (current_round <= total_rounds);
  END IF;
END $$;

-- 2) Update the completion trigger to clamp current_round and pin it when match is completed
CREATE OR REPLACE FUNCTION public.check_bracket_completion()
RETURNS TRIGGER AS $$
DECLARE
  bracket_record public.brackets%ROWTYPE;
  racer1_wins INTEGER;
  racer2_wins INTEGER;
  total_completed_rounds INTEGER;
  next_round INTEGER;
BEGIN
  SELECT * INTO bracket_record FROM public.brackets WHERE id = NEW.bracket_id;
  IF bracket_record.match_format != 'best_of_3' THEN
    RETURN NEW;
  END IF;

  SELECT 
    COUNT(*) FILTER (WHERE winner_racer_id = bracket_record.track1_racer_id),
    COUNT(*) FILTER (WHERE winner_racer_id = bracket_record.track2_racer_id),
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL)
  INTO racer1_wins, racer2_wins, total_completed_rounds
  FROM public.bracket_rounds 
  WHERE bracket_id = NEW.bracket_id;

  -- Compute the next round but never exceed total_rounds
  next_round := LEAST(total_completed_rounds + 1, bracket_record.total_rounds);

  -- Update counters and current_round (clamped)
  UPDATE public.brackets 
  SET 
    rounds_won_track1 = racer1_wins,
    rounds_won_track2 = racer2_wins,
    current_round = CASE 
      WHEN GREATEST(racer1_wins, racer2_wins) >= 2 THEN bracket_record.total_rounds
      ELSE next_round
    END,
    updated_at = now()
  WHERE id = NEW.bracket_id;

  -- If someone has 2 wins, set winner and complete the match
  IF racer1_wins >= 2 THEN
    UPDATE public.brackets 
    SET 
      winner_racer_id = bracket_record.track1_racer_id,
      winner_track = 1,
      is_completed = TRUE,
      current_round = bracket_record.total_rounds,
      updated_at = now()
    WHERE id = NEW.bracket_id;
  ELSIF racer2_wins >= 2 THEN
    UPDATE public.brackets 
    SET 
      winner_racer_id = bracket_record.track2_racer_id,
      winner_track = 2,
      is_completed = TRUE,
      current_round = bracket_record.total_rounds,
      updated_at = now()
    WHERE id = NEW.bracket_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Prevent any further round completion when bracket is already completed
CREATE OR REPLACE FUNCTION public.prevent_completed_match_round_changes()
RETURNS TRIGGER AS $$
DECLARE
  br public.brackets%ROWTYPE;
BEGIN
  SELECT * INTO br FROM public.brackets WHERE id = COALESCE(NEW.bracket_id, OLD.bracket_id);

  IF br.match_format = 'best_of_3' AND br.is_completed THEN
    RAISE EXCEPTION 'Cannot modify rounds of a completed match';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_prevent_completed_match_round_changes'
  ) THEN
    CREATE TRIGGER trigger_prevent_completed_match_round_changes
      BEFORE UPDATE OF racer1_time, racer2_time, completed_at ON public.bracket_rounds
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_completed_match_round_changes();
  END IF;
END $$;
