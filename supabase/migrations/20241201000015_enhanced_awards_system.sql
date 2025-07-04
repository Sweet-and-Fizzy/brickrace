-- Enhanced Awards System Migration
-- Drop existing awards table and recreate with enhanced features

DROP TABLE IF EXISTS public.awards CASCADE;
DROP TABLE IF EXISTS public.award_votes CASCADE;

-- Award definitions table - stores the award types that can be given
CREATE TABLE public.award_definitions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  image_url text,
  voteable boolean default false, -- Whether this award can be voted on
  active boolean default true -- Whether this award is currently active
);

-- Actual award assignments - links award definitions to racers for specific races
CREATE TABLE public.awards (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  award_definition_id uuid references public.award_definitions(id) on delete cascade not null,
  racer_id uuid references public.racers(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  assigned_by uuid references auth.users(id), -- Admin who assigned the award
  notes text -- Optional notes about the award assignment
);

-- Voting system for awards
CREATE TABLE public.award_votes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  award_definition_id uuid references public.award_definitions(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  racer_id uuid references public.racers(id) on delete cascade not null,
  voter_id uuid references auth.users(id) on delete cascade not null,
  UNIQUE(award_definition_id, race_id, voter_id) -- One vote per user per award per race
);

-- Add updated_at triggers
CREATE TRIGGER handle_award_definitions_updated_at
  BEFORE UPDATE ON public.award_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_awards_updated_at
  BEFORE UPDATE ON public.awards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security Policies

-- Award definitions - everyone can view, only admins can modify
ALTER TABLE public.award_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view award definitions" ON public.award_definitions
  FOR SELECT USING (active = true);

-- Awards - everyone can view
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view awards" ON public.awards
  FOR SELECT USING (true);

-- Award votes - authenticated users can vote, everyone can view aggregated data
ALTER TABLE public.award_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can vote" ON public.award_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can view their own votes" ON public.award_votes
  FOR SELECT USING (auth.uid() = voter_id);

CREATE POLICY "Everyone can view vote counts" ON public.award_votes
  FOR SELECT USING (true);

-- Create view for vote counts
CREATE OR REPLACE VIEW public.award_vote_counts AS
SELECT 
  av.award_definition_id,
  av.race_id,
  av.racer_id,
  COUNT(*) as vote_count,
  r.name as racer_name,
  ad.name as award_name
FROM public.award_votes av
JOIN public.racers r ON av.racer_id = r.id
JOIN public.award_definitions ad ON av.award_definition_id = ad.id
GROUP BY av.award_definition_id, av.race_id, av.racer_id, r.name, ad.name;

-- Grant access to the view
GRANT SELECT ON public.award_vote_counts TO authenticated, anon;

-- Insert some sample award definitions
INSERT INTO public.award_definitions (name, description, voteable, image_url) VALUES
('Best Design', 'Awarded to the racer with the most creative and well-designed car', true, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center'),
('Fastest Time', 'Awarded to the racer with the fastest qualifying time', false, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center'),
('Most Creative', 'Awarded to the racer with the most unique and innovative approach', true, 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center'),
('Best Teamwork', 'Awarded to the team that shows exceptional collaboration', true, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=center'),
('Crowd Favorite', 'Awarded to the racer voted as favorite by the audience', true, 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop&crop=center'),
('Best Sportsmanship', 'Awarded to the racer who demonstrates exceptional sportsmanship', true, 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=300&fit=crop&crop=center');