-- Remove mock social posts from production
DELETE FROM public.social_posts WHERE id IN (
  '6dd5d215-07cb-4070-82cc-47c67a49f1a7',
  '55855399-1ef8-43a7-b597-1a7fd9cd7a8a', 
  '9bfb5d31-0419-46ea-8943-11afa8bcd17c'
);

-- Also remove any associated likes/comments for these posts
DELETE FROM public.post_likes WHERE post_id IN (
  '6dd5d215-07cb-4070-82cc-47c67a49f1a7',
  '55855399-1ef8-43a7-b597-1a7fd9cd7a8a', 
  '9bfb5d31-0419-46ea-8943-11afa8bcd17c'
);

DELETE FROM public.post_comments WHERE post_id IN (
  '6dd5d215-07cb-4070-82cc-47c67a49f1a7',
  '55855399-1ef8-43a7-b597-1a7fd9cd7a8a', 
  '9bfb5d31-0419-46ea-8943-11afa8bcd17c'
);