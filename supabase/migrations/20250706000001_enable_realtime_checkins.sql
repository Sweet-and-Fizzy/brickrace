-- Enable real-time replication for checkins table
alter publication supabase_realtime add table public.checkins;