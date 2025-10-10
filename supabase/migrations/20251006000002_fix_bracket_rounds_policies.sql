-- Fix bracket_rounds RLS policy to avoid selecting from auth.users
-- This removes the policy that queried auth.users (causing 42501) and
-- recreates it using the existing helper function public.is_race_admin().

-- Drop old policy if it exists (avoid querying pg_policies which differs across PG versions)
DROP POLICY IF EXISTS "Allow admin access for bracket rounds" ON public.bracket_rounds;

-- Recreate admin policy using helper function; ensures both USING and WITH CHECK
CREATE POLICY "Allow admin access for bracket rounds" ON public.bracket_rounds
FOR ALL TO authenticated
USING ( public.is_race_admin() )
WITH CHECK ( public.is_race_admin() );
