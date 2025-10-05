-- Create storage bucket for race images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'race-images',
  'race-images', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Guard storage policy DDL to only run when current user owns storage.objects
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage'
      AND c.relname = 'objects'
      AND pg_get_userbyid(c.relowner) = current_user
  ) THEN
    -- Enable RLS on storage.objects (skip if already enabled)
    BEGIN
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
      RAISE NOTICE 'Skipping enabling RLS on storage.objects';
    END;

    -- Re-create policies idempotently
    BEGIN
      DROP POLICY IF EXISTS "Public read access for race images" ON storage.objects;
      CREATE POLICY "Public read access for race images" ON storage.objects
      FOR SELECT USING (bucket_id = 'race-images');
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping public read policy on storage.objects';
    END;

    BEGIN
      DROP POLICY IF EXISTS "Race admins can upload race images" ON storage.objects;
      CREATE POLICY "Race admins can upload race images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'race-images' 
        AND auth.role() = 'authenticated'
        AND (
          (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
          OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
        )
      );
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping upload policy on storage.objects';
    END;

    BEGIN
      DROP POLICY IF EXISTS "Race admins can update race images" ON storage.objects;
      CREATE POLICY "Race admins can update race images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'race-images' 
        AND auth.role() = 'authenticated'
        AND (
          (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
          OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
        )
      );
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping update policy on storage.objects';
    END;

    BEGIN
      DROP POLICY IF EXISTS "Race admins can delete race images" ON storage.objects;
      CREATE POLICY "Race admins can delete race images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'race-images' 
        AND auth.role() = 'authenticated'
        AND (
          (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
          OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
        )
      );
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping delete policy on storage.objects';
    END;
  ELSE
    RAISE NOTICE 'Skipping storage policy DDL: current user % is not owner of storage.objects', current_user;
  END IF;
END
$$;