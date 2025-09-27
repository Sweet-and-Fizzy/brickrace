-- Create table to track bracket-to-Challonge match synchronization
CREATE TABLE IF NOT EXISTS challonge_match_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  challonge_tournament_id UUID NOT NULL REFERENCES challonge_tournaments(id) ON DELETE CASCADE,
  challonge_match_id TEXT NOT NULL,
  winner_participant_id TEXT NOT NULL,
  scores_csv TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one sync record per bracket
  UNIQUE(bracket_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challonge_match_sync_tournament ON challonge_match_sync(challonge_tournament_id);
CREATE INDEX IF NOT EXISTS idx_challonge_match_sync_bracket ON challonge_match_sync(bracket_id);
CREATE INDEX IF NOT EXISTS idx_challonge_match_sync_match ON challonge_match_sync(challonge_match_id);

-- Add RLS policies
ALTER TABLE challonge_match_sync ENABLE ROW LEVEL SECURITY;

-- Allow admins to view sync records
CREATE POLICY "Admins can view challonge match sync records" ON challonge_match_sync
FOR SELECT USING (
  auth.jwt()->>'role' = 'admin'
);

-- Allow system to insert/update sync records
CREATE POLICY "System can manage challonge match sync records" ON challonge_match_sync
FOR ALL USING (true);

-- Add comment for documentation
COMMENT ON TABLE challonge_match_sync IS 'Tracks synchronization between internal bracket results and Challonge tournament matches';
COMMENT ON COLUMN challonge_match_sync.bracket_id IS 'Reference to the internal bracket that was synced';
COMMENT ON COLUMN challonge_match_sync.challonge_tournament_id IS 'Reference to the Challonge tournament';
COMMENT ON COLUMN challonge_match_sync.challonge_match_id IS 'Challonge match ID (from their API)';
COMMENT ON COLUMN challonge_match_sync.winner_participant_id IS 'Challonge participant ID of the winner';
COMMENT ON COLUMN challonge_match_sync.scores_csv IS 'Match scores in CSV format (e.g., "12.345-13.678")';
COMMENT ON COLUMN challonge_match_sync.synced_at IS 'When the sync occurred';