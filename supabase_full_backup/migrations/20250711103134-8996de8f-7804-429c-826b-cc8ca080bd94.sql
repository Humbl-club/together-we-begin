-- Temporarily disable all RLS policies for testing
-- Allow anonymous users to access all data

-- Drop existing restrictive policies and create permissive ones for all tables
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Allow all access to profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view active posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.social_posts;
CREATE POLICY "Allow all access to social_posts" ON public.social_posts FOR ALL USING (true);

DROP POLICY IF EXISTS "Everyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Allow all access to events" ON public.events FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view active challenges" ON public.challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.challenges;
CREATE POLICY "Allow all access to challenges" ON public.challenges FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own participations" ON public.challenge_participations;
DROP POLICY IF EXISTS "Users can participate in challenges" ON public.challenge_participations;
DROP POLICY IF EXISTS "Users can update own participations" ON public.challenge_participations;
CREATE POLICY "Allow all access to challenge_participations" ON public.challenge_participations FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.event_registrations;
CREATE POLICY "Allow all access to event_registrations" ON public.event_registrations FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view all comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Allow all access to post_comments" ON public.post_comments FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Allow all access to post_likes" ON public.post_likes FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Allow all access to user_roles" ON public.user_roles FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Allow all access to notifications" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.loyalty_transactions;
CREATE POLICY "Allow all access to loyalty_transactions" ON public.loyalty_transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own conversations" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.direct_messages;
CREATE POLICY "Allow all access to direct_messages" ON public.direct_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can create threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can update own threads" ON public.message_threads;
CREATE POLICY "Allow all access to message_threads" ON public.message_threads FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view others privacy settings for visibility checks" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can manage own privacy settings" ON public.privacy_settings;
CREATE POLICY "Allow all access to privacy_settings" ON public.privacy_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own integration settings" ON public.integration_settings;
CREATE POLICY "Allow all access to integration_settings" ON public.integration_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow all access to push_subscriptions" ON public.push_subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view all story reactions" ON public.story_reactions;
DROP POLICY IF EXISTS "Users can create story reactions" ON public.story_reactions;
DROP POLICY IF EXISTS "Users can delete own story reactions" ON public.story_reactions;
CREATE POLICY "Allow all access to story_reactions" ON public.story_reactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own reports" ON public.content_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.content_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.content_reports;
CREATE POLICY "Allow all access to content_reports" ON public.content_reports FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can check if they are blocked" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can manage own blocks" ON public.blocked_users;
CREATE POLICY "Allow all access to blocked_users" ON public.blocked_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view unused invites" ON public.invites;
DROP POLICY IF EXISTS "Admins can manage invites" ON public.invites;
CREATE POLICY "Allow all access to invites" ON public.invites FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.user_analytics;
CREATE POLICY "Allow all access to user_analytics" ON public.user_analytics FOR ALL USING (true);

DROP POLICY IF EXISTS "System can create performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Admins can view performance metrics" ON public.performance_metrics;
CREATE POLICY "Allow all access to performance_metrics" ON public.performance_metrics FOR ALL USING (true);