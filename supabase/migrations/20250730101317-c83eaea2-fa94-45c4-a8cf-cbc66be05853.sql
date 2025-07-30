-- Add some test data for posts, likes and comments
INSERT INTO social_posts (user_id, content, image_urls, likes_count, comments_count, status) VALUES
(
  (SELECT id FROM profiles LIMIT 1),
  'Welcome to our amazing community! 🌟 So excited to connect with all of you wonderful women. Let''s support each other and share our journeys together! 💪✨',
  NULL,
  8,
  3,
  'active'
),
(
  (SELECT id FROM profiles LIMIT 1),
  'Just finished an amazing morning workout! Who else is crushing their fitness goals today? 🏃‍♀️💪 #MorningMotivation #FitnessJourney',
  ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center'],
  12,
  5,
  'active'
),
(
  (SELECT id FROM profiles LIMIT 1),
  'Coffee date with myself this morning ☕️ Sometimes self-care means taking a moment to just breathe and enjoy the little things. What''s your favorite way to practice self-care?',
  ARRAY['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&crop=center'],
  15,
  7,
  'active'
);

-- Add some test likes
INSERT INTO post_likes (post_id, user_id) 
SELECT 
  sp.id as post_id,
  p.id as user_id
FROM social_posts sp
CROSS JOIN profiles p
WHERE sp.content LIKE '%Welcome to our amazing community%'
LIMIT 8;

INSERT INTO post_likes (post_id, user_id) 
SELECT 
  sp.id as post_id,
  p.id as user_id
FROM social_posts sp
CROSS JOIN profiles p
WHERE sp.content LIKE '%morning workout%'
LIMIT 12;

-- Add some test comments
INSERT INTO post_comments (post_id, user_id, content) VALUES
(
  (SELECT id FROM social_posts WHERE content LIKE '%Welcome to our amazing community%' LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'Thank you for creating such a welcoming space! 💕'
),
(
  (SELECT id FROM social_posts WHERE content LIKE '%Welcome to our amazing community%' LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'So grateful to be part of this community! 🙏'
),
(
  (SELECT id FROM social_posts WHERE content LIKE '%morning workout%' LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'You''re such an inspiration! What workout did you do? 🤸‍♀️'
),
(
  (SELECT id FROM social_posts WHERE content LIKE '%morning workout%' LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'Love the energy! I''m motivated to hit the gym now 💪'
),
(
  (SELECT id FROM social_posts WHERE content LIKE '%Coffee date%' LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'Self-care is so important! I love taking bubble baths 🛁'
);