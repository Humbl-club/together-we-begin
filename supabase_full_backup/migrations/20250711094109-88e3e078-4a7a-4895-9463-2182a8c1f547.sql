-- Create content reports table for user reporting system
CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_content_type TEXT NOT NULL, -- 'post', 'comment', 'user'
  reported_content_id UUID NOT NULL,
  reported_user_id UUID,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create privacy settings table
CREATE TABLE public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  profile_visibility TEXT NOT NULL DEFAULT 'public', -- 'public', 'members', 'private'
  allow_messages TEXT NOT NULL DEFAULT 'everyone', -- 'everyone', 'members', 'friends', 'none'
  show_activity_status BOOLEAN NOT NULL DEFAULT true,
  allow_location_sharing BOOLEAN NOT NULL DEFAULT false,
  allow_friend_requests BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'voice'
  media_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message threads table for organizing conversations
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL,
  participant_2 UUID NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Enable RLS on all tables
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_reports
CREATE POLICY "Users can create reports" 
ON public.content_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" 
ON public.content_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports" 
ON public.content_reports 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for privacy_settings
CREATE POLICY "Users can manage own privacy settings" 
ON public.privacy_settings 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others privacy settings for visibility checks" 
ON public.privacy_settings 
FOR SELECT 
USING (true);

-- RLS Policies for blocked_users
CREATE POLICY "Users can manage own blocks" 
ON public.blocked_users 
FOR ALL 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can check if they are blocked" 
ON public.blocked_users 
FOR SELECT 
USING (auth.uid() = blocked_id OR auth.uid() = blocker_id);

-- RLS Policies for direct_messages
CREATE POLICY "Users can send messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view own conversations" 
ON public.direct_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can update own messages" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS Policies for message_threads
CREATE POLICY "Users can view own threads" 
ON public.message_threads 
FOR SELECT 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create threads" 
ON public.message_threads 
FOR INSERT 
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own threads" 
ON public.message_threads 
FOR UPDATE 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Create indexes for better performance
CREATE INDEX idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_privacy_settings_user ON public.privacy_settings(user_id);
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient ON public.direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created ON public.direct_messages(created_at);
CREATE INDEX idx_message_threads_participants ON public.message_threads(participant_1, participant_2);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create privacy settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default privacy settings for new user
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create privacy settings
CREATE TRIGGER on_auth_user_created_privacy
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_privacy();

-- Enable realtime for new tables
ALTER TABLE public.content_reports REPLICA IDENTITY FULL;
ALTER TABLE public.privacy_settings REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_users REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_threads REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.privacy_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;