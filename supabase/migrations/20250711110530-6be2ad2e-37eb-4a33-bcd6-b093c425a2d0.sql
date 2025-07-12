-- Add sample loyalty transactions
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
  ('550e8400-e29b-41d4-a716-446655440000', 'earned', 25, 'Daily check-in streak', 'activity', now() - interval '1 day'),
  ('550e8400-e29b-41d4-a716-446655440000', 'earned', 30, 'Community engagement bonus', 'social', now() - interval '2 days')
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
  ('550e8400-e29b-41d4-a716-446655440001', 'Spring Steps Challenge', 'Walk 10,000 steps daily for a week', 'Step Master', 100, 'completed', now() - interval '14 days', now() - interval '7 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '14 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mindful Moments', 'Complete 5 minutes of meditation daily', 'Zen Warrior', 75, 'active', now() - interval '3 days', now() + interval '4 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Water Warriors', 'Drink 8 glasses of water daily', 'Hydration Hero', 50, 'active', now() - interval '1 day', now() + interval '6 days', '550e8400-e29b-41d4-a716-446655440000', now() - interval '1 day')
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
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', true, now() - interval '7 days', now() - interval '14 days', '{"steps_completed": 7, "total_steps": 7}'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', false, null, now() - interval '3 days', '{"days_completed": 2, "total_days": 5}')
ON CONFLICT (user_id, challenge_id) DO NOTHING;