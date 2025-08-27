-- Performance Optimization: Add missing foreign key indexes and remove unused ones

-- 1. ADD MISSING FOREIGN KEY INDEXES for post_comments table
-- These indexes will significantly improve JOIN performance when querying comments with posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_post_id 
ON public.post_comments (post_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_user_id 
ON public.post_comments (user_id);

-- 2. REMOVE UNUSED INDEXES that are consuming storage without benefit
-- These indexes have never been used according to database statistics
DROP INDEX CONCURRENTLY IF EXISTS public.idx_invites_created_by;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_invites_used_by;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_roles_assigned_by;

-- 3. ADD COMPOSITE INDEX for better post comment queries
-- This will optimize queries that filter by both post_id and user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_post_user 
ON public.post_comments (post_id, user_id);

-- 4. ADD INDEX for post_comments created_at for chronological queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_created_at 
ON public.post_comments (created_at DESC);

-- Performance note: CONCURRENTLY ensures indexes are built without locking tables