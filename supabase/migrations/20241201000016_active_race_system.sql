-- Add active race system
-- Add active field to races table
ALTER TABLE public.races ADD COLUMN active boolean DEFAULT false;

-- Create function to ensure only one race can be active at a time
CREATE OR REPLACE FUNCTION public.ensure_single_active_race()
RETURNS TRIGGER AS $$
BEGIN
  -- If this race is being set to active, deactivate all others
  IF NEW.active = true THEN
    UPDATE public.races 
    SET active = false 
    WHERE id != NEW.id AND active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single active race
CREATE TRIGGER ensure_single_active_race_trigger
  BEFORE UPDATE OF active ON public.races
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_race();

-- Create trigger for inserts too
CREATE OR REPLACE FUNCTION public.ensure_single_active_race_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If this new race is being set to active, deactivate all others
  IF NEW.active = true THEN
    UPDATE public.races 
    SET active = false 
    WHERE active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_race_insert_trigger
  BEFORE INSERT ON public.races
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_race_insert();

-- Create view for easy access to active race
CREATE OR REPLACE VIEW public.active_race AS
SELECT * FROM public.races WHERE active = true;

-- Grant access to the view
GRANT SELECT ON public.active_race TO authenticated, anon;

-- Add RLS policies for race management
CREATE POLICY "Race admins can update race active status" ON public.races
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = auth.users.id 
      AND auth.users.raw_user_meta_data->>'role' = 'race_admin'
    )
  );

-- Set the most recent race as active (if any exist)
UPDATE public.races 
SET active = true 
WHERE id = (
  SELECT id FROM public.races 
  ORDER BY date DESC, created_at DESC 
  LIMIT 1
);