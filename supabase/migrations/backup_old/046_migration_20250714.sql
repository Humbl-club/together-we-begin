-- Remove all unused indexes that don't match actual query patterns
DROP INDEX IF EXISTS idx_post_comments_post_id_fk;
DROP INDEX IF EXISTS idx_post_comments_user_id_fk;
DROP INDEX IF EXISTS idx_invites_created_by_user;
DROP INDEX IF EXISTS idx_invites_used_by_user;
DROP INDEX IF EXISTS idx_user_roles_assigned_by_user;
DROP INDEX IF EXISTS idx_post_comments_post_created;
DROP INDEX IF EXISTS idx_post_comments_user_created;

-- Create ONLY indexes that support actual query patterns
-- For post_comments: queries use post_id + order by created_at
CREATE INDEX IF NOT EXISTS idx_post_comments_post_time ON public.post_comments(post_id, created_at);

-- For invites: queries use code + status, and created_at for ordering
CREATE INDEX IF NOT EXISTS idx_invites_code_status ON public.invites(code, status);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON public.invites(created_at DESC);

-- user_roles: Only accessed via has_role() function which uses user_id + role
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);