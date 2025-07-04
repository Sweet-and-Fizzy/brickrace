-- Add missing RLS policies for award_definitions table to allow admin operations

-- Policy: Race admins can insert award definitions
CREATE POLICY "Race admins can insert award definitions" ON public.award_definitions
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Policy: Race admins can update award definitions  
CREATE POLICY "Race admins can update award definitions" ON public.award_definitions
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Policy: Race admins can delete award definitions
CREATE POLICY "Race admins can delete award definitions" ON public.award_definitions
  FOR DELETE USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );