-- Add race-specific withdrawal system
-- This allows racers to be excluded from specific races while remaining eligible for others

-- Create race_withdrawals table to track race-specific withdrawals
CREATE TABLE public.race_withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id uuid NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  racer_id uuid NOT NULL REFERENCES public.racers(id) ON DELETE CASCADE,
  withdrawn_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  withdrawn_by uuid REFERENCES auth.users(id), -- Admin who made the withdrawal
  reason text, -- Optional reason for withdrawal
  
  -- Ensure one withdrawal record per racer per race
  UNIQUE(race_id, racer_id)
);

-- Add RLS policies for race_withdrawals
ALTER TABLE public.race_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Race admins and racer owners can manage withdrawals
CREATE POLICY "Race admins and racer owners can manage withdrawals" ON public.race_withdrawals
  FOR ALL USING (
    -- Race admins can manage any withdrawal
    (
      auth.role() = 'authenticated'
      AND (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
      )
    )
    OR
    -- Racer owners can manage their own racer's withdrawals
    auth.uid() IN (
      SELECT user_id FROM public.racers WHERE id = race_withdrawals.racer_id
    )
  );

-- Policy: Users can view withdrawals (for transparency)
CREATE POLICY "Users can view withdrawals" ON public.race_withdrawals
  FOR SELECT USING (true);

-- Add helpful indexes
CREATE INDEX idx_race_withdrawals_race_id ON public.race_withdrawals(race_id);
CREATE INDEX idx_race_withdrawals_racer_id ON public.race_withdrawals(racer_id);

-- Add comment to explain the table
COMMENT ON TABLE public.race_withdrawals IS 'Tracks which racers have been withdrawn from specific races, excluding them from qualifiers and brackets for that race only';

-- Create helper function to check withdrawal permissions
CREATE OR REPLACE FUNCTION public.check_withdrawal_permission(
  user_id uuid,
  target_race_id uuid,
  target_racer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is a race admin via JWT metadata
  -- Note: This function runs with SECURITY DEFINER so auth.jwt() won't work here
  -- Instead, we'll check if the user owns the racer
  IF EXISTS (
    SELECT 1 FROM public.racers 
    WHERE id = target_racer_id AND user_id = user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- No permission (admin check will be done in the API layer)
  RETURN false;
END;
$$;

-- Function to handle existing heats when a racer is withdrawn
-- Only removes FUTURE heats, preserves completed results for standings
CREATE OR REPLACE FUNCTION public.handle_racer_withdrawal_heats(
  target_race_id uuid,
  target_racer_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  scheduled_heats_count integer := 0;
  in_progress_heats_count integer := 0;
  completed_heats_count integer := 0;
  removed_from_scheduled integer := 0;
BEGIN
  -- Count heats by status
  SELECT COUNT(*) INTO scheduled_heats_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'scheduled';
    
  SELECT COUNT(*) INTO in_progress_heats_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'in_progress';
    
  SELECT COUNT(*) INTO completed_heats_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'completed';

  -- Remove racer from scheduled heats only (preserve completed results)
  DELETE FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'scheduled';
  
  GET DIAGNOSTICS removed_from_scheduled = ROW_COUNT;

  -- Leave in_progress heats alone (let them finish naturally)
  -- Leave completed heats alone (preserve results for current standings)
  
  -- Return summary of actions taken
  RETURN json_build_object(
    'scheduled_heats_removed', removed_from_scheduled,
    'in_progress_heats_continuing', in_progress_heats_count,
    'completed_heats_preserved', completed_heats_count,
    'note', 'Completed results remain in standings, only future heats affected'
  );
END;
$$;

-- Function to get heat impact preview before withdrawal
CREATE OR REPLACE FUNCTION public.preview_withdrawal_heat_impact(
  target_race_id uuid,
  target_racer_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  scheduled_count integer := 0;
  in_progress_count integer := 0;
  completed_count integer := 0;
BEGIN
  -- Count heats by status
  SELECT COUNT(*) INTO scheduled_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'scheduled';
    
  SELECT COUNT(*) INTO in_progress_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'in_progress';
    
  SELECT COUNT(*) INTO completed_count
  FROM qualifiers 
  WHERE race_id = target_race_id 
    AND racer_id = target_racer_id 
    AND status = 'completed';

  RETURN json_build_object(
    'scheduled_heats_to_remove', scheduled_count,
    'in_progress_heats_to_continue', in_progress_count,
    'completed_heats_to_preserve', completed_count,
    'keeps_current_standings', true,
    'excluded_from_future_only', true
  );
END;
$$;