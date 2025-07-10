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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

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
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles (full_name, username, avatar_url),
          post_likes (user_id)
        `)
        .eq('is_story', false)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithLikes = data?.map(post => ({
        ...post,
        user_liked: post.post_likes?.some((like: any) => like.user_id === user?.id) || false
      })) || [];

      setPosts(postsWithLikes);
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
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles (full_name, username, avatar_url)
        `)
        .eq('is_story', true)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
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
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles (full_name, username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
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
      <div className="container max-w-2xl mx-auto p-4">
        <div className="text-center">Loading social feed...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Stories Section */}
      {stories.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {stories.map((story) => (
                <div key={story.id} className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary p-1">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={story.profiles.avatar_url} />
                      <AvatarFallback>
                        {story.profiles.full_name?.charAt(0) || story.profiles.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-xs mt-1 truncate w-16">
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
        <CardContent className="pt-6">
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="post">Create Post</TabsTrigger>
              <TabsTrigger value="story">Create Story</TabsTrigger>
            </TabsList>
            
            <TabsContent value="post" className="space-y-4">
              <Textarea
                placeholder="Share your thoughts with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Photos ({selectedImages.length}/5)
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
                  className="bg-primary hover:bg-primary/90"
                >
                  Share Post
                </Button>
              </div>
              
              {selectedImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="story" className="space-y-4">
              <Textarea
                placeholder="Share a 24-hour story..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('story-image-upload')?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Photos ({selectedImages.length}/5)
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
                  className="bg-gradient-primary text-white"
                >
                  Share Story
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.profiles.avatar_url} />
                    <AvatarFallback>
                      {post.profiles.full_name?.charAt(0) || post.profiles.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{post.profiles.full_name || post.profiles.username}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {post.is_story && (
                    <Badge variant="secondary">Story</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reportPost(post.id)}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePost(post.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {post.content && (
                <p className="text-foreground">{post.content}</p>
              )}
              
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {post.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-auto rounded-lg object-cover max-h-96"
                    />
                  ))}
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id, post.user_liked || false)}
                    className={post.user_liked ? 'text-red-500' : ''}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
                    {post.likes_count}
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
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments_count}
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {showComments === post.id && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.profiles.avatar_url} />
                          <AvatarFallback>
                            {comment.profiles.full_name?.charAt(0) || comment.profiles.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {comment.profiles.full_name || comment.profiles.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addComment(post.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => addComment(post.id)}
                      disabled={!newComment.trim()}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {posts.length === 0 && (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No posts yet. Be the first to share something with the community!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Social;