-- Fix storage policies to allow users to upload photos for their own racers
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Race admins can upload race images" ON storage.objects;
DROP POLICY IF EXISTS "Race admins can update race images" ON storage.objects;
DROP POLICY IF EXISTS "Race admins can delete race images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload race images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update race images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete race images" ON storage.objects;

-- Create new policy that allows authenticated users to upload images with proper restrictions
CREATE POLICY "Authenticated users can upload race images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'race-images' 
  AND auth.role() = 'authenticated'
  AND (
    -- Users can upload files in their own racer folders
    (name LIKE 'racers/' || auth.uid() || '/%')
    -- Or race admins can upload race and general photos
    OR (
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
      OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
    )
  )
);

-- Create new policy that allows users to update their own images and admins to update any
CREATE POLICY "Users can update race images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'race-images' 
  AND auth.role() = 'authenticated'
  AND (
    -- Users can update files in their own racer folders
    (name LIKE 'racers/' || auth.uid() || '/%')
    -- Or admins can update any files
    OR (
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
      OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
    )
  )
);

-- Create new policy that allows users to delete their own images and admins to delete any
CREATE POLICY "Users can delete race images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'race-images' 
  AND auth.role() = 'authenticated'
  AND (
    -- Users can delete files in their own racer folders
    (name LIKE 'racers/' || auth.uid() || '/%')
    -- Or admins can delete any files
    OR (
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
      OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
    )
  )
); 