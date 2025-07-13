import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, Camera, MoreHorizontal, Flag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { AdvancedSearch, type SearchableItem } from '@/components/search/AdvancedSearch';
import { useContentModeration, ReportModal, ContentWarning } from '@/components/moderation/ContentModeration';
import { useIsMobile } from '@/hooks/use-mobile';

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

  useEffect(() => {
    // Temporarily load data even without user for testing
    fetchPosts();
    fetchStories();
    if (user) {
      subscribeToRealtime();
    }
  }, [user]);

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel('social-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'social_posts'
      }, () => {
        fetchPosts();
        fetchStories();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, () => {
        fetchPosts();
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

    try {
      setLoading(true);
      
      let imageUrls: string[] = [];
      
      // Upload images if any
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const fileName = `${Date.now()}_${image.name}`;
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
        user_id: user!.id,
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
      // Fetch comments and profiles separately
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch profiles for these comments
      const userIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const commentsWithProfiles = commentsData?.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.user_id) || {
          full_name: 'Unknown User',
          username: 'unknown',
          avatar_url: null
        };
        
        return {
          ...comment,
          profiles: profile
        };
      }) || [];

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: user!.id,
          content: newComment.trim()
        }]);

      if (error) throw error;

      setNewComment('');
      fetchComments(postId);
      fetchPosts(); // Refresh to update comment count
      
      toast({
        title: "Success",
        description: "Comment added successfully!"
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
      <div className="container mx-auto max-w-2xl adaptive-card">
        <Card className="editorial-card">
          <CardContent className="text-center py-12">
            <div className="animate-pulse space-y-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <div className="space-y-2">
                <div className="bg-muted rounded aspect-card"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4">Loading social feed...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'max-w-2xl px-4 py-4'} space-y-${isMobile ? '4' : '6'}`}>
      {/* Stories Section */}
      {stories.length > 0 && (
        <Card className="glass-card">
          <CardHeader className={isMobile ? 'pb-3' : ''}>
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>Stories</CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'pt-0' : ''}>
            <div className={`flex gap-${isMobile ? '3' : '4'} overflow-x-auto pb-2`}>
              {stories.map((story) => (
                <div key={story.id} className="flex-shrink-0 text-center">
                  <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full bg-gradient-primary p-1`}>
                    <Avatar className="w-full h-full">
                      <AvatarImage src={story.profiles.avatar_url} />
                      <AvatarFallback className={isMobile ? 'text-xs' : ''}>
                        {story.profiles.full_name?.charAt(0) || story.profiles.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className={`text-xs mt-1 truncate ${isMobile ? 'w-14' : 'w-16'}`}>
                    {story.profiles.username || story.profiles.full_name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Post Section */}
      <Card className="glass-card">
        <CardContent className={isMobile ? 'pt-4' : 'pt-6'}>
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="post" className={isMobile ? 'text-sm' : ''}>
                {isMobile ? 'Post' : 'Create Post'}
              </TabsTrigger>
              <TabsTrigger value="story" className={isMobile ? 'text-sm' : ''}>
                {isMobile ? 'Story' : 'Create Story'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="post" className={`space-y-${isMobile ? '3' : '4'}`}>
              <Textarea
                placeholder="Share your thoughts with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className={`${isMobile ? 'min-h-[80px] text-sm' : 'min-h-[100px]'}`}
              />
              
              <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
                <div className={`flex gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                  <Button
                    variant="outline"
                    size={isMobile ? 'sm' : 'sm'}
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className={isMobile ? 'flex-1' : ''}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isMobile ? `Photos (${selectedImages.length}/5)` : `Photos (${selectedImages.length}/5)`}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                
                <Button
                  onClick={() => createPost(false)}
                  disabled={!newPost.trim() && selectedImages.length === 0}
                  className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
                >
                  {isMobile ? 'Share' : 'Share Post'}
                </Button>
              </div>
              
              {selectedImages.length > 0 && (
                <div className={`flex gap-2 flex-wrap ${isMobile ? 'justify-center' : ''}`}>
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover rounded-lg`}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className={`absolute -top-2 -right-2 ${isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6'} rounded-full p-0`}
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="story" className={`space-y-${isMobile ? '3' : '4'}`}>
              <Textarea
                placeholder="Share a 24-hour story..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className={`${isMobile ? 'min-h-[80px] text-sm' : 'min-h-[100px]'}`}
              />
              
              <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
                <div className={`flex gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('story-image-upload')?.click()}
                    className={isMobile ? 'flex-1' : ''}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isMobile ? `Photos (${selectedImages.length}/5)` : `Photos (${selectedImages.length}/5)`}
                  </Button>
                  <input
                    id="story-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                
                <Button
                  onClick={() => createPost(true)}
                  disabled={!newPost.trim() && selectedImages.length === 0}
                  className={`bg-gradient-primary text-white ${isMobile ? 'w-full' : ''}`}
                >
                  {isMobile ? 'Share' : 'Share Story'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className={`space-y-${isMobile ? '4' : '6'}`}>
        {posts.map((post) => (
          <Card key={post.id} className="glass-card">
            <CardHeader className={isMobile ? 'pb-3' : 'pb-4'}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-${isMobile ? '2' : '3'}`}>
                  <Avatar className={isMobile ? 'w-10 h-10' : ''}>
                    <AvatarImage src={post.profiles.avatar_url} />
                    <AvatarFallback className={isMobile ? 'text-sm' : ''}>
                      {post.profiles.full_name?.charAt(0) || post.profiles.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                      {post.profiles.full_name || post.profiles.username}
                    </h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-${isMobile ? '1' : '2'}`}>
                  {post.is_story && (
                    <Badge variant="secondary" className={isMobile ? 'text-xs px-2 py-1' : ''}>
                      Story
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size={isMobile ? 'sm' : 'sm'}
                    onClick={() => reportPost(post.id)}
                  >
                    <Flag className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size={isMobile ? 'sm' : 'sm'}
                      onClick={() => removePost(post.id)}
                    >
                      <MoreHorizontal className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className={`space-y-${isMobile ? '3' : '4'}`}>
              {post.content && (
                <p className={`text-foreground ${isMobile ? 'text-sm leading-relaxed' : ''}`}>
                  {post.content}
                </p>
              )}
              
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {post.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className={`w-full h-auto rounded-lg object-cover ${isMobile ? 'max-h-80' : 'max-h-96'}`}
                    />
                  ))}
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-${isMobile ? '2' : '4'}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id, post.user_liked || false)}
                    className={`${post.user_liked ? 'text-red-500' : ''} ${isMobile ? 'px-2' : ''}`}
                  >
                    <Heart className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} ${post.user_liked ? 'fill-current' : ''}`} />
                    <span className={isMobile ? 'text-xs' : ''}>{post.likes_count}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (showComments === post.id) {
                        setShowComments(null);
                      } else {
                        setShowComments(post.id);
                        fetchComments(post.id);
                      }
                    }}
                    className={isMobile ? 'px-2' : ''}
                  >
                    <MessageCircle className={isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} />
                    <span className={isMobile ? 'text-xs' : ''}>{post.comments_count}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className={isMobile ? 'px-2' : ''}>
                    <Share2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                  </Button>
                </div>
              </div>
              
              {showComments === post.id && (
                <div className={`space-y-${isMobile ? '3' : '4'} pt-${isMobile ? '3' : '4'} border-t`}>
                  <div className={`space-y-${isMobile ? '2' : '3'} max-h-${isMobile ? '64' : '80'} overflow-y-auto`}>
                    {comments.map((comment) => (
                      <div key={comment.id} className={`flex gap-${isMobile ? '2' : '3'}`}>
                        <Avatar className={isMobile ? 'w-6 h-6' : 'w-8 h-8'}>
                          <AvatarImage src={comment.profiles.avatar_url} />
                          <AvatarFallback className={isMobile ? 'text-xs' : ''}>
                            {comment.profiles.full_name?.charAt(0) || comment.profiles.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 bg-muted/50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                          <div className={`flex items-center gap-2 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                            <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {comment.profiles.full_name || comment.profiles.username}
                            </span>
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`flex gap-2 ${isMobile ? 'sticky bottom-0 bg-background/95 backdrop-blur-sm py-2 -mx-2 px-2' : ''}`}>
                    <Input
                      placeholder={isMobile ? "Comment..." : "Write a comment..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addComment(post.id);
                        }
                      }}
                      className={isMobile ? 'text-sm' : ''}
                    />
                    <Button
                      size="sm"
                      onClick={() => addComment(post.id)}
                      disabled={!newComment.trim()}
                      className={isMobile ? 'px-3' : ''}
                    >
                      {isMobile ? 'Send' : 'Post'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {posts.length === 0 && !loading && (
          <Card className="glass-card">
            <CardContent className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto opacity-20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Welcome to the Community!</h3>
                <p className="text-muted-foreground">
                  No posts yet. Be the first to share something inspiring with the community!
                </p>
              </div>
              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gradient-primary">
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Social;