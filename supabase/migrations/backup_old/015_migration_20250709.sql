-- Add missing triggers for automatic count updates (skip the user trigger as it exists)
DO $$
BEGIN
    -- Check and create post likes count trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_likes_count_trigger') THEN
        CREATE TRIGGER update_post_likes_count_trigger
            AFTER INSERT OR DELETE ON public.post_likes
            FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
    END IF;

    -- Check and create post comments count trigger  
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_comments_count_trigger') THEN
        CREATE TRIGGER update_post_comments_count_trigger
            AFTER INSERT OR DELETE ON public.post_comments
            FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();
    END IF;

    -- Check and create loyalty points trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_loyalty_points_trigger') THEN
        CREATE TRIGGER update_loyalty_points_trigger
            AFTER INSERT ON public.loyalty_transactions
            FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_points();
    END IF;
END $$;

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