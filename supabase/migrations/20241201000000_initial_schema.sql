-- Create tables
create table public.racers (
  id uuid default gen_random_uuid() primary key,
  racer_number serial unique not null, -- Sequential integer ID like 1, 2, 3...
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  weight decimal,
  team_members text,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text,
  photos text[], -- Array of photo URLs
  videos text[]  -- Array of video URLs
);

create table public.races (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  date date,
  image_url text
);

create table public.qualifiers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  racer_id uuid references public.racers(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  time decimal not null -- Time in seconds
);

create table public.brackets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  race_id uuid references public.races(id) on delete cascade not null,
  track1_racer_id uuid references public.racers(id) on delete cascade,
  track2_racer_id uuid references public.racers(id) on delete cascade,
  track1_time decimal,
  track2_time decimal,
  bracket_type text check (bracket_type in ('Fastest', 'Slowest'))
);

create table public.checkins (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  racer_id uuid references public.racers(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  time timestamp with time zone not null
);

create table public.awards (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  racer_id uuid references public.racers(id) on delete cascade not null,
  race_id uuid references public.races(id) on delete cascade not null,
  image_url text
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_racers_updated_at
  before update on public.racers
  for each row execute function public.handle_updated_at();

create trigger handle_races_updated_at
  before update on public.races
  for each row execute function public.handle_updated_at();

-- Row Level Security Policies
-- Users can only see/edit their own racers
create policy "Users can view their own racers" on public.racers
  for select using (auth.uid() = user_id);

create policy "Users can insert their own racers" on public.racers
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own racers" on public.racers
  for update using (auth.uid() = user_id);

create policy "Users can delete their own racers" on public.racers
  for delete using (auth.uid() = user_id);

-- Everyone can view races (public data)
create policy "Everyone can view races" on public.races
  for select using (true);

-- Everyone can view qualifiers, brackets, checkins, awards (public race data)
create policy "Everyone can view qualifiers" on public.qualifiers
  for select using (true);

create policy "Everyone can view brackets" on public.brackets
  for select using (true);

create policy "Everyone can view checkins" on public.checkins
  for select using (true);

create policy "Everyone can view awards" on public.awards
  for select using (true);

-- Enable RLS on all tables
alter table public.racers enable row level security;
alter table public.races enable row level security;
alter table public.qualifiers enable row level security;
alter table public.brackets enable row level security;
alter table public.checkins enable row level security;
alter table public.awards enable row level security;