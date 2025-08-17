-- Add slug field to racers table
alter table public.racers add column if not exists slug text unique;

-- Create a function to generate slugs from racer names
create or replace function generate_racer_slug(racer_name text, racer_id uuid)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Convert name to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(racer_name);
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If slug is empty after cleaning, use part of the UUID
  if base_slug = '' or base_slug is null then
    base_slug := 'racer-' || substring(racer_id::text, 1, 8);
  end if;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  while exists (select 1 from public.racers where slug = final_slug and id != racer_id) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  
  return final_slug;
end;
$$ language plpgsql;

-- Generate slugs for existing racers
do $$
declare
  racer_record record;
begin
  for racer_record in select id, name from public.racers where slug is null
  loop
    update public.racers 
    set slug = generate_racer_slug(racer_record.name, racer_record.id)
    where id = racer_record.id;
  end loop;
end $$;

-- Make slug required for new racers
alter table public.racers alter column slug set not null;

-- Create trigger to auto-generate slug for new racers
create or replace function auto_generate_racer_slug()
returns trigger as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_racer_slug(new.name, new.id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger racer_slug_trigger
  before insert on public.racers
  for each row
  execute function auto_generate_racer_slug();

-- Create trigger to update slug when name changes
create or replace function update_racer_slug_on_name_change()
returns trigger as $$
begin
  if old.name != new.name and (new.slug = old.slug or new.slug is null) then
    new.slug := generate_racer_slug(new.name, new.id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger racer_slug_update_trigger
  before update on public.racers
  for each row
  when (old.name is distinct from new.name)
  execute function update_racer_slug_on_name_change();

-- Create index for faster slug lookups
create index if not exists idx_racers_slug on public.racers(slug);