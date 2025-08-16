-- Add slug field to races table for SEO-friendly URLs
ALTER TABLE races 
ADD COLUMN slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_races_slug ON races(slug);

-- Function to generate a slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single hyphen
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique slug with number suffix if needed
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT, race_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INT := 1;
  slug_exists BOOLEAN;
BEGIN
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current race if updating)
  IF race_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug AND id != race_id) INTO slug_exists;
  ELSE
    SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug) INTO slug_exists;
  END IF;
  
  -- If slug exists, append numbers until we find a unique one
  WHILE slug_exists LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
    
    IF race_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug AND id != race_id) INTO slug_exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM races WHERE slug = final_slug) INTO slug_exists;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing races
UPDATE races 
SET slug = generate_unique_slug(generate_slug(name), id)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE races 
ALTER COLUMN slug SET NOT NULL;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_race_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if not provided or if name changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := generate_unique_slug(generate_slug(NEW.name), NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER races_slug_trigger
BEFORE INSERT OR UPDATE ON races
FOR EACH ROW
EXECUTE FUNCTION auto_generate_race_slug();