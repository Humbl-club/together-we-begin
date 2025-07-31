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
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [searchItems, setSearchItems] = useState<SearchableItem[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string>('');
  const [contentWarning, setContentWarning] = useState<{ flags: any, show: boolean }>({ flags: {}, show: false });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
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
    // Temporarily load data even without user for testing
    fetchPosts();
    fetchStories();
    if (user) {
      subscribeToRealtime();
    }
  }, [user]);

  const subscribeToRealtime = () => {
    // Optimized: Reduced frequency and specific event listening
    const channel = supabase
      .channel('social-optimized')
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public',
        table: 'social_posts',
        filter: 'status=eq.active'
      }, () => {
        // Debounced refetch for new posts only
        setTimeout(() => {
          fetchPosts();
          fetchStories();
        }, 1000);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

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

      // Combine the data
      const postsWithProfiles = postsData?.map(post => {
        const profile = profilesData?.find(p => p.id === post.user_id) || {
          full_name: 'Unknown User',
          username: 'unknown',
          avatar_url: null
        };
        const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
        
        return {
          ...post,
          profiles: profile,
          user_liked: postLikes.some(like => like.user_id === user?.id)
        };
      }) || [];

      setPosts(postsWithProfiles);
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

  const createPost = async (isStory = false) => {
    if (!newPost.trim() && selectedImages.length === 0) return;
    
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
      setLoading(true);
      
      let imageUrls: string[] = [];
      
      // Upload images if any
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
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
        content: newPost.trim() || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        is_story: isStory,
        expires_at: isStory ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      };

      const { error } = await supabase
        .from('social_posts')
        .insert([postData]);

      if (error) throw error;

      setNewPost('');
      setSelectedImages([]);
      
      toast({
        title: "Success",
        description: `${isStory ? 'Story' : 'Post'} created successfully!`
      });
      
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
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user!.id }]);
      }
      
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
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

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Batch fetch profiles for better performance with Map for O(1) lookups
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))].filter(Boolean);
      
      if (userIds.length === 0) {
        setComments(commentsData.map(comment => ({
          ...comment,
          profiles: { full_name: 'Anonymous User', username: 'anonymous', avatar_url: null }
        })));
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Use Map for O(1) profile lookups instead of O(n) find operations
      const profileMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || { 
          full_name: 'Unknown User',
          username: 'unknown',
          avatar_url: null 
        }
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !user) return;

    try {
      // Use optimized insertion with performance tracking
      await dbPerformance.insertCommentOptimized(postId, user.id, newComment);

      setNewComment('');
      fetchComments(postId);
      fetchPosts(); // Refresh to update comment count
      
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

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

      {/* Create Post Section */}
      <CreatePostForm
        newPost={newPost}
        setNewPost={setNewPost}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
        createPost={createPost}
        handleImageSelect={handleImageSelect}
        isMobile={isMobile}
      />

      {/* Posts Feed */}
      <PostList
        posts={posts}
        loading={loading}
        isMobile={isMobile}
        isAdmin={isAdmin}
        showComments={showComments}
        comments={comments}
        newComment={newComment}
        setNewComment={setNewComment}
        toggleLike={toggleLike}
        setShowComments={setShowComments}
        fetchComments={fetchComments}
        addComment={addComment}
        reportPost={reportPost}
        removePost={removePost}
      />
    </div>
  );
};

export default Social;