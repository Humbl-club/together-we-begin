-- Create sample data without foreign key constraints to auth.users
-- Since we're using mock auth, we'll work around the foreign key constraint

-- Create sample challenges first (no user dependency)
INSERT INTO public.challenges (
  id,
  title,
  description,
  badge_name,
  points_reward,
  status,
  start_date,
  end_date,
  created_at
) VALUES
  ('challenge-1', 'Spring Steps Challenge', 'Walk 10,000 steps daily for a week', 'Step Master', 100, 'completed', now() - interval '14 days', now() - interval '7 days', now() - interval '14 days'),
  ('challenge-2', 'Mindful Moments', 'Complete 5 minutes of meditation daily', 'Zen Warrior', 75, 'active', now() - interval '3 days', now() + interval '4 days', now() - interval '3 days'),
  ('challenge-3', 'Water Warriors', 'Drink 8 glasses of water daily', 'Hydration Hero', 50, 'active', now() - interval '1 day', now() + interval '6 days', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

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
  created_at
) VALUES
  ('event-1', 'Morning Yoga Session', 'Start your day with peaceful yoga and meditation', 'Central Park Studio', now() + interval '2 days', now() + interval '2 days' + interval '1 hour', 20, 12, 1500, 'upcoming', now()),
  ('event-2', 'Women in Business Networking', 'Connect with inspiring female entrepreneurs', 'Downtown Conference Center', now() + interval '5 days', now() + interval '5 days' + interval '2 hours', 50, 23, 2500, 'upcoming', now()),
  ('event-3', 'Self-Care Sunday Workshop', 'Learn practical self-care techniques for busy women', 'Wellness Center', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 30, 18, 3000, 'upcoming', now())
ON CONFLICT (id) DO NOTHING;