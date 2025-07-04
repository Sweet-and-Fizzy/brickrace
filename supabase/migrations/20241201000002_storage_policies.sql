-- Create storage bucket for race images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'race-images',
  'race-images', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view/download race images (public read)
CREATE POLICY "Public read access for race images" ON storage.objects
FOR SELECT USING (bucket_id = 'race-images');

-- Allow only race admins to upload race images
CREATE POLICY "Race admins can upload race images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'race-images' 
  AND auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to update race images
CREATE POLICY "Race admins can update race images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'race-images' 
  AND auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to delete race images
CREATE POLICY "Race admins can delete race images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'race-images' 
  AND auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);