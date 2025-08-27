-- First, create a mock profile for our test user
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

-- Create sample challenges
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
  ('challenge-1', 'Spring Steps Challenge', 'Walk 10,000 steps daily for a week', 'Step Master', 100, 'completed', now() - interval '14 days', now() - interval '7 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '14 days'),
  ('challenge-2', 'Mindful Moments', 'Complete 5 minutes of meditation daily', 'Zen Warrior', 75, 'active', now() - interval '3 days', now() + interval '4 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Add challenge participation
INSERT INTO public.challenge_participations (
  user_id,
  challenge_id,
  completed,
  completion_date,
  joined_at,
  progress_data
) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'challenge-1', true, now() - interval '7 days', now() - interval '14 days', '{"steps_completed": 7, "total_steps": 7}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'challenge-2', false, null, now() - interval '3 days', '{"days_completed": 2, "total_days": 5}')
ON CONFLICT (user_id, challenge_id) DO NOTHING;

-- Create sample social posts
INSERT INTO public.social_posts (
  id,
  user_id,
  content,
  image_urls,
  is_story,
  likes_count,
  comments_count,
  status,
  created_at
) VALUES
  ('post-1', '550e8400-e29b-41d4-a716-446655440000', 'Just finished my morning yoga session! Feeling so energized and ready to tackle the day. Remember, self-care isn''t selfish - it''s essential! 🧘‍♀️✨', '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop"]', false, 12, 3, 'active', now() - interval '2 hours'),
  ('post-2', '550e8400-e29b-41d4-a716-446655440000', 'Grateful for this amazing community of strong women supporting each other! 💕', null, false, 8, 2, 'active', now() - interval '1 day'),
  ('story-1', '550e8400-e29b-41d4-a716-446655440000', 'Beautiful sunrise this morning! ☀️', '["https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500&h=500&fit=crop"]', true, 5, 0, 'active', now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Set proper expires_at for stories
UPDATE public.social_posts 
SET expires_at = created_at + interval '24 hours'
WHERE is_story = true AND expires_at IS NULL;