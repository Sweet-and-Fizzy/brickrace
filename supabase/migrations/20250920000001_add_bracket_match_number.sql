-- Add match_number field to brackets table for better tournament organization
ALTER TABLE brackets 
ADD COLUMN match_number INTEGER;

-- Add a comment to explain the field
COMMENT ON COLUMN brackets.match_number IS 'Match number within the bracket group and round for display purposes';

-- Create an index for efficient sorting
CREATE INDEX idx_brackets_group_round_match 
ON brackets(race_id, bracket_group, round_number, match_number);