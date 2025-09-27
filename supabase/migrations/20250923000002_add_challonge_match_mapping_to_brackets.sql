-- Add Challonge match mapping fields to brackets table
ALTER TABLE brackets 
ADD COLUMN IF NOT EXISTS challonge_match_id TEXT,
ADD COLUMN IF NOT EXISTS challonge_round INTEGER,
ADD COLUMN IF NOT EXISTS challonge_suggested_play_order INTEGER;

-- Create index for Challonge match lookups
CREATE INDEX IF NOT EXISTS idx_brackets_challonge_match ON brackets(challonge_match_id) WHERE challonge_match_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN brackets.challonge_match_id IS 'Challonge match ID for sync mapping';
COMMENT ON COLUMN brackets.challonge_round IS 'Challonge round number (negative for elimination, positive for winners)';
COMMENT ON COLUMN brackets.challonge_suggested_play_order IS 'Challonge suggested play order for match sequencing';