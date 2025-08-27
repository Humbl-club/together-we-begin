-- Add walking challenge specific columns to challenges table
ALTER TABLE public.challenges 
ADD COLUMN challenge_type TEXT DEFAULT 'one_time' CHECK (challenge_type IN ('one_time', 'weekly_recurring', 'monthly_recurring')),
ADD COLUMN step_goal INTEGER DEFAULT NULL,
ADD COLUMN auto_award_enabled BOOLEAN DEFAULT false,
ADD COLUMN winner_reward_points INTEGER DEFAULT 0,
ADD COLUMN runner_up_reward_points INTEGER DEFAULT 0,
ADD COLUMN participation_reward_points INTEGER DEFAULT 0;

-- Create walking leaderboards table for efficient step tracking
CREATE TABLE public.walking_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_steps INTEGER NOT NULL DEFAULT 0,
  daily_steps JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_validated BOOLEAN DEFAULT true,
  flagged_for_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS on walking leaderboards
ALTER TABLE public.walking_leaderboards ENABLE ROW LEVEL SECURITY;

-- Create policies for walking leaderboards
CREATE POLICY "Users can view all leaderboard entries" 
ON public.walking_leaderboards 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own leaderboard entry" 
ON public.walking_leaderboards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entry" 
ON public.walking_leaderboards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create challenge cycles table for recurring challenges
CREATE TABLE public.challenge_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_user_id UUID DEFAULT NULL,
  runner_up_user_id UUID DEFAULT NULL,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on challenge cycles
ALTER TABLE public.challenge_cycles ENABLE ROW LEVEL SECURITY;

-- Create policies for challenge cycles
CREATE POLICY "Allow all access to challenge_cycles" 
ON public.challenge_cycles 
FOR ALL 
USING (true);

-- Create step validation table for anti-cheating
CREATE TABLE public.step_validation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  reported_steps INTEGER NOT NULL,
  validation_score DECIMAL(3,2) DEFAULT 1.0,
  anomaly_flags JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on step validation logs
ALTER TABLE public.step_validation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for step validation logs
CREATE POLICY "Allow all access to step_validation_logs" 
ON public.step_validation_logs 
FOR ALL 
USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_walking_leaderboards_updated_at
BEFORE UPDATE ON public.walking_leaderboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_cycles_updated_at
BEFORE UPDATE ON public.challenge_cycles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_walking_leaderboards_challenge_steps ON public.walking_leaderboards(challenge_id, total_steps DESC);
CREATE INDEX idx_walking_leaderboards_user_challenge ON public.walking_leaderboards(user_id, challenge_id);
CREATE INDEX idx_challenge_cycles_parent_status ON public.challenge_cycles(parent_challenge_id, status);
CREATE INDEX idx_step_validation_user_challenge ON public.step_validation_logs(user_id, challenge_id, timestamp);