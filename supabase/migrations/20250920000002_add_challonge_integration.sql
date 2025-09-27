-- Add Challonge integration tables for tournament bracket management

-- Table to track Challonge tournaments linked to our races
CREATE TABLE challonge_tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  challonge_tournament_id VARCHAR NOT NULL UNIQUE,
  challonge_url VARCHAR NOT NULL,
  tournament_type VARCHAR DEFAULT 'double_elimination' CHECK (tournament_type IN ('single_elimination', 'double_elimination')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  embed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to map our racers to Challonge participants
CREATE TABLE challonge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challonge_tournament_id UUID REFERENCES challonge_tournaments(id) ON DELETE CASCADE NOT NULL,
  racer_id UUID REFERENCES racers(id) ON DELETE CASCADE NOT NULL,
  challonge_participant_id VARCHAR NOT NULL,
  seed_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure each racer can only be in a tournament once
  UNIQUE(challonge_tournament_id, racer_id)
);

-- Indexes for performance
CREATE INDEX idx_challonge_tournaments_race_id ON challonge_tournaments(race_id);
CREATE INDEX idx_challonge_tournaments_status ON challonge_tournaments(status);
CREATE INDEX idx_challonge_participants_tournament_id ON challonge_participants(challonge_tournament_id);
CREATE INDEX idx_challonge_participants_racer_id ON challonge_participants(racer_id);

-- RLS Policies
ALTER TABLE challonge_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challonge_participants ENABLE ROW LEVEL SECURITY;

-- Public can view tournaments for active races
CREATE POLICY "Public can view challonge tournaments" ON challonge_tournaments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM races 
      WHERE races.id = challonge_tournaments.race_id 
      AND races.active = true
    )
  );

-- Admins can manage tournaments
CREATE POLICY "Admins can manage challonge tournaments" ON challonge_tournaments
  FOR ALL USING (
    auth.uid() IS NOT NULL 
    AND (
      (auth.jwt() ->> 'user_metadata')::json ->> 'isAdmin' = 'true'
      OR (auth.jwt() ->> 'user_metadata')::json ->> 'isRaceAdmin' = 'true'
    )
  );

-- Public can view participants for active races
CREATE POLICY "Public can view challonge participants" ON challonge_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challonge_tournaments ct
      JOIN races r ON r.id = ct.race_id
      WHERE ct.id = challonge_participants.challonge_tournament_id 
      AND r.active = true
    )
  );

-- Admins can manage participants
CREATE POLICY "Admins can manage challonge participants" ON challonge_participants
  FOR ALL USING (
    auth.uid() IS NOT NULL 
    AND (
      (auth.jwt() ->> 'user_metadata')::json ->> 'isAdmin' = 'true'
      OR (auth.jwt() ->> 'user_metadata')::json ->> 'isRaceAdmin' = 'true'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_challonge_tournaments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_challonge_tournaments_updated_at
  BEFORE UPDATE ON challonge_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_challonge_tournaments_updated_at();