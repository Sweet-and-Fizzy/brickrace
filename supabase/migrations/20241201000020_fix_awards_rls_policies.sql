-- Add missing RLS policies for awards table to allow admin operations

-- Policy: Race admins can insert awards
CREATE POLICY "Race admins can insert awards" ON public.awards
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Policy: Race admins can update awards
CREATE POLICY "Race admins can update awards" ON public.awards
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Policy: Race admins can delete awards
CREATE POLICY "Race admins can delete awards" ON public.awards
  FOR DELETE USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );