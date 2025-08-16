-- Fix RLS policies for qualifier heat system to match frontend auth logic
-- and avoid permission issues with auth.users table

-- Drop the problematic policies
DROP POLICY IF EXISTS "Only race admins can generate heats" ON public.qualifiers;
DROP POLICY IF EXISTS "Only race admins can update qualifier status" ON public.qualifiers;

-- Create new policies that match the frontend auth logic
-- These policies check for isRaceAdmin or isAdmin in user metadata
CREATE POLICY "Race admins can insert qualifiers for heat generation" ON public.qualifiers
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );

CREATE POLICY "Race admins can update qualifier status and times" ON public.qualifiers
    FOR UPDATE
    USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    );