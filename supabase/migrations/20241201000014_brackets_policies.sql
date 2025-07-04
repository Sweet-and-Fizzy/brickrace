-- Add policies for brackets operations

-- Allow race admins to insert brackets
create policy "Race admins can insert brackets" on public.brackets
  for insert 
  with check (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Allow race admins to delete brackets
create policy "Race admins can delete brackets" on public.brackets
  for delete 
  using (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Allow race admins to update brackets (for recording times)
create policy "Race admins can update brackets" on public.brackets
  for update 
  using (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );