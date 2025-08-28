-- Create notification system tables
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'message', 'like', 'comment', 'event', 'challenge', 'friend_request'
  title TEXT NOT NULL,
  content TEXT,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story reactions table
CREATE TABLE public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL, -- emoji reaction
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Create user analytics table
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  posts_created INTEGER DEFAULT 0,
  posts_liked INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  stories_viewed INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create integration settings table
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  fitness_tracker_type TEXT, -- 'fitbit', 'apple_health', 'google_fit'
  fitness_tracker_token TEXT,
  social_media_crosspost BOOLEAN DEFAULT false,
  calendar_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance monitoring table
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  page_url TEXT NOT NULL,
  load_time_ms INTEGER NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for story_reactions
CREATE POLICY "Users can view all story reactions" 
ON public.story_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create story reactions" 
ON public.story_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own story reactions" 
ON public.story_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for user_analytics
CREATE POLICY "Users can view own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" 
ON public.user_analytics 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "System can manage analytics" 
ON public.user_analytics 
FOR ALL 
USING (true);

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for integration_settings
CREATE POLICY "Users can manage own integration settings" 
ON public.integration_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for performance_metrics
CREATE POLICY "System can create performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX idx_user_analytics_user_date ON public.user_analytics(user_id, date);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.story_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.user_analytics REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_analytics;