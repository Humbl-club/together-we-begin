-- Add missing foreign key indexes for post_comments table
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_fk ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id_fk ON public.post_comments(user_id);

-- Remove unused indexes that were just created
DROP INDEX IF EXISTS idx_invites_created_by;
DROP INDEX IF EXISTS idx_invites_used_by;
DROP INDEX IF EXISTS idx_user_roles_assigned_by;