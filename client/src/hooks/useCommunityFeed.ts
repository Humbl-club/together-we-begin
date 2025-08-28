import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';
import { useOptimizedRealtime } from './useOptimizedRealtime';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRateLimited } from './useRateLimited';
import { useAuth } from '@/components/auth/AuthProvider';

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
  user_liked?: boolean;
  profile_data?: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  };
}

interface PaginationState {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number | null;
}

export const useCommunityFeed = (userIdProp?: string, pageSize: number = 20) => {
  const { user } = useAuth();
  const userId = userIdProp || user?.id;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize,
    hasMore: true,
    total: null
  });
  
  const { fetchWithCache, invalidateCache } = useOptimizedData<FeedPost[]>('community-feed', 5 * 60 * 1000);
  const { currentOrganization } = useOrganization();
  const { executeWithRateLimit } = useRateLimited();
  const isInitialMount = useRef(true);

  // Fetch a single page of posts
  const fetchPostsPage = useCallback(async (page: number, append: boolean = false) => {
    if (!currentOrganization) {
      setPosts([]);
      setLoading(false);
      setPagination(prev => ({ ...prev, hasMore: false }));
      return [];
    }
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    try {
      // First get the total count if we don't have it
      if (pagination.total === null) {
        const { count } = await supabase
          .from('social_posts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'active');
        
        setPagination(prev => ({ ...prev, total: count || 0 }));
      }
      
      // Fetch the page of posts
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          id, content, created_at, image_urls, likes_count, comments_count, user_id
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (!data || data.length === 0) {
        setPagination(prev => ({ ...prev, hasMore: false }));
        return [];
      }

      // Get user profiles for this page
      const userIds = [...new Set(data.map(post => post.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formattedPosts = data.map(post => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        image_urls: post.image_urls,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        user_profile: profileMap.get(post.user_id) || { full_name: 'Community Member' }
      }));

      // Check if there are more posts
      const hasMore = data.length === pageSize && 
                      (pagination.total === null || from + data.length < pagination.total);
      
      setPagination(prev => ({
        ...prev,
        page,
        hasMore
      }));

      if (append) {
        setPosts(prev => [...prev, ...formattedPosts]);
      } else {
        setPosts(formattedPosts);
      }

      return formattedPosts;
    } catch (error) {
      console.error('Error fetching community feed page:', error);
      setPagination(prev => ({ ...prev, hasMore: false }));
      return [];
    }
  }, [currentOrganization, pageSize, pagination.total]);

  // Initial fetch (first page)
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setPagination({
      page: 0,
      pageSize,
      hasMore: true,
      total: null
    });
    
    await fetchPostsPage(0, false);
    setLoading(false);
  }, [fetchPostsPage, pageSize]);

  // Load more posts (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    const nextPage = pagination.page + 1;
    await fetchPostsPage(nextPage, true);
    setLoadingMore(false);
  }, [loadingMore, pagination.hasMore, pagination.page, fetchPostsPage]);

  // Check if we're near the bottom for infinite scroll
  const checkIfNearBottom = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    // Load more when user is within 300px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 300) {
      loadMore();
    }
  }, [loadMore]);

  // Create a new post with rate limiting
  const createPost = async (postData: { content: string; user_id: string; image_urls?: string[] }) => {
    if (!currentOrganization) {
      throw new Error('No organization selected');
    }
    
    return executeWithRateLimit(
      async () => {
        const { data, error } = await supabase
          .from('social_posts')
          .insert([{ ...postData, organization_id: currentOrganization.id }])
          .select()
          .single();

        if (error) throw error;
        
        // Invalidate cache and refresh from beginning
        invalidateCache(`community-feed-${currentOrganization.id}`);
        await fetchPosts();
        return data;
      },
      { configKey: 'posts:create', showToast: true }
    );
  };

  // Toggle like on a post with rate limiting
  const toggleLike = async (postId: string) => {
    if (!userId) {
      console.warn('toggleLike called without userId');
      return;
    }

    return executeWithRateLimit(
      async () => {
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

        // Optimistic UI update
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

        // Optimistic UI update
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ));
      }
      },
      { configKey: 'posts:like', showToast: false }
    ).catch(err => {
      console.error('Error toggling like:', err);
    });
  };

  // Handle real-time updates efficiently
  const handleRealtimeUpdate = useCallback(async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // For new posts, prepend to the list if we're on the first page
      if (pagination.page === 0) {
        const { data: newPost } = await supabase
          .from('social_posts')
          .select(`
            id, content, created_at, image_urls, likes_count, comments_count, user_id
          `)
          .eq('id', payload.new.id)
          .single();

        if (newPost) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newPost.user_id)
            .single();

          const formattedPost = {
            id: newPost.id,
            content: newPost.content,
            created_at: newPost.created_at,
            image_urls: newPost.image_urls,
            likes_count: newPost.likes_count,
            comments_count: newPost.comments_count,
            user_profile: profile || { full_name: 'Community Member' }
          };

          setPosts(prev => [formattedPost, ...prev.slice(0, pageSize - 1)]);
        }
      }
    } else if (payload.eventType === 'UPDATE') {
      // For updates, update the post in place if it exists
      setPosts(prev => prev.map(post =>
        post.id === payload.new.id
          ? { ...post, ...payload.new }
          : post
      ));
    }
  }, [pagination.page, pageSize]);

  // Optimized real-time subscription with organization filter
  useOptimizedRealtime(userId, currentOrganization ? [
    {
      table: 'social_posts',
      events: ['INSERT', 'UPDATE'],
      filter: `status=eq.active,organization_id=eq.${currentOrganization.id}`,
      onUpdate: handleRealtimeUpdate,
      debounceMs: 500
    }
  ] : []);

  // Set up infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(checkIfNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkIfNearBottom]);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchPosts();
    }
  }, [currentOrganization?.id]); // Only refetch when org changes

  return {
    posts,
    loading,
    loadingMore,
    hasMore: pagination.hasMore,
    totalPosts: pagination.total,
    currentPage: pagination.page,
    pageSize: pagination.pageSize,
    createPost,
    toggleLike,
    loadMore,
    refetch: fetchPosts
  };
};