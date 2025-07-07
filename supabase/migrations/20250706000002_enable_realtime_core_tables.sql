-- Enable real-time replication for core tables that need live updates

-- High priority tables (used by multiple composables)
alter publication supabase_realtime add table public.racers;
alter publication supabase_realtime add table public.award_votes;
-- Note: award_vote_counts is a view, not a table, so it cannot be added to realtime
-- Real-time updates will come from award_votes table changes which update the view
alter publication supabase_realtime add table public.general_photos;

-- Medium priority tables
alter publication supabase_realtime add table public.awards;
alter publication supabase_realtime add table public.brackets;
alter publication supabase_realtime add table public.qualifiers;

-- Low priority tables
alter publication supabase_realtime add table public.races;