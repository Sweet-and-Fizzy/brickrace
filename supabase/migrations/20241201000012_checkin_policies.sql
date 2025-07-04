-- Add policies for checkin operations

-- Allow race admins to insert checkins
create policy "Race admins can insert checkins" on public.checkins
  for insert 
  with check (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Allow race admins to delete checkins (for checkout functionality)
create policy "Race admins can delete checkins" on public.checkins
  for delete 
  using (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );

-- Allow race admins to update checkins if needed
create policy "Race admins can update checkins" on public.checkins
  for update 
  using (
    -- Check if user is a race admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isRaceAdmin' = 'true' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'isAdmin' = 'true'
  );