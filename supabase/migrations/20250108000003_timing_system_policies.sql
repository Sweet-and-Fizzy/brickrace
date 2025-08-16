-- Create RLS policies for timing system service account
-- The timing system uses a service account with role: 'timing_system'

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Race admins can insert qualifiers for heat generation" ON public.qualifiers;
DROP POLICY IF EXISTS "Race admins can update qualifier status and times" ON public.qualifiers;

-- Allow timing system to read qualifiers
CREATE POLICY "Timing system can read qualifiers" ON public.qualifiers
    FOR SELECT
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true' OR
        true  -- Allow public reads for race viewing
    );

-- Allow timing system and admins to insert qualifiers (for heat generation)
CREATE POLICY "Timing system and admins can insert qualifiers" ON public.qualifiers
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

-- Allow timing system and admins to update qualifiers (for heat status and times)
CREATE POLICY "Timing system and admins can update qualifiers" ON public.qualifiers
    FOR UPDATE
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    )
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

-- Allow timing system to read races (needed for race status checks)
-- Note: races already has a public read policy, but let's be explicit
DROP POLICY IF EXISTS "Everyone can view races" ON public.races;
CREATE POLICY "Public and timing system can read races" ON public.races
    FOR SELECT
    USING (true);

-- Allow timing system to read racers (needed for heat assignments)
-- Note: racers has user-specific policies, but timing system needs read access
CREATE POLICY "Timing system can read racers" ON public.racers
    FOR SELECT
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        auth.uid() = user_id OR  -- Keep existing user access
        true  -- Allow public reads for race viewing
    );