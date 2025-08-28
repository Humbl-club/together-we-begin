-- Fix database performance and relationships
-- 1. Add proper foreign key constraint for social_posts -> profiles relationship
ALTER TABLE public.social_posts 
ADD CONSTRAINT social_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge_id ON public.challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user_id ON public.challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 3. Update social_posts RLS policies to be more secure
DROP POLICY IF EXISTS "Users can view active posts" ON public.social_posts;
CREATE POLICY "Users can view active posts and own posts" 
ON public.social_posts 
FOR SELECT 
USING (
  status = 'active'::post_status 
  OR (auth.uid() = user_id)
  OR is_admin(auth.uid())
);

-- 4. Add proper RLS for post_comments and post_likes
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS for post_comments
CREATE POLICY "Users can view all comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users and admins can delete comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- RLS for post_likes
CREATE POLICY "Users can view all likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- 5. Create optimized function for getting posts with profiles
CREATE OR REPLACE FUNCTION public.get_social_posts_optimized(
  limit_param integer DEFAULT 20,
  offset_param integer DEFAULT 0,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  content text,
  image_urls text[],
  likes_count integer,
  comments_count integer,
  created_at timestamp with time zone,
  is_story boolean,
  expires_at timestamp with time zone,
  status post_status,
  profile_data jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.content,
    sp.image_urls,
    sp.likes_count,
    sp.comments_count,
    sp.created_at,
    sp.is_story,
    sp.expires_at,
    sp.status,
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'username', p.username,
      'avatar_url', p.avatar_url
    ) as profile_data
  FROM public.social_posts sp
  LEFT JOIN public.profiles p ON sp.user_id = p.id
  WHERE 
    (sp.status = 'active' OR sp.user_id = auth.uid() OR is_admin(auth.uid()))
    AND (user_id_filter IS NULL OR sp.user_id = user_id_filter)
    AND (sp.expires_at IS NULL OR sp.expires_at > NOW())
  ORDER BY sp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;