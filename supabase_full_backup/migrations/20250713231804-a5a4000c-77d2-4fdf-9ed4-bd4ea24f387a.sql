-- Create indexes for better query performance

-- Index for social_posts queries (status, created_at for ordering)
CREATE INDEX IF NOT EXISTS idx_social_posts_status_created_at 
ON public.social_posts(status, created_at DESC);

-- Index for social_posts by user_id and status
CREATE INDEX IF NOT EXISTS idx_social_posts_user_status 
ON public.social_posts(user_id, status);

-- Index for events by status and start_time
CREATE INDEX IF NOT EXISTS idx_events_status_start_time 
ON public.events(status, start_time);

-- Index for challenges by status
CREATE INDEX IF NOT EXISTS idx_challenges_status 
ON public.challenges(status);

-- Optimize post_likes for counting
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id 
ON public.post_likes(post_id);

-- Optimize post_comments for counting
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id 
ON public.post_comments(post_id);