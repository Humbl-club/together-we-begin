-- Drop all foreign key constraints that reference auth.users or profiles
ALTER TABLE public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_user_id_fkey;
ALTER TABLE public.challenge_participations DROP CONSTRAINT IF EXISTS challenge_participations_user_id_fkey;  
ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;
ALTER TABLE public.social_posts DROP CONSTRAINT IF EXISTS social_posts_user_id_fkey;
ALTER TABLE public.post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;
ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_created_by_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;

-- Now try adding the sample data
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