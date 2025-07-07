-- Fix award_votes RLS policies to allow upsert operations
-- Add UPDATE policy so users can update their own votes

-- Allow users to update their own votes
CREATE POLICY "Users can update their own votes" ON public.award_votes
  FOR UPDATE USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

-- Also allow users to delete their own votes (for good measure)
CREATE POLICY "Users can delete their own votes" ON public.award_votes
  FOR DELETE USING (auth.uid() = voter_id);