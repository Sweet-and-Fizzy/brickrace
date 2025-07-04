-- Row Level Security policies for the racers table

-- Enable RLS on the racers table (if not already enabled)
ALTER TABLE public.racers ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view all racers (public read access)
CREATE POLICY "Anyone can view racers" ON public.racers
FOR SELECT USING (true);

-- Policy to allow authenticated users to insert their own racers
CREATE POLICY "Users can insert their own racers" ON public.racers
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own racers
CREATE POLICY "Users can update their own racers" ON public.racers
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own racers
CREATE POLICY "Users can delete their own racers" ON public.racers
FOR DELETE USING (auth.uid() = user_id);

-- Optional: Allow admins to manage all racers
-- Uncomment these if you have admin users with a specific role
-- CREATE POLICY "Admins can manage all racers" ON public.racers
-- FOR ALL USING (
--   auth.jwt() ->> 'role' = 'admin' OR 
--   (auth.jwt() -> 'user_metadata' ->> 'isAdmin')::boolean = true
-- );

-- Also set up policies for other tables that might need them

-- Races table (probably should be readable by all, manageable by admins)
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view races" ON public.races
FOR SELECT USING (true);

-- Qualifiers table (readable by all, insertable by race admins, linked to racers)
ALTER TABLE public.qualifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view qualifiers" ON public.qualifiers
FOR SELECT USING (true);

-- Brackets table (readable by all, manageable by race admins)
ALTER TABLE public.brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brackets" ON public.brackets
FOR SELECT USING (true);

-- Checkins table (readable by all, insertable by race admins, linked to racers)
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checkins" ON public.checkins
FOR SELECT USING (true);

-- Awards table (readable by all, manageable by race admins)
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view awards" ON public.awards
FOR SELECT USING (true);