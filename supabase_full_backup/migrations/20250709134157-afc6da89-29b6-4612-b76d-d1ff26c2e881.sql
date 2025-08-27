-- Add foreign key constraints to establish proper relationships between tables

-- Add foreign key from social_posts to profiles
ALTER TABLE public.social_posts 
ADD CONSTRAINT fk_social_posts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from post_comments to profiles
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from post_comments to social_posts
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_post_id 
FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;

-- Add foreign key from post_likes to profiles
ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from post_likes to social_posts
ALTER TABLE public.post_likes 
ADD CONSTRAINT fk_post_likes_post_id 
FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;

-- Add foreign key from challenge_participations to profiles
ALTER TABLE public.challenge_participations 
ADD CONSTRAINT fk_challenge_participations_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from challenge_participations to challenges
ALTER TABLE public.challenge_participations 
ADD CONSTRAINT fk_challenge_participations_challenge_id 
FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

-- Add foreign key from event_registrations to profiles
ALTER TABLE public.event_registrations 
ADD CONSTRAINT fk_event_registrations_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from event_registrations to events
ALTER TABLE public.event_registrations 
ADD CONSTRAINT fk_event_registrations_event_id 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Add foreign key from loyalty_transactions to profiles
ALTER TABLE public.loyalty_transactions 
ADD CONSTRAINT fk_loyalty_transactions_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from challenges to profiles (created_by)
ALTER TABLE public.challenges 
ADD CONSTRAINT fk_challenges_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key from events to profiles (created_by)
ALTER TABLE public.events 
ADD CONSTRAINT fk_events_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key from invites to profiles (created_by)
ALTER TABLE public.invites 
ADD CONSTRAINT fk_invites_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key from invites to profiles (used_by)
ALTER TABLE public.invites 
ADD CONSTRAINT fk_invites_used_by 
FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key from user_roles to profiles
ALTER TABLE public.user_roles 
ADD CONSTRAINT fk_user_roles_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from user_roles to profiles (assigned_by)
ALTER TABLE public.user_roles 
ADD CONSTRAINT fk_user_roles_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;