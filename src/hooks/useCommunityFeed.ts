import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';
import { useOptimizedRealtime } from './useOptimizedRealtime';

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
          .limit(20);

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
          user_profile: profileMap.get(post.user_id) || { full_name: 'Community Member' }
        }));
      });

      setPosts(feedPosts);
    } catch (error) {
      console.error('Error fetching community feed:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchWithCache]);

  const createPost = async (postData: { content: string; user_id: string; image_urls?: string[] }) => {
    const { data, error } = await supabase
      .from('social_posts')
      .insert([postData])
      .select()
      .single();

    if (error) throw error;
    
    // Refresh posts after creating
    await fetchPosts();
    return data;
  };

  const toggleLike = async (postId: string) => {
    if (!userId) {
      console.warn('toggleLike called without userId');
      return;
    }

    try {
      // Check if user already liked the post
      const { data: existingLike, error: likeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (likeCheckError) throw likeCheckError;

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
        if (deleteError) throw deleteError;

        // Optimistic UI
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: Math.max(0, post.likes_count - 1) }
            : post
        ));
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userId }]);
        if (insertError) throw insertError;

        // Optimistic UI
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Optimized real-time subscription
  useOptimizedRealtime(userId, [
    {
      table: 'social_posts',
      events: ['INSERT', 'UPDATE'],
      filter: 'status=eq.active',
      onUpdate: () => fetchPosts(),
      debounceMs: 1000
    }
  ]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    createPost,
    toggleLike,
    refetch: fetchPosts
  };
};