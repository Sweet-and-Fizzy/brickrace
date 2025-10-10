-- Add support for best 2 out of 3 bracket races with track switching
-- Ported from frontend/supabase/migrations with idempotency guards

-- 1) Extend brackets with multi-round fields
ALTER TABLE public.brackets 
  ADD COLUMN IF NOT EXISTS match_format TEXT DEFAULT 'single' CHECK (match_format IN ('single', 'best_of_3')),
  ADD COLUMN IF NOT EXISTS rounds_won_track1 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rounds_won_track2 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- 2) Create bracket_rounds to track individual rounds within a match
CREATE TABLE IF NOT EXISTS public.bracket_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES public.brackets(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  racer1_id UUID REFERENCES public.racers(id),
  racer2_id UUID REFERENCES public.racers(id),
  racer1_track INTEGER NOT NULL CHECK (racer1_track IN (1, 2)),
  racer2_track INTEGER NOT NULL CHECK (racer2_track IN (1, 2)),
  racer1_time DECIMAL(10, 3),
  racer2_time DECIMAL(10, 3),
  winner_racer_id UUID REFERENCES public.racers(id),
  winner_track INTEGER CHECK (winner_track IN (1, 2)),
  is_forfeit BOOLEAN DEFAULT FALSE,
  forfeit_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_tracks CHECK (racer1_track != racer2_track),
  CONSTRAINT unique_bracket_round UNIQUE (bracket_id, round_number)
);

ALTER TABLE public.bracket_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.bracket_rounds;
CREATE POLICY "Allow read access for authenticated users" ON public.bracket_rounds
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin access for bracket rounds" ON public.bracket_rounds;
CREATE POLICY "Allow admin access for bracket rounds" ON public.bracket_rounds
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
        AND (
          auth.users.raw_user_meta_data->>'role' = 'race_admin'
          OR auth.users.raw_user_meta_data->>'isAdmin' = 'true'
          OR auth.users.raw_user_meta_data->>'isRaceAdmin' = 'true'
        )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_bracket_id ON public.bracket_rounds(bracket_id);
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_round_number ON public.bracket_rounds(bracket_id, round_number);
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_completed ON public.bracket_rounds(bracket_id, completed_at);

-- 3) Trigger to update brackets.updated_at on round changes
CREATE OR REPLACE FUNCTION public.update_bracket_on_round_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.brackets 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.bracket_id, OLD.bracket_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_bracket_on_round_change'
  ) THEN
    CREATE TRIGGER trigger_update_bracket_on_round_change
      AFTER INSERT OR UPDATE OR DELETE ON public.bracket_rounds
      FOR EACH ROW
      EXECUTE FUNCTION public.update_bracket_on_round_change();
  END IF;
END $$;

-- 4) Trigger to auto-complete best-of-3 matches
CREATE OR REPLACE FUNCTION public.check_bracket_completion()
RETURNS TRIGGER AS $$
DECLARE
  bracket_record public.brackets%ROWTYPE;
  racer1_wins INTEGER;
  racer2_wins INTEGER;
  total_completed_rounds INTEGER;
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

  UPDATE public.brackets 
  SET 
    rounds_won_track1 = racer1_wins,
    rounds_won_track2 = racer2_wins,
    current_round = total_completed_rounds + 1,
    updated_at = now()
  WHERE id = NEW.bracket_id;

  IF racer1_wins >= 2 THEN
    UPDATE public.brackets 
    SET 
      winner_racer_id = bracket_record.track1_racer_id,
      winner_track = 1,
      is_completed = TRUE,
      updated_at = now()
    WHERE id = NEW.bracket_id;
  ELSIF racer2_wins >= 2 THEN
    UPDATE public.brackets 
    SET 
      winner_racer_id = bracket_record.track2_racer_id,
      winner_track = 2,
      is_completed = TRUE,
      updated_at = now()
    WHERE id = NEW.bracket_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_bracket_completion'
  ) THEN
    CREATE TRIGGER trigger_check_bracket_completion
      AFTER UPDATE OF completed_at ON public.bracket_rounds
      FOR EACH ROW
      WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
      EXECUTE FUNCTION public.check_bracket_completion();
  END IF;
END $$;

-- 5) Comments
COMMENT ON TABLE public.bracket_rounds IS 'Individual rounds within a bracket match, supporting best-of-3 format with track switching';
COMMENT ON COLUMN public.brackets.match_format IS 'Format of the match: single race or best of 3 rounds';
COMMENT ON COLUMN public.brackets.rounds_won_track1 IS 'Number of rounds won by track1 racer in best-of-3 format';
COMMENT ON COLUMN public.brackets.rounds_won_track2 IS 'Number of rounds won by track2 racer in best-of-3 format';
COMMENT ON COLUMN public.brackets.current_round IS 'Current round number in multi-round matches';
COMMENT ON COLUMN public.brackets.total_rounds IS 'Total number of rounds in the match format';
COMMENT ON COLUMN public.bracket_rounds.racer1_track IS 'Track assignment for racer1 in this specific round';
COMMENT ON COLUMN public.bracket_rounds.racer2_track IS 'Track assignment for racer2 in this specific round';
