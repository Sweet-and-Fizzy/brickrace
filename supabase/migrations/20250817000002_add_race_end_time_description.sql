-- Add end_time and description fields to races table
alter table public.races add column if not exists end_time timestamptz;
alter table public.races add column if not exists description text;

-- Add comment for clarity
comment on column public.races.end_time is 'Optional end time for the race event';
comment on column public.races.description is 'HTML description of the race event';