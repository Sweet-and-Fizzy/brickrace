-- Clear brackets table to allow schema changes
-- This migration should run before 20250816000002_double_elimination_brackets.sql

-- Delete all existing brackets (they can be regenerated)
TRUNCATE TABLE public.brackets CASCADE;

-- Now the double elimination migration can be applied safely