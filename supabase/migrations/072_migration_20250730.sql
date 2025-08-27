-- Add some test content reports for moderation testing
INSERT INTO public.content_reports (
  reporter_id, 
  reported_content_id, 
  reported_content_type, 
  reason, 
  description, 
  status
) VALUES 
(
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM social_posts LIMIT 1),
  'post',
  'inappropriate_content',
  'This post contains content that may not be appropriate for our community guidelines.',
  'pending'
),
(
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM social_posts ORDER BY created_at DESC LIMIT 1),
  'post', 
  'spam',
  'This appears to be spam content.',
  'pending'
);