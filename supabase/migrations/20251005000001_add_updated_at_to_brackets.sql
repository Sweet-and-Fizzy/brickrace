-- Ensure brackets has an updated_at column and timestamp triggers
-- Idempotent and safe to re-run

-- 1) Add updated_at to public.brackets if missing
ALTER TABLE public.brackets 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2) Ensure handle_updated_at() exists (same as initial definition)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Create BEFORE UPDATE trigger on public.brackets to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'handle_brackets_updated_at'
      AND c.relname = 'brackets'
      AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER handle_brackets_updated_at
      BEFORE UPDATE ON public.brackets
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 4) Also maintain updated_at on public.bracket_rounds updates
ALTER TABLE public.bracket_rounds 
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'handle_bracket_rounds_updated_at'
      AND c.relname = 'bracket_rounds'
      AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER handle_bracket_rounds_updated_at
      BEFORE UPDATE ON public.bracket_rounds
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
