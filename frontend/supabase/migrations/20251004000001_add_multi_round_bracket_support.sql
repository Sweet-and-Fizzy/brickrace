-- Add support for best 2 out of 3 bracket races with track switching
-- Migration to modify brackets table and add bracket_rounds table

-- First, add new columns to brackets table to support multi-round matches
ALTER TABLE brackets 
ADD COLUMN IF NOT EXISTS match_format TEXT DEFAULT 'single' CHECK (match_format IN ('single', 'best_of_3')),
ADD COLUMN IF NOT EXISTS rounds_won_track1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rounds_won_track2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Create bracket_rounds table to track individual rounds within a match
CREATE TABLE IF NOT EXISTS bracket_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  racer1_id UUID REFERENCES racers(id),
  racer2_id UUID REFERENCES racers(id),
  racer1_track INTEGER NOT NULL CHECK (racer1_track IN (1, 2)),
  racer2_track INTEGER NOT NULL CHECK (racer2_track IN (1, 2)),
  racer1_time DECIMAL(10, 3),
  racer2_time DECIMAL(10, 3),
  winner_racer_id UUID REFERENCES racers(id),
  winner_track INTEGER CHECK (winner_track IN (1, 2)),
  is_forfeit BOOLEAN DEFAULT FALSE,
  forfeit_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure racer1_track and racer2_track are different
  CONSTRAINT different_tracks CHECK (racer1_track != racer2_track),
  -- Ensure unique round numbers per bracket
  CONSTRAINT unique_bracket_round UNIQUE (bracket_id, round_number)
);

-- Add RLS policies for bracket_rounds
ALTER TABLE bracket_rounds ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for authenticated users" ON bracket_rounds
  FOR SELECT TO authenticated USING (true);

-- Allow admin users to insert/update/delete bracket rounds
CREATE POLICY "Allow admin access for bracket rounds" ON bracket_rounds
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'race_admin')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_bracket_id ON bracket_rounds(bracket_id);
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_round_number ON bracket_rounds(bracket_id, round_number);
CREATE INDEX IF NOT EXISTS idx_bracket_rounds_completed ON bracket_rounds(bracket_id, completed_at);

-- Add trigger to update brackets.updated_at when bracket_rounds change
CREATE OR REPLACE FUNCTION update_bracket_on_round_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent bracket's updated_at timestamp
  UPDATE brackets 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.bracket_id, OLD.bracket_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bracket_on_round_change
  AFTER INSERT OR UPDATE OR DELETE ON bracket_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_bracket_on_round_change();

-- Add function to automatically determine bracket winner after each round completion
CREATE OR REPLACE FUNCTION check_bracket_completion()
RETURNS TRIGGER AS $$
DECLARE
  bracket_record brackets%ROWTYPE;
  racer1_wins INTEGER;
  racer2_wins INTEGER;
  total_completed_rounds INTEGER;
BEGIN
  -- Get the bracket record
  SELECT * INTO bracket_record FROM brackets WHERE id = NEW.bracket_id;
  
  -- Only process if this is a best_of_3 match
  IF bracket_record.match_format != 'best_of_3' THEN
    RETURN NEW;
  END IF;
  
  -- Count wins for each racer
  SELECT 
    COUNT(*) FILTER (WHERE winner_racer_id = bracket_record.track1_racer_id),
    COUNT(*) FILTER (WHERE winner_racer_id = bracket_record.track2_racer_id),
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL)
  INTO racer1_wins, racer2_wins, total_completed_rounds
  FROM bracket_rounds 
  WHERE bracket_id = NEW.bracket_id;
  
  -- Update bracket with current round wins
  UPDATE brackets 
  SET 
    rounds_won_track1 = racer1_wins,
    rounds_won_track2 = racer2_wins,
    current_round = total_completed_rounds + 1,
    updated_at = now()
  WHERE id = NEW.bracket_id;
  
  -- Check if someone has won 2 rounds (best of 3)
  IF racer1_wins >= 2 THEN
    UPDATE brackets 
    SET 
      winner_racer_id = bracket_record.track1_racer_id,
      winner_track = 1,
      is_completed = TRUE,
      updated_at = now()
    WHERE id = NEW.bracket_id;
  ELSIF racer2_wins >= 2 THEN
    UPDATE brackets 
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

-- Trigger to check bracket completion after each round
CREATE TRIGGER trigger_check_bracket_completion
  AFTER UPDATE OF completed_at ON bracket_rounds
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
  EXECUTE FUNCTION check_bracket_completion();

-- Add comments for documentation
COMMENT ON TABLE bracket_rounds IS 'Individual rounds within a bracket match, supporting best-of-3 format with track switching';
COMMENT ON COLUMN brackets.match_format IS 'Format of the match: single race or best of 3 rounds';
COMMENT ON COLUMN brackets.rounds_won_track1 IS 'Number of rounds won by track1 racer in best-of-3 format';
COMMENT ON COLUMN brackets.rounds_won_track2 IS 'Number of rounds won by track2 racer in best-of-3 format';
COMMENT ON COLUMN brackets.current_round IS 'Current round number in multi-round matches';
COMMENT ON COLUMN brackets.total_rounds IS 'Total number of rounds in the match format';
COMMENT ON COLUMN bracket_rounds.racer1_track IS 'Track assignment for racer1 in this specific round';
COMMENT ON COLUMN bracket_rounds.racer2_track IS 'Track assignment for racer2 in this specific round';