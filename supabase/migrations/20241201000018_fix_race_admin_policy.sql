-- Fix the race admin policy to use proper auth functions
-- Drop the problematic policy
DROP POLICY IF EXISTS "Race admins can update race active status" ON public.races;

-- Create a simpler policy that checks the user metadata directly
CREATE POLICY "Race admins can update race active status" ON public.races
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'race_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'race_admin'
  );

-- Also allow race admins to insert new races
CREATE POLICY "Race admins can insert races" ON public.races
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'race_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'race_admin'
  );

-- Allow race admins to delete races
CREATE POLICY "Race admins can delete races" ON public.races
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'race_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'race_admin'
  );