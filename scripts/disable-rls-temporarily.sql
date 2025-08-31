-- Temporarily disable RLS on all tables to allow the app to work
-- This is for development only!

ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loyalty_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.direct_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.challenge_participations DISABLE ROW LEVEL SECURITY;

-- Create default organization if not exists
INSERT INTO public.organizations (id, name, slug, settings, max_members)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default',
  '{"theme": "default", "features": ["events", "challenges", "social", "loyalty"]}',
  10000
)
ON CONFLICT (id) DO NOTHING;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('events', 'events', true),
  ('challenges', 'challenges', true)
ON CONFLICT (id) DO NOTHING;

SELECT 'RLS disabled temporarily for development' as status;