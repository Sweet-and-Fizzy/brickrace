-- Add race-specific withdrawal system (idempotent)
-- Allows racers to be excluded from specific races while remaining eligible for others

-- Create table only if it does not already exist
DO $$
BEGIN
  IF to_regclass('public.race_withdrawals') IS NULL THEN
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
  END IF;
END
$$;

-- Enable RLS (safe to run repeatedly)
ALTER TABLE public.race_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop before create for idempotency)
DROP POLICY IF EXISTS "Race admins and racer owners can manage withdrawals" ON public.race_withdrawals;
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

DROP POLICY IF EXISTS "Users can view withdrawals" ON public.race_withdrawals;
CREATE POLICY "Users can view withdrawals" ON public.race_withdrawals
  FOR SELECT USING (true);

-- Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_race_withdrawals_race_id ON public.race_withdrawals(race_id);
CREATE INDEX IF NOT EXISTS idx_race_withdrawals_racer_id ON public.race_withdrawals(racer_id);

-- Explain the table
COMMENT ON TABLE public.race_withdrawals IS 'Tracks which racers have been withdrawn from specific races, excluding them from qualifiers and brackets for that race only';

-- Helper function to check withdrawal permissions
CREATE OR REPLACE FUNCTION public.check_withdrawal_permission(
  p_user_id uuid,
  p_target_race_id uuid,
  p_target_racer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the racer
  IF EXISTS (
    SELECT 1 FROM public.racers
    WHERE id = p_target_racer_id AND user_id = p_user_id
  ) THEN
    RETURN true;
  END IF;

  -- No permission (admin check can be enforced at the API layer)
  RETURN false;
END;
$$;

-- Function to handle existing heats when a racer is withdrawn
-- Only removes FUTURE heats, preserves completed results for standings
CREATE OR REPLACE FUNCTION public.handle_racer_withdrawal_heats(
  p_target_race_id uuid,
  p_target_racer_id uuid
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
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
    AND status = 'scheduled';

  SELECT COUNT(*) INTO in_progress_heats_count
  FROM qualifiers
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
    AND status = 'in_progress';

  SELECT COUNT(*) INTO completed_heats_count
  FROM qualifiers
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
    AND status = 'completed';

  -- Remove racer from scheduled heats only (preserve completed results)
  DELETE FROM qualifiers
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
    AND status = 'scheduled';

  GET DIAGNOSTICS removed_from_scheduled = ROW_COUNT;

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
  p_target_race_id uuid,
  p_target_racer_id uuid
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
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
    AND status = 'scheduled';

  SELECT COUNT(*) INTO in_progress_count
  FROM qualifiers
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
    AND status = 'in_progress';

  SELECT COUNT(*) INTO completed_count
  FROM qualifiers
  WHERE race_id = p_target_race_id
    AND racer_id = p_target_racer_id
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
