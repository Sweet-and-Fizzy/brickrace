-- Add match_number field to brackets table for better tournament organization
ALTER TABLE public.brackets 
ADD COLUMN IF NOT EXISTS match_number INTEGER;

-- Add a comment to explain the field
COMMENT ON COLUMN public.brackets.match_number IS 'Match number within the bracket group and round for display purposes';

-- Create an index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_brackets_group_round_match 
ON public.brackets(race_id, bracket_group, round_number, match_number);