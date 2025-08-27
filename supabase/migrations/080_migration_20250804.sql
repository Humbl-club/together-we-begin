-- Create health_data table for storing user wellness metrics
CREATE TABLE public.health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  distance_km DECIMAL(5,2) DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  active_minutes INTEGER DEFAULT 0,
  sleep_hours DECIMAL(3,1) DEFAULT 0,
  water_glasses INTEGER DEFAULT 0,
  weight_kg DECIMAL(5,2),
  heart_rate_avg INTEGER,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own health data" 
ON public.health_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data" 
ON public.health_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data" 
ON public.health_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data" 
ON public.health_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_goals table for personalized targets
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL, -- 'daily_steps', 'weekly_exercise', 'water_intake', 'sleep_hours', etc.
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT NOT NULL, -- 'steps', 'hours', 'glasses', 'minutes', etc.
  period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own goals" 
ON public.user_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON public.user_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.user_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.user_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_achievements table for tracking accomplishments
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL, -- 'first_goal_reached', 'streak_7_days', 'step_milestone', etc.
  achievement_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  badge_image_url TEXT,
  is_milestone BOOLEAN DEFAULT false,
  points_awarded INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add update trigger for timestamps
CREATE TRIGGER update_health_data_updated_at
BEFORE UPDATE ON public.health_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();