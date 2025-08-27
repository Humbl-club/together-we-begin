-- Remove unused composite indexes that don't match actual usage
DROP INDEX IF EXISTS idx_post_comments_post_time;
DROP INDEX IF EXISTS idx_invites_code_status;  
DROP INDEX IF EXISTS idx_invites_created_at;
DROP INDEX IF EXISTS idx_user_roles_user_role;

-- Create simple single-column indexes ONLY for foreign key constraints
-- These are needed for foreign key constraint performance, not query optimization
CREATE INDEX IF NOT EXISTS idx_invites_created_by_fk ON public.invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_used_by_fk ON public.invites(used_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by_fk ON public.user_roles(assigned_by);

-- For post_comments, create index only for the actual query pattern used
-- Based on the code analysis: WHERE post_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_time ON public.post_comments(post_id, created_at);