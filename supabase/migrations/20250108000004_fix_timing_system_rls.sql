-- Fix RLS policies for timing system
-- Ensure timing system can properly update qualifiers table

-- First, drop ALL existing policies on qualifiers table to start clean
DROP POLICY IF EXISTS "Timing system can read qualifiers" ON public.qualifiers;
DROP POLICY IF EXISTS "Timing system and admins can insert qualifiers" ON public.qualifiers;
DROP POLICY IF EXISTS "Timing system and admins can update qualifiers" ON public.qualifiers;
DROP POLICY IF EXISTS "Race admins can insert qualifiers for heat generation" ON public.qualifiers;
DROP POLICY IF EXISTS "Race admins can update qualifier status and times" ON public.qualifiers;
DROP POLICY IF EXISTS "Users can view qualifiers for active race" ON public.qualifiers;
DROP POLICY IF EXISTS "Race admins can manage qualifiers" ON public.qualifiers;

-- Create comprehensive policies that definitely allow timing system access
CREATE POLICY "Allow all reads on qualifiers" ON public.qualifiers
    FOR SELECT
    USING (true);

CREATE POLICY "Timing system can insert qualifiers" ON public.qualifiers
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

CREATE POLICY "Timing system can update qualifiers" ON public.qualifiers
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

CREATE POLICY "Timing system can delete qualifiers" ON public.qualifiers
    FOR DELETE
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'timing_system' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

-- Ensure database functions can be executed by timing system
-- Grant execute permissions on the heat management functions
GRANT EXECUTE ON FUNCTION public.start_heat(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_heat(integer, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_qualifier_heats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_heats(integer) TO authenticated;