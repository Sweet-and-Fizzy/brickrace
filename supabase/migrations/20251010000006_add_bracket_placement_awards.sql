-- Add award definitions for bracket placements
-- These will be manually assigned based on final bracket results

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'award_definitions_name_key'
  ) THEN
    ALTER TABLE public.award_definitions ADD CONSTRAINT award_definitions_name_key UNIQUE (name);
  END IF;
END $$;

INSERT INTO public.award_definitions (name, description, voteable, active)
VALUES
  (
    '1st Place - Bracket Champion',
    'Awarded to the racer who wins the elimination bracket tournament',
    false,
    true
  ),
  (
    '2nd Place - Runner-Up',
    'Awarded to the racer who places second in the elimination bracket tournament',
    false,
    true
  ),
  (
    '3rd Place',
    'Awarded to the racer who places third in the elimination bracket tournament',
    false,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Add final_rank column to challonge_participants to track placement
ALTER TABLE public.challonge_participants
ADD COLUMN IF NOT EXISTS final_rank integer;

-- Add index for querying by rank
CREATE INDEX IF NOT EXISTS idx_challonge_participants_final_rank
ON public.challonge_participants(final_rank)
WHERE final_rank IS NOT NULL;

-- Create helper function to get bracket placements for a race
CREATE OR REPLACE FUNCTION public.get_bracket_placements(target_race_id uuid)
RETURNS TABLE (
  racer_id uuid,
  racer_name text,
  racer_number integer,
  final_rank integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as racer_id,
    r.name as racer_name,
    r.racer_number,
    cp.final_rank
  FROM challonge_participants cp
  JOIN challonge_tournaments ct ON ct.id = cp.challonge_tournament_id
  JOIN racers r ON r.id = cp.racer_id
  WHERE ct.race_id = target_race_id
    AND ct.status = 'finalized'
    AND cp.final_rank IS NOT NULL
    AND cp.final_rank <= 3
  ORDER BY cp.final_rank ASC;
END;
$$;

COMMENT ON FUNCTION public.get_bracket_placements IS 'Get top 3 finishers from a finalized tournament bracket for award assignment';
