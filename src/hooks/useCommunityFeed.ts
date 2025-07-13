import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  image_urls?: string[];
  likes_count: number;
  comments_count: number;
  user_profile: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useCommunityFeed = (userId?: string) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchWithCache } = useOptimizedData<FeedPost[]>('community-feed', 5 * 60 * 1000);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;

    const cacheKey = 'community-feed';
    try {
      const feedPosts = await fetchWithCache(cacheKey, async () => {
        const { data } = await supabase
          .from('social_posts')
          .select(`
            id, content, created_at, image_urls, likes_count, comments_count, user_id
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!data) return [];

        // Get user profiles separately
        const userIds = [...new Set(data.map(post => post.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return data.map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          image_urls: post.image_urls,
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          user_profile: profileMap.get(post.user_id) || { full_name: 'Unknown User' }
        }));
      });

      setPosts(feedPosts);
    } catch (error) {
      console.error('Error fetching community feed:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchWithCache]);

  // Real-time subscription for new posts
  useRealtimeSubscription(userId, [
    {
      table: 'social_posts',
      event: 'INSERT',
      filter: `status=eq.active`,
      onUpdate: () => fetchPosts()
    }
  ]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    refetch: fetchPosts
  };
};