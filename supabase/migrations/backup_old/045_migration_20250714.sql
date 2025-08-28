-- Create indexes for foreign keys that are actually used in queries
-- Based on application query patterns, these indexes are needed:

-- Invites table - used for invite management queries
CREATE INDEX IF NOT EXISTS idx_invites_created_by_user ON public.invites(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invites_used_by_user ON public.invites(used_by) WHERE used_by IS NOT NULL;

-- User roles table - used for role checking queries 
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by_user ON public.user_roles(assigned_by) WHERE assigned_by IS NOT NULL;

-- Post comments table - these are actively used in social features
-- Keep the existing indexes as they support comment queries
-- Do NOT remove idx_post_comments_post_id_fk and idx_post_comments_user_id_fk as they will be used

-- Add composite index for common comment query patterns
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_created ON public.post_comments(user_id, created_at DESC);