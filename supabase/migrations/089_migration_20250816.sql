-- Fix overly-permissive RLS policies for security

-- 1. Fix notifications table - users should only see their own notifications
DROP POLICY IF EXISTS "Allow all access to notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (is_admin(auth.uid()));

-- 2. Fix performance_metrics table - should be admin-only
DROP POLICY IF EXISTS "Allow all access to performance_metrics" ON public.performance_metrics;

CREATE POLICY "Admins can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (is_admin(auth.uid()));

-- 3. Fix privacy_settings table - users should only see their own settings
DROP POLICY IF EXISTS "Allow all access to privacy_settings" ON public.privacy_settings;

CREATE POLICY "Users can view their own privacy settings" 
ON public.privacy_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" 
ON public.privacy_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" 
ON public.privacy_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Profiles table already has proper policies, but let's ensure no overly permissive ones exist
-- The existing policies are already correctly restrictive:
-- "Users can update their own profile" - USING (auth.uid() = id)
-- "Users can view all profiles" - USING (true) - This is intentionally public for community features