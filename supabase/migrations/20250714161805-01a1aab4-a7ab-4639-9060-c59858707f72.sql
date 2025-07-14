-- Create comprehensive settings tables for full functionality

-- User appearance settings table
CREATE TABLE public.user_appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  glassmorphism_enabled BOOLEAN NOT NULL DEFAULT true,
  font_size TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  animations_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User notification settings table  
CREATE TABLE public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  event_reminders BOOLEAN NOT NULL DEFAULT true,
  challenge_updates BOOLEAN NOT NULL DEFAULT true,
  social_interactions BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User wellness settings table
CREATE TABLE public.user_wellness_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_reminders BOOLEAN NOT NULL DEFAULT true,
  daily_goal_steps INTEGER NOT NULL DEFAULT 8000,
  water_reminders BOOLEAN NOT NULL DEFAULT true,
  mindfulness_reminders BOOLEAN NOT NULL DEFAULT true,
  sleep_tracking BOOLEAN NOT NULL DEFAULT false,
  health_data_sharing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User social settings table
CREATE TABLE public.user_social_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auto_follow_friends BOOLEAN NOT NULL DEFAULT true,
  content_suggestions BOOLEAN NOT NULL DEFAULT true,
  story_sharing BOOLEAN NOT NULL DEFAULT true,
  activity_visibility TEXT NOT NULL DEFAULT 'friends' CHECK (activity_visibility IN ('public', 'friends', 'private')),
  message_requests BOOLEAN NOT NULL DEFAULT true,
  group_invitations BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all settings tables
ALTER TABLE public.user_appearance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wellness_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_appearance_settings
CREATE POLICY "Users can view own appearance settings" 
ON public.user_appearance_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appearance settings" 
ON public.user_appearance_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appearance settings" 
ON public.user_appearance_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_notification_settings
CREATE POLICY "Users can view own notification settings" 
ON public.user_notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" 
ON public.user_notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" 
ON public.user_notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_wellness_settings
CREATE POLICY "Users can view own wellness settings" 
ON public.user_wellness_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness settings" 
ON public.user_wellness_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness settings" 
ON public.user_wellness_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_social_settings
CREATE POLICY "Users can view own social settings" 
ON public.user_social_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social settings" 
ON public.user_social_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social settings" 
ON public.user_social_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_appearance_settings_updated_at
BEFORE UPDATE ON public.user_appearance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at
BEFORE UPDATE ON public.user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wellness_settings_updated_at
BEFORE UPDATE ON public.user_wellness_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_social_settings_updated_at
BEFORE UPDATE ON public.user_social_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create default appearance settings
  INSERT INTO public.user_appearance_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default notification settings
  INSERT INTO public.user_notification_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default wellness settings
  INSERT INTO public.user_wellness_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default social settings
  INSERT INTO public.user_social_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Update the existing trigger to include settings creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- Fix storage bucket policies for photo uploads
CREATE POLICY "Allow authenticated users to upload to posts bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to view posts bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Allow users to update their own posts" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own posts" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);