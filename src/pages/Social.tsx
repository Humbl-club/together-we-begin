import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRealtime } from '@/contexts/RealtimeContext';
import { supabase } from '@/integrations/supabase/client';
import { CardKit } from '@/components/ui/card-kit';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { AdvancedSearch, type SearchableItem } from '@/components/search/AdvancedSearch';
import { useContentModeration, ReportModal, ContentWarning } from '@/components/moderation/ContentModeration';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { dbPerformance } from '@/services/core/DatabasePerformanceService';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { PostWithProfile, Profile, CommentWithProfile } from '@/types/database.types';

// Import new components
import { CreatePostForm } from '@/components/social/CreatePostForm';
import { PostList } from '@/components/social/PostList';
import { StoriesBar } from '@/components/social/StoriesBar';
import { SEO } from '@/components/seo/SEO';
import { PageSection } from '@/components/sections/PageSection';
import { SectionHeader } from '@/components/sections/SectionHeader';
import { FilterChips } from '@/components/sections/FilterChips';
import { AnnouncementBanner } from '@/components/sections/AnnouncementBanner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_urls: string[] | null;
  is_story: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  expires_at: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  user_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const Social: React.FC = () => {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [stories, setStories] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [defaultIsStory, setDefaultIsStory] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { subscribeToTable } = useRealtime();
  const { toast } = useToast();
  const { isMobile, isTablet, spacing, padding, fontSize, containerClass } = useMobileOptimization();
  const { usePullToRefresh } = useProgressiveEnhancement();
  const feedback = useHapticFeedback();

  // Filters UI state (client-side only, no business logic changes)
  const [filter, setFilter] = useState<'all' | 'media' | 'trending' | 'latest'>('all');
  const displayedPosts = useMemo(() => {
    let list = [...posts];
    if (filter === 'media') {
      list = list.filter((p) => Array.isArray(p.image_urls) && p.image_urls.length > 0);
    }
    if (filter === 'latest') {
      list = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    // Trending falls back to latest for now (no server changes)
    return list;
  }, [posts, filter]);

  // Add pull to refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);

  usePullToRefresh(async () => {
    if (isRefreshing) return; // Prevent multiple refreshes
    
    setIsRefreshing(true);
    try {
      await Promise.all([fetchPosts(), fetchStories()]);
      toast({
        title: "Refreshed",
        description: "Posts and stories updated"
      });
    } catch (error) {
      console.error('Pull to refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  });

  useEffect(() => {
    let postsChannel;
    let storiesChannel;
    
    const initializeData = async () => {
      await fetchPosts();
      await fetchStories();
    };
    
    initializeData();
    
    if (user) {
      // Subscribe to posts using centralized manager
      subscribeToTable('social_posts', () => {
        setTimeout(() => {
          fetchPosts();
          fetchStories();
        }, 1000);
      });
      
      // Subscribe to stories using centralized manager
      subscribeToTable('social_posts', () => {
        setTimeout(() => {
          fetchStories();
        }, 1000);
      }, 'is_story=eq.true');
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles!user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('is_story', false)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process likes data
      if (user && data) {
        const postsWithLikes = await Promise.all(
          data.map(async (post) => {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            return {
              ...post,
              user_liked: !!likeData
            };
          })
        );
        setPosts(postsWithLikes);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error loading posts",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles!user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('is_story', true)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error loading stories",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
      setStories([]);
    }
  };

  const handleCreatePost = async (content: string, images: File[], isStory: boolean) => {
    if (!content.trim() && images.length === 0) return;
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create posts",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      let imageUrls: string[] = [];
      
      // Upload images if any
      if (images.length > 0) {
        for (const image of images) {
          const fileName = `${user.id}/${Date.now()}_${image.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, image);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);
          
          imageUrls.push(publicUrl);
        }
      }

      const postData = {
        user_id: user.id,
        content: content.trim() || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        is_story: isStory,
        expires_at: isStory ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      };

      const { error } = await supabase
        .from('social_posts')
        .insert([postData]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${isStory ? 'Story' : 'Post'} created successfully!`
      });
      
      setShowCreatePost(false);
      fetchPosts();
      if (isStory) fetchStories();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
        
        setLikedPosts(prev => new Set([...prev, postId]));
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([{ 
          post_id: postId, 
          user_id: user.id, 
          content: content.trim() 
        }]);
      
      if (error) throw error;
      
      setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const fetchComments = async (postId: string) => {
    try {
      // Optimized query using new indexes: idx_post_comments_post_id and idx_post_comments_created_at
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // This function is no longer needed as comments are handled by PostComments component
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    }
  };

  // addComment is now handled by handleComment

  const reportPost = async (postId: string) => {
    try {
      await supabase
        .from('social_posts')
        .update({ status: 'flagged' })
        .eq('id', postId);
      
      toast({
        title: "Success",
        description: "Post reported for review"
      });
      
      fetchPosts();
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({
        title: "Error",
        description: "Failed to report post",
        variant: "destructive"
      });
    }
  };

  const removePost = async (postId: string) => {
    try {
      await supabase
        .from('social_posts')
        .update({ status: 'removed' })
        .eq('id', postId);
      
      toast({
        title: "Success",
        description: "Post removed successfully"
      });
      
      fetchPosts();
    } catch (error) {
      console.error('Error removing post:', error);
      toast({
        title: "Error",
        description: "Failed to remove post",
        variant: "destructive"
      });
    }
  };

  // handleImageSelect is now handled within CreatePostForm

  if (loading) {
    return (
      <div className={`${containerClass} ${padding}`}>
        <MobileLoading 
          variant="skeleton"
          size={isMobile ? "md" : isTablet ? "lg" : "lg"}
          text="Loading social feed..."
          className={isTablet ? "tablet-card-enhanced p-8" : "glass-card p-6"}
        />
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'p-mobile' : 'max-w-2xl p-mobile'} space-mobile pb-[env(safe-area-inset-bottom,0px)]`} data-pull-refresh>
      <SEO title="Social Feed" description="Share stories, posts, and connect with your community." canonical="/social" />
      <h1 className="sr-only">Social Feed</h1>

      <PageSection surface="accent" className="mb-4 motion-safe:animate-fade-in">
        <AnnouncementBanner
          id="community-guidelines"
          title="Community Guidelines"
          message={
            <span className="text-foreground">
              Be kind, supportive, and respectful. This is a women-only space—report anything that doesn’t feel right.
            </span>
          }
          variant="info"
        />
      </PageSection>

      <PageSection className="mb-3 motion-safe:animate-fade-in">
        <SectionHeader title="Stories" subtitle="Highlights from your community" />
        <StoriesBar stories={stories} isMobile={isMobile} onAddStory={() => { feedback.tap(); setDefaultIsStory(true); setShowCreatePost(true); }} />
      </PageSection>

      {/* Composer */}
      {!showCreatePost && (
        <CardKit variant="glass" className={`${isTablet ? 'tablet-card-enhanced p-6 mb-6' : 'p-4 mb-4'}`}>
          <button
            onClick={() => { feedback.tap(); setDefaultIsStory(false); setShowCreatePost(true); }}
            className={`w-full text-left ${isTablet ? 'p-4 tablet-button' : 'p-3'} rounded-lg bg-muted hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
            aria-label="Open post composer"
          >
            <span className={isTablet ? fontSize.body : ''}>What's on your mind?</span>
          </button>
        </CardKit>
      )}

      {showCreatePost && (
        <CreatePostForm
          onSubmit={handleCreatePost}
          isSubmitting={isSubmitting}
          onClose={() => setShowCreatePost(false)}
          defaultIsStory={defaultIsStory}
        />
      )}

      {/* Feed header + filters */}
      <PageSection className="mb-3 motion-safe:animate-fade-in">
        <SectionHeader title="Community" subtitle="Latest from women near you" />
        <FilterChips
          options={[
            { value: 'all', label: 'All' },
            { value: 'media', label: 'Media' },
            { value: 'trending', label: 'Trending' },
            { value: 'latest', label: 'Latest' },
          ]}
          value={filter}
          onValueChange={(v) => setFilter(v as any)}
          size="compact"
          className="mt-1"
        />
      </PageSection>

      {/* Posts Feed */}
      <PostList
        posts={displayedPosts}
        profiles={profiles}
        currentUserId={user?.id}
        onLike={handleLike}
        onComment={handleComment}
        likeCounts={likeCounts}
        likedPosts={likedPosts}
        commentCounts={commentCounts}
        expandedComments={expandedComments}
        toggleComments={toggleComments}
        onCreatePost={() => setShowCreatePost(true)}
      />
    </div>
  );
};

export default Social;