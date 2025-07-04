-- Drop the problematic policy
DROP POLICY IF EXISTS "Database admin check for races" ON public.races;

-- Create a function to check if current user is admin
-- This function runs with elevated privileges to access auth.users
CREATE OR REPLACE FUNCTION public.is_race_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      raw_user_meta_data ->> 'isAdmin' = 'true'
      OR raw_user_meta_data ->> 'isRaceAdmin' = 'true'
    )
  );
$$;

-- Create policy using the function
CREATE POLICY "Race admins can manage races" ON public.races
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.is_race_admin()
) WITH CHECK (
  auth.role() = 'authenticated'
  AND public.is_race_admin()
);