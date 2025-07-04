-- Add missing policies for race administration

-- Allow race admins to insert races
CREATE POLICY "Race admins can insert races" ON public.races
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to update races
CREATE POLICY "Race admins can update races" ON public.races
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
) WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to delete races
CREATE POLICY "Race admins can delete races" ON public.races
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to manage qualifiers
CREATE POLICY "Race admins can insert qualifiers" ON public.qualifiers
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can update qualifiers" ON public.qualifiers
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can delete qualifiers" ON public.qualifiers
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to manage brackets
CREATE POLICY "Race admins can insert brackets" ON public.brackets
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can update brackets" ON public.brackets
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can delete brackets" ON public.brackets
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to manage checkins
CREATE POLICY "Race admins can insert checkins" ON public.checkins
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can update checkins" ON public.checkins
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can delete checkins" ON public.checkins
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

-- Allow race admins to manage awards
CREATE POLICY "Race admins can insert awards" ON public.awards
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can update awards" ON public.awards
FOR UPDATE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);

CREATE POLICY "Race admins can delete awards" ON public.awards
FOR DELETE USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true'
  )
);