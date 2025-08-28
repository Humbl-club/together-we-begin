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

-- Add challenge participations
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

-- Create sample events
INSERT INTO public.events (
  id,
  title,
  description,
  location,
  start_time,
  end_time,
  max_capacity,
  current_capacity,
  price_cents,
  status,
  created_by,
  created_at
) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'Morning Yoga Session', 'Start your day with peaceful yoga and meditation in a beautiful studio setting', 'Central Park Studio', now() + interval '2 days', now() + interval '2 days' + interval '1 hour', 20, 12, 1500, 'upcoming', '550e8400-e29b-41d4-a716-446655440000', now()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Women in Business Networking', 'Connect with inspiring female entrepreneurs and business leaders', 'Downtown Conference Center', now() + interval '5 days', now() + interval '5 days' + interval '2 hours', 50, 23, 2500, 'upcoming', '550e8400-e29b-41d4-a716-446655440000', now()),
  ('550e8400-e29b-41d4-a716-446655440006', 'Self-Care Sunday Workshop', 'Learn practical self-care techniques for busy women', 'Wellness Center', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 30, 18, 3000, 'upcoming', '550e8400-e29b-41d4-a716-446655440000', now())
ON CONFLICT (id) DO NOTHING;