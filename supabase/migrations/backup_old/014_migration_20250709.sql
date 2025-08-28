-- Create trigger to automatically create user profiles when users sign up (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing triggers for automatic count updates (drop if exist first)
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.post_likes;
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.post_comments;
CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

DROP TRIGGER IF EXISTS update_loyalty_points_trigger ON public.loyalty_transactions;
CREATE TRIGGER update_loyalty_points_trigger
  AFTER INSERT ON public.loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_points();

-- Enable realtime for key tables
ALTER TABLE public.social_posts REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.challenges REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication (check if not already added)
DO $$
BEGIN
    -- Check if tables are not already in publication before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'social_posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'challenges'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;