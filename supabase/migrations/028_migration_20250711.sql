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
  expires_at,
  created_at
) VALUES
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'Just finished my morning yoga session! Feeling so energized and ready to tackle the day. Remember, self-care isn''t selfish - it''s essential! 🧘‍♀️✨', '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop"]', false, 12, 3, 'active', null, now() - interval '2 hours'),
  ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', 'Grateful for this amazing community of strong women supporting each other! The bonds we''re building here are truly special 💕', null, false, 8, 2, 'active', null, now() - interval '1 day'),
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', 'Beautiful sunrise this morning! Starting the day with gratitude ☀️', '["https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500&h=500&fit=crop"]', true, 5, 0, 'active', now() + interval '20 hours', now() - interval '3 hours'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Challenge update: Day 3 of the mindfulness challenge and I''m feeling so much more centered! Who else is participating? 🧘‍♀️', null, false, 15, 5, 'active', null, now() - interval '6 hours')
ON CONFLICT (id) DO NOTHING;

-- Add some post likes for the current user
INSERT INTO public.post_likes (
  post_id,
  user_id,
  created_at
) VALUES
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', now() - interval '1 hour'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Add some comments
INSERT INTO public.post_comments (
  post_id,
  user_id,
  content,
  created_at
) VALUES
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'Such an inspiring post! Thank you for the reminder', now() - interval '1 hour'),
  ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', 'Absolutely love this community!', now() - interval '12 hours'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Keep it up! The mindfulness challenge is amazing', now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;