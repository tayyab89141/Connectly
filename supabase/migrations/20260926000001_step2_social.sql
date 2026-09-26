-- Extend profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends')),
ADD COLUMN IF NOT EXISTS post_default_visibility TEXT DEFAULT 'public' CHECK (post_default_visibility IN ('public', 'friends', 'private'));

-- Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX posts_user_id_idx ON public.posts(user_id);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);

-- Create likes table
CREATE TABLE public.likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX likes_user_id_idx ON public.likes(user_id);

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX comments_post_id_idx ON public.comments(post_id);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')) NOT NULL,
  action_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);
-- Ensure user1_id is always less than user2_id to prevent duplicates (A->B and B->A)
ALTER TABLE public.friendships ADD CONSTRAINT check_user_order CHECK (user1_id < user2_id);

CREATE INDEX friendships_user1_idx ON public.friendships(user1_id);
CREATE INDEX friendships_user2_idx ON public.friendships(user2_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'post_like', 'post_comment')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX notifications_recipient_id_idx ON public.notifications(recipient_id);

-- Triggers for updated_at
CREATE TRIGGER handle_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if users are friends
CREATE OR REPLACE FUNCTION public.is_friend(user_a UUID, user_b UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted' 
    AND ((user1_id = user_a AND user2_id = user_b) OR (user1_id = user_b AND user2_id = user_a))
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POSTS POLICIES
CREATE POLICY "Users can create their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts." ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts." ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view public posts or friends posts." ON public.posts FOR SELECT USING (
  visibility = 'public' 
  OR auth.uid() = user_id 
  OR (visibility = 'friends' AND public.is_friend(auth.uid(), user_id))
);

-- LIKES POLICIES
CREATE POLICY "Users can view likes on visible posts." ON public.likes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id) -- Relies on posts SELECT policy
);
CREATE POLICY "Users can insert own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Users can view comments on visible posts." ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id)
);
CREATE POLICY "Users can create own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments." ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- FRIENDSHIPS POLICIES
CREATE POLICY "Users can view friendships involving themselves." ON public.friendships FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "Users can insert friendships involving themselves." ON public.friendships FOR INSERT WITH CHECK (
  auth.uid() = action_user_id AND (auth.uid() = user1_id OR auth.uid() = user2_id)
);
CREATE POLICY "Users can update friendships involving themselves." ON public.friendships FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "Users can delete friendships involving themselves." ON public.friendships FOR DELETE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications." ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can update own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Users can delete own notifications." ON public.notifications FOR DELETE USING (auth.uid() = recipient_id);

-- TRIGGERS FOR NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.notify_on_like() RETURNS trigger AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id)
    VALUES (post_author, NEW.user_id, 'post_like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_created AFTER INSERT ON public.likes FOR EACH ROW EXECUTE PROCEDURE public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_comment() RETURNS trigger AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    VALUES (post_author, NEW.user_id, 'post_comment', NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created AFTER INSERT ON public.comments FOR EACH ROW EXECUTE PROCEDURE public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_friend_request() RETURNS trigger AS $$
DECLARE
  recipient UUID;
BEGIN
  IF NEW.status = 'pending' THEN
    IF NEW.action_user_id = NEW.user1_id THEN
      recipient := NEW.user2_id;
    ELSE
      recipient := NEW.user1_id;
    END IF;
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (recipient, NEW.action_user_id, 'friend_request');
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    IF NEW.action_user_id = NEW.user1_id THEN
      recipient := NEW.user2_id;
    ELSE
      recipient := NEW.user1_id;
    END IF;
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (recipient, NEW.action_user_id, 'friend_accepted');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friendship_changed AFTER INSERT OR UPDATE ON public.friendships FOR EACH ROW EXECUTE PROCEDURE public.notify_on_friend_request();

-- STORAGE BUCKET AND POLICIES
-- NOTE: In Supabase, the storage schema must exist. Assuming 'storage' schema exists.
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own media" ON storage.objects FOR UPDATE USING (bucket_id = 'post-media' AND auth.uid() = owner);
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND auth.uid() = owner);
