-- Performance Optimization: Fix Auth RLS Initialization Plan Issues
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row

-- Drop existing policies for user_appearance_settings
DROP POLICY IF EXISTS "Users can view own appearance settings" ON public.user_appearance_settings;
DROP POLICY IF EXISTS "Users can insert own appearance settings" ON public.user_appearance_settings;
DROP POLICY IF EXISTS "Users can update own appearance settings" ON public.user_appearance_settings;

-- Recreate optimized policies for user_appearance_settings
CREATE POLICY "Users can view own appearance settings" 
ON public.user_appearance_settings 
FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own appearance settings" 
ON public.user_appearance_settings 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own appearance settings" 
ON public.user_appearance_settings 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- Drop existing policies for user_notification_settings
DROP POLICY IF EXISTS "Users can view own notification settings" ON public.user_notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON public.user_notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON public.user_notification_settings;

-- Recreate optimized policies for user_notification_settings
CREATE POLICY "Users can view own notification settings" 
ON public.user_notification_settings 
FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notification settings" 
ON public.user_notification_settings 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notification settings" 
ON public.user_notification_settings 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- Drop existing policies for user_wellness_settings
DROP POLICY IF EXISTS "Users can view own wellness settings" ON public.user_wellness_settings;
DROP POLICY IF EXISTS "Users can insert own wellness settings" ON public.user_wellness_settings;
DROP POLICY IF EXISTS "Users can update own wellness settings" ON public.user_wellness_settings;

-- Recreate optimized policies for user_wellness_settings
CREATE POLICY "Users can view own wellness settings" 
ON public.user_wellness_settings 
FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own wellness settings" 
ON public.user_wellness_settings 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own wellness settings" 
ON public.user_wellness_settings 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- Drop existing policies for user_social_settings
DROP POLICY IF EXISTS "Users can view own social settings" ON public.user_social_settings;
DROP POLICY IF EXISTS "Users can insert own social settings" ON public.user_social_settings;
DROP POLICY IF EXISTS "Users can update own social settings" ON public.user_social_settings;

-- Recreate optimized policies for user_social_settings
CREATE POLICY "Users can view own social settings" 
ON public.user_social_settings 
FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own social settings" 
ON public.user_social_settings 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own social settings" 
ON public.user_social_settings 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- Drop existing policies for social_posts
DROP POLICY IF EXISTS "Users can view active posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.social_posts;

-- Recreate optimized policies for social_posts
CREATE POLICY "Users can view active posts" 
ON public.social_posts 
FOR SELECT 
USING (status = 'active'::post_status);

CREATE POLICY "Users can create their own posts" 
ON public.social_posts 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.social_posts 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.social_posts 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Drop existing policies for direct_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.direct_messages;

-- Recreate optimized policies for direct_messages
CREATE POLICY "Users can view their own messages" 
ON public.direct_messages 
FOR SELECT 
USING (((select auth.uid()) = sender_id) OR ((select auth.uid()) = recipient_id));

CREATE POLICY "Users can send messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "Users can update their sent messages" 
ON public.direct_messages 
FOR UPDATE 
USING ((select auth.uid()) = sender_id);

-- Drop existing policies for message_threads
DROP POLICY IF EXISTS "Users can view their own threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can create threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON public.message_threads;

-- Recreate optimized policies for message_threads
CREATE POLICY "Users can view their own threads" 
ON public.message_threads 
FOR SELECT 
USING (((select auth.uid()) = participant_1) OR ((select auth.uid()) = participant_2));

CREATE POLICY "Users can create threads they participate in" 
ON public.message_threads 
FOR INSERT 
WITH CHECK (((select auth.uid()) = participant_1) OR ((select auth.uid()) = participant_2));

CREATE POLICY "Users can update their own threads" 
ON public.message_threads 
FOR UPDATE 
USING (((select auth.uid()) = participant_1) OR ((select auth.uid()) = participant_2));

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate optimized policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((select auth.uid()) = id);