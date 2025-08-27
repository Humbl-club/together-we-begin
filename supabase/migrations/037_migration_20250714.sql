-- Add missing foreign key indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_created_by ON public.invites (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_used_by ON public.invites (used_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles (assigned_by);

-- Remove unused indexes to reduce storage overhead and maintenance cost
DROP INDEX CONCURRENTLY IF EXISTS idx_content_reports_reporter;
DROP INDEX CONCURRENTLY IF EXISTS idx_content_reports_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_blocked_users_blocked;
DROP INDEX CONCURRENTLY IF EXISTS idx_direct_messages_sender;
DROP INDEX CONCURRENTLY IF EXISTS idx_direct_messages_recipient;
DROP INDEX CONCURRENTLY IF EXISTS idx_direct_messages_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_story_reactions_story_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_user_analytics_user_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_push_subscriptions_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_performance_metrics_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_social_posts_status_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_social_posts_user_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_status_start_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_challenges_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_post_comments_post_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_status_time_composite;
DROP INDEX CONCURRENTLY IF EXISTS idx_social_posts_user_status_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_challenge_participations_user_completed;
DROP INDEX CONCURRENTLY IF EXISTS idx_loyalty_transactions_user_type_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_upcoming_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_challenges_active_only;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_search;
DROP INDEX CONCURRENTLY IF EXISTS idx_posts_search;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_search;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_created_by_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_event_registrations_user_event;
DROP INDEX CONCURRENTLY IF EXISTS idx_social_posts_user_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_challenges_status_dates;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_updated_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_user_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_read_status;