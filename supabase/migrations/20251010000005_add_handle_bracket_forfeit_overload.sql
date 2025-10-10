-- Provide an overload to satisfy schema cache/lookups that expect (uuid, text, integer)

-- 1) Drop wrapper overload if exists
DROP FUNCTION IF EXISTS public.handle_bracket_forfeit(uuid, text, integer);

-- 2) Create wrapper overload that delegates to the main implementation
CREATE OR REPLACE FUNCTION public.handle_bracket_forfeit(
  bracket_id uuid,
  forfeit_reason text,
  forfeiting_track integer
) RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT public.handle_bracket_forfeit(bracket_id, forfeiting_track, forfeit_reason);
$$;

-- 3) Grants
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, text, integer) TO anon;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.handle_bracket_forfeit(uuid, text, integer) TO service_role;

COMMENT ON FUNCTION public.handle_bracket_forfeit(uuid, text, integer) IS 'Wrapper overload that delegates to (uuid, integer, text) to avoid schema cache order issues.';
