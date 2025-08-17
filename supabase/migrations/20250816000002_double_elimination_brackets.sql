-- Update bracket system for double elimination
-- Remove fastest/slowest split and implement proper double elimination

-- Add new columns for double elimination support
ALTER TABLE public.brackets 
ADD COLUMN bracket_group text CHECK (bracket_group IN ('winner', 'loser', 'final')) DEFAULT 'winner',
ADD COLUMN round_number integer DEFAULT 1,
ADD COLUMN parent_bracket_winner_id uuid REFERENCES public.brackets(id),
ADD COLUMN parent_bracket_loser_id uuid REFERENCES public.brackets(id),
ADD COLUMN is_forfeit boolean DEFAULT false,
ADD COLUMN forfeit_reason text;

-- Update bracket_type to support double elimination
ALTER TABLE public.brackets 
DROP CONSTRAINT IF EXISTS brackets_bracket_type_check;

ALTER TABLE public.brackets 
ADD CONSTRAINT brackets_bracket_type_check 
CHECK (bracket_type IN ('double_elimination', 'single_elimination'));

-- Add indexes for performance
CREATE INDEX idx_brackets_bracket_group ON public.brackets(bracket_group);
CREATE INDEX idx_brackets_round_number ON public.brackets(round_number);
CREATE INDEX idx_brackets_parent_winner ON public.brackets(parent_bracket_winner_id);
CREATE INDEX idx_brackets_parent_loser ON public.brackets(parent_bracket_loser_id);

-- Create function to handle forfeit
CREATE OR REPLACE FUNCTION public.handle_bracket_forfeit(
  bracket_id uuid,
  forfeiting_track integer,
  forfeit_reason text DEFAULT 'Racer forfeit'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bracket_record public.brackets;
  winner_track integer;
  winner_racer_id uuid;
  result json;
BEGIN
  -- Get the bracket
  SELECT * INTO bracket_record FROM public.brackets WHERE id = bracket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bracket not found';
  END IF;
  
  -- Determine winner (opposite track of forfeit)
  winner_track := CASE WHEN forfeiting_track = 1 THEN 2 ELSE 1 END;
  winner_racer_id := CASE 
    WHEN winner_track = 1 THEN bracket_record.track1_racer_id 
    ELSE bracket_record.track2_racer_id 
  END;
  
  -- Update bracket as forfeit
  UPDATE public.brackets 
  SET 
    is_forfeit = true,
    forfeit_reason = forfeit_reason,
    winner_track = winner_track,
    winner_racer_id = winner_racer_id
  WHERE id = bracket_id;
  
  -- Return result
  result := json_build_object(
    'success', true,
    'winner_track', winner_track,
    'winner_racer_id', winner_racer_id,
    'forfeit_reason', forfeit_reason
  );
  
  RETURN result;
END;
$$;

-- Create function to generate double elimination bracket structure
CREATE OR REPLACE FUNCTION public.generate_double_elimination_structure(
  race_id uuid,
  racer_ids uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  racer_count integer;
  bracket_pairs json[];
  result json;
BEGIN
  racer_count := array_length(racer_ids, 1);
  
  IF racer_count < 2 THEN
    RAISE EXCEPTION 'Need at least 2 racers for double elimination';
  END IF;
  
  -- Clear existing brackets for this race
  DELETE FROM public.brackets WHERE race_id = race_id;
  
  -- Generate initial winner bracket pairs
  -- For now, just pair racers sequentially (can be enhanced with seeding later)
  bracket_pairs := ARRAY[]::json[];
  
  FOR i IN 1..racer_count BY 2 LOOP
    IF i + 1 <= racer_count THEN
      -- Regular pairing
      bracket_pairs := bracket_pairs || json_build_object(
        'round_number', 1,
        'bracket_group', 'winner',
        'track1_racer_id', racer_ids[i],
        'track2_racer_id', racer_ids[i + 1]
      )::json;
    ELSE
      -- Odd racer gets a bye (automatic advance)
      bracket_pairs := bracket_pairs || json_build_object(
        'round_number', 1,
        'bracket_group', 'winner',
        'track1_racer_id', racer_ids[i],
        'track2_racer_id', null,
        'winner_track', 1,
        'winner_racer_id', racer_ids[i]
      )::json;
    END IF;
  END LOOP;
  
  result := json_build_object(
    'bracket_pairs', bracket_pairs,
    'total_brackets', array_length(bracket_pairs, 1)
  );
  
  RETURN result;
END;
$$;

-- Update RLS policies to work with new structure
DROP POLICY IF EXISTS "Race admins can insert brackets" ON public.brackets;
DROP POLICY IF EXISTS "Race admins can update brackets" ON public.brackets;
DROP POLICY IF EXISTS "Race admins can delete brackets" ON public.brackets;

CREATE POLICY "Race admins can insert brackets" ON public.brackets
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can update brackets" ON public.brackets
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
) WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can delete brackets" ON public.brackets
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Add helpful comments
COMMENT ON COLUMN public.brackets.bracket_group IS 'Double elimination group: winner, loser, or final bracket';
COMMENT ON COLUMN public.brackets.round_number IS 'Round number within the bracket group';
COMMENT ON COLUMN public.brackets.parent_bracket_winner_id IS 'Bracket that feeds winner to this bracket';
COMMENT ON COLUMN public.brackets.parent_bracket_loser_id IS 'Bracket that feeds loser to this bracket';
COMMENT ON COLUMN public.brackets.is_forfeit IS 'True if this bracket was decided by forfeit';
COMMENT ON COLUMN public.brackets.forfeit_reason IS 'Reason for forfeit if applicable';

COMMENT ON FUNCTION public.handle_bracket_forfeit IS 'Handles forfeit scenario and determines winner automatically';
COMMENT ON FUNCTION public.generate_double_elimination_structure IS 'Generates initial double elimination bracket structure';