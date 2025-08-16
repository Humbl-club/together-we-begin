-- Purge community-related data and add integrity triggers for production readiness

-- 1) Clean up community data (posts/comments/likes/reactions/stories reports)
-- Use transaction to keep things consistent
BEGIN;

-- Delete content reports related to posts and comments first
DELETE FROM public.content_reports
WHERE reported_content_type IN ('post', 'comment');

-- Delete reactions/likes/comments before posts
DELETE FROM public.post_reactions;
DELETE FROM public.post_likes;
DELETE FROM public.post_comments;
DELETE FROM public.story_reactions;

-- Finally delete posts
DELETE FROM public.social_posts;

COMMIT;

-- 2) Ensure triggers exist to keep likes_count and comments_count in sync
-- Drop existing triggers if present to avoid duplicates
DROP TRIGGER IF EXISTS trg_update_post_likes_count ON public.post_likes;
DROP TRIGGER IF EXISTS trg_update_post_comments_count_insert ON public.post_comments;
DROP TRIGGER IF EXISTS trg_update_post_comments_count_delete ON public.post_comments;

-- Create trigger for likes count (insert/delete)
CREATE TRIGGER trg_update_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Create triggers for comments count (insert/delete)
CREATE TRIGGER trg_update_post_comments_count_insert
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER trg_update_post_comments_count_delete
AFTER DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 3) Improve realtime update fidelity for social_posts
-- Ensure full row data is published for updates (helps clients react to count changes)
ALTER TABLE public.social_posts REPLICA IDENTITY FULL;