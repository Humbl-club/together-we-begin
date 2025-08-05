import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { AdvancedSearch, type SearchableItem } from '@/components/search/AdvancedSearch';
import { useContentModeration, ReportModal, ContentWarning } from '@/components/moderation/ContentModeration';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { dbPerformance } from '@/services/core/DatabasePerformanceService';
import { MobileLoading } from '@/components/ui/mobile-loading';

// Import new components
import { CreatePostForm } from '@/components/social/CreatePostForm';
import { PostList } from '@/components/social/PostList';
import { StoriesBar } from '@/components/social/StoriesBar';

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
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { usePullToRefresh } = useProgressiveEnhancement();

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
      // Subscribe to posts channel
      postsChannel = supabase
        .channel('social-posts-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'social_posts'
        }, () => {
          // Debounced refetch for new posts only
          setTimeout(() => {
            fetchPosts();
            fetchStories();
          }, 1000);
        })
        .subscribe();
      
      // Subscribe to stories channel  
      storiesChannel = supabase
        .channel('stories-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'social_posts',
          filter: 'is_story=eq.true'
        }, () => {
          // Debounced refetch for stories only
          setTimeout(() => {
            fetchStories();
          }, 1000);
        })
        .subscribe();
    }
    
    // Cleanup function
    return () => {
      if (postsChannel) {
        supabase.removeChannel(postsChannel);
      }
      if (storiesChannel) {
        supabase.removeChannel(storiesChannel);
      }
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      // Fetch posts and profiles separately
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('is_story', false)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles for these posts
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Fetch likes for these posts
      const postIds = postsData?.map(post => post.id) || [];
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      if (likesError) throw likesError;

      // Store profiles and create lookup maps
      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const likesMap = likesData?.reduce((acc, like) => {
        if (!acc[like.post_id]) acc[like.post_id] = 0;
        acc[like.post_id]++;
        return acc;
      }, {} as Record<string, number>) || {};

      const userLikedSet = new Set(
        likesData?.filter(like => like.user_id === user?.id).map(like => like.post_id) || []
      );

      setProfiles(profilesMap);
      setLikeCounts(likesMap);
      setLikedPosts(userLikedSet);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      // Fetch stories and profiles separately
      const { data: storiesData, error: storiesError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('is_story', true)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Fetch profiles for these stories
      const userIds = [...new Set(storiesData?.map(story => story.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const storiesWithProfiles = storiesData?.map(story => {
        const profile = profilesData?.find(p => p.id === story.user_id) || {
          full_name: 'Unknown User',
          username: 'unknown',
          avatar_url: null
        };
        
        return {
          ...story,
          profiles: profile
        };
      }) || [];

      setStories(storiesWithProfiles);
    } catch (error) {
      console.error('Error fetching stories:', error);
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

  if (loading && posts.length === 0) {
    return (
      <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-2xl px-4 py-4'}`}>
        <MobileLoading 
          variant="skeleton"
          size={isMobile ? "md" : "lg"}
          text="Loading social feed..."
          className="glass-card p-6"
        />
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'p-mobile' : 'max-w-2xl p-mobile'} space-mobile`} data-pull-refresh>
      {/* Pull to refresh indicator - only visible on mobile */}
      {isMobile && (
        <div className="pull-refresh-indicator">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        </div>
      )}
      {/* Stories Section */}
      <StoriesBar stories={stories} isMobile={isMobile} />

      {/* Create Post Button */}
      {!showCreatePost && (
        <Card className="glass-card p-4 mb-4">
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            What's on your mind?
          </button>
        </Card>
      )}

      {/* Create Post Section */}
      {showCreatePost && (
        <CreatePostForm
          onSubmit={handleCreatePost}
          isSubmitting={isSubmitting}
          onClose={() => setShowCreatePost(false)}
        />
      )}

      {/* Posts Feed */}
      <PostList
        posts={posts}
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