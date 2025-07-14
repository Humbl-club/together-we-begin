-- Add missing foreign key indexes for invites table
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON public.invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_used_by ON public.invites(used_by);

-- Add missing foreign key indexes for user_roles table  
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);

-- Remove unused indexes on post_comments table
DROP INDEX IF EXISTS idx_post_comments_post_id;
DROP INDEX IF EXISTS idx_post_comments_user_id;
DROP INDEX IF EXISTS idx_post_comments_post_user;
DROP INDEX IF EXISTS idx_post_comments_created_at;