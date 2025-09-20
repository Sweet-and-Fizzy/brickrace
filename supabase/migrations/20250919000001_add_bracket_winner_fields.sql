-- Add winner tracking fields to brackets table
-- These are needed for determining bracket advancement

ALTER TABLE public.brackets 
ADD COLUMN winner_track integer CHECK (winner_track IN (1, 2)),
ADD COLUMN winner_racer_id uuid REFERENCES public.racers(id);

-- Add index for performance
CREATE INDEX idx_brackets_winner_racer ON public.brackets(winner_racer_id);

-- Add comment
COMMENT ON COLUMN public.brackets.winner_track IS 'Which track won: 1 or 2';
COMMENT ON COLUMN public.brackets.winner_racer_id IS 'ID of the winning racer';