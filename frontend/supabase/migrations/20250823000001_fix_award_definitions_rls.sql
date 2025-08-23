-- Fix RLS policies for award_definitions table using user metadata instead of profiles table
-- This addresses the mismatch between frontend auth checks and database RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage award definitions" ON award_definitions;
DROP POLICY IF EXISTS "Admin can view award definitions" ON award_definitions;
DROP POLICY IF EXISTS "Admin can create award definitions" ON award_definitions;
DROP POLICY IF EXISTS "Admin can update award definitions" ON award_definitions;
DROP POLICY IF EXISTS "Admin can delete award definitions" ON award_definitions;
DROP POLICY IF EXISTS "Public can view active award definitions" ON award_definitions;
DROP POLICY IF EXISTS "Authenticated can view all award definitions" ON award_definitions;

-- Create policy for admin users using auth.jwt() to check user metadata
CREATE POLICY "Admin can manage award definitions" ON award_definitions
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
);

-- Allow public read access to active award definitions (for voting UI)
CREATE POLICY "Public can view active award definitions" ON award_definitions
FOR SELECT
TO public
USING (active = true);

-- Allow authenticated users to view all award definitions (for admin interfaces)
CREATE POLICY "Authenticated can view all award definitions" ON award_definitions
FOR SELECT
TO authenticated
USING (true);