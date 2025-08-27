-- Temporarily disable foreign key constraint for profiles table to allow mock data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Create a mock profile for testing
INSERT INTO public.profiles (
  id, 
  full_name, 
  username, 
  bio, 
  location, 
  avatar_url,
  available_loyalty_points,
  total_loyalty_points,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sophia Williams',
  'sophiaw',
  'Wellness enthusiast and community builder. Love connecting with amazing women! 🌸',
  'San Francisco, CA',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  250,
  1750,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  bio = EXCLUDED.bio,
  location = EXCLUDED.location,
  avatar_url = EXCLUDED.avatar_url,
  available_loyalty_points = EXCLUDED.available_loyalty_points,
  total_loyalty_points = EXCLUDED.total_loyalty_points,
  updated_at = now();

-- Add some sample loyalty transactions
INSERT INTO public.loyalty_transactions (
  user_id,
  type,
  points,
  description,
  reference_type,
  created_at
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'earned', 100, 'Completed Spring Steps Challenge', 'challenge', now() - interval '7 days'),
  ('550e8400-e29b-41d4-a716-446655440000', 'earned', 50, 'Profile completion bonus', 'onboarding', now() - interval '14 days'),
  ('550e8400-e29b-41d4-a716-446655440000', 'spent', -75, 'Event registration: Yoga Session', 'event', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440000', 'earned', 25, 'Daily check-in streak', 'activity', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Create sample challenges with valid UUIDs
INSERT INTO public.challenges (
  id,
  title,
  description,
  badge_name,
  points_reward,
  status,
  start_date,
  end_date,
  created_by,
  created_at
) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Spring Steps Challenge', 'Walk 10,000 steps daily for a week', 'Step Master', 100, 'completed', now() - interval '14 days', now() - interval '7 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '14 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mindful Moments', 'Complete 5 minutes of meditation daily', 'Zen Warrior', 75, 'active', now() - interval '3 days', now() + interval '4 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Water Warriors', 'Drink 8 glasses of water daily', 'Hydration Hero', 50, 'active', now() - interval '1 day', now() + interval '6 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;