-- Fix RLS policies for better security
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow all access to social_posts" ON public.social_posts;
DROP POLICY IF EXISTS "Allow all access to direct_messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Allow all access to message_threads" ON public.message_threads;
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;

-- Create proper user-specific RLS policies
-- Social posts: users can only see active posts and manage their own
CREATE POLICY "Users can view active posts" 
ON public.social_posts 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own posts" 
ON public.social_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.social_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.social_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Direct messages: users can only see their own messages
CREATE POLICY "Users can view their own messages" 
ON public.direct_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Message threads: users can only see threads they participate in
CREATE POLICY "Users can view their own threads" 
ON public.message_threads 
FOR SELECT 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create threads they participate in" 
ON public.message_threads 
FOR INSERT 
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own threads" 
ON public.message_threads 
FOR UPDATE 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Profiles: users can view all profiles but only update their own
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_status ON public.social_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON public.direct_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON public.message_threads(participant_1, participant_2);

-- Enable realtime for messaging
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_threads REPLICA IDENTITY FULL;
ALTER TABLE public.social_posts REPLICA IDENTITY FULL;