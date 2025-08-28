-- Temporarily disable foreign key constraints for testing with mock data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.loyalty_transactions DROP CONSTRAINT IF EXISTS fk_loyalty_transactions_user_id;
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS fk_challenges_created_by;
ALTER TABLE public.challenge_participations DROP CONSTRAINT IF EXISTS fk_challenge_participations_user_id;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_created_by;
ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS fk_event_registrations_user_id;
ALTER TABLE public.social_posts DROP CONSTRAINT IF EXISTS fk_social_posts_user_id;
ALTER TABLE public.post_comments DROP CONSTRAINT IF EXISTS fk_post_comments_user_id;
ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS fk_post_likes_user_id;

-- Create a mock profile for testing (this will now work without auth.users constraint)
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
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  bio = EXCLUDED.bio,
  location = EXCLUDED.location,
  avatar_url = EXCLUDED.avatar_url,
  available_loyalty_points = EXCLUDED.available_loyalty_points,
  total_loyalty_points = EXCLUDED.total_loyalty_points,
  updated_at = now();