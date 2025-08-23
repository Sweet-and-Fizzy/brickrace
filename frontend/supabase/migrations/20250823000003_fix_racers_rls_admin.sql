-- Fix RLS policies for racers table to allow admin operations
-- This addresses the issue where admins can't update racers they don't own

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update own racers" ON racers;
DROP POLICY IF EXISTS "Admins can manage all racers" ON racers;
DROP POLICY IF EXISTS "Users can manage own racers" ON racers;
DROP POLICY IF EXISTS "Authenticated can view racers" ON racers;
DROP POLICY IF EXISTS "Public can view racers" ON racers;

-- Allow public read access to racers (for gallery, browsing, etc.)
CREATE POLICY "Public can view racers" ON racers
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to view all racers
CREATE POLICY "Authenticated can view racers" ON racers
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own racers
CREATE POLICY "Users can create own racers" ON racers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own racers OR allow race admins to update any racer
CREATE POLICY "Users can update own racers or admins can update any" ON racers
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
)
WITH CHECK (
  auth.uid() = user_id
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
);

-- Allow users to delete their own racers OR allow race admins to delete any racer
CREATE POLICY "Users can delete own racers or admins can delete any" ON racers
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  OR 
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
);