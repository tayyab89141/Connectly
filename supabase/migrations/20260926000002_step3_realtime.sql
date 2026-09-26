-- Enable Realtime for relevant tables
-- Supabase automatically sets up the 'supabase_realtime' publication.
-- We just need to add our tables to it.

DO $$
BEGIN
  -- Add tables to the publication if they are not already in it
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore duplicate table object errors
END
$$;

-- Fix profile visibility RLS to respect privacy setting
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Profiles are viewable according to visibility settings" ON public.profiles FOR SELECT USING (
  profile_visibility = 'public'
  OR auth.uid() = id
  OR (profile_visibility = 'friends' AND public.is_friend(auth.uid(), id))
);
