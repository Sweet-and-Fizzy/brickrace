-- Add policies for qualifiers operations

-- Allow race admins to insert qualifiers
create policy "Race admins can insert qualifiers" on public.qualifiers
  for insert 
  with check (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Allow race admins to delete qualifiers
create policy "Race admins can delete qualifiers" on public.qualifiers
  for delete 
  using (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Allow race admins to update qualifiers if needed
create policy "Race admins can update qualifiers" on public.qualifiers
  for update 
  using (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );