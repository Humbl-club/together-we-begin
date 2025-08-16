import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, Camera, Send, Download, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/image/ImageUpload';
import { useImageCompression } from '@/hooks/useImageCompression';
import { ShareButton } from '@/components/social/ShareButton';
import { PostWithProfile, CommentWithProfile } from '@/types/api';
import { generateStableKey, generateMediaKey } from '@/utils/keyGenerators';

const CommunityFeed: React.FC = () => {
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { compressImage, processing } = useImageCompression();

  // Character limits
  const POST_CHAR_LIMIT = 100;
  const COMMENT_CHAR_LIMIT = 50;
  const MAX_IMAGES = 2;
  const MAX_IMAGE_SIZE_MB = 2;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_social_posts_optimized', {
        limit_param: 10,
        offset_param: 0
      });

      if (error) throw error;
      
      // Add user_liked information
      const postsWithLikes = await Promise.all((data || []).map(async (post) => {
        if (!user) return { ...post, user_liked: false };
        
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
          
        return { ...post, user_liked: !!likeData };
      }));
      
      setPosts(postsWithLikes as PostWithProfile[]);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_liked) {
        // Remove like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Add like
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_liked: !p.user_liked,
              likes_count: p.user_liked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
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
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          content,
          created_at,
          updated_at,
          user_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create profile lookup map
      const profileMap = new Map(profilesData.map(p => [p.id, p]));

      // Combine comments with profiles
      const commentsWithProfiles: CommentWithProfile[] = commentsData.map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id!) || {
          full_name: null,
          username: null,
          avatar_url: null
        }
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !user || newComment.length > COMMENT_CHAR_LIMIT) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(postId);
      loadPosts(); // Refresh to get updated comment count
      
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

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `community_image_${Date.now()}_${index}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully!"
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) return;
    if (newPost.length > POST_CHAR_LIMIT) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrls: string[] = [];

      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file, index) => {
          // Compress image before upload
          const { file: compressedFile } = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            format: 'webp'
          });

          const fileExt = 'webp';
          const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, compressedFile);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          return publicUrl;
        });

        imageUrls = await Promise.all(uploadPromises);
      }

      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: newPost,
          image_urls: imageUrls.length > 0 ? imageUrls : null
        });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to save post: ${error.message}`);
      }

      setNewPost('');
      setSelectedImages([]);
      loadPosts();
      
      toast({
        title: "Success",
        description: "Post shared successfully!"
      });

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-mobile">
      <Card className="card-primary">
        <CardHeader>
          <h2 className="editorial-heading text-xl">Community Feed</h2>
        </CardHeader>
        <CardContent className="space-mobile">
          {/* Create Post */}
          <div className="space-y-4">
            <Textarea
              placeholder="Share something with the community..."
              value={newPost}
              onChange={(e) => {
                if (e.target.value.length <= POST_CHAR_LIMIT) {
                  setNewPost(e.target.value);
                }
              }}
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <span className={`text-xs ${newPost.length > POST_CHAR_LIMIT * 0.8 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {newPost.length}/{POST_CHAR_LIMIT} characters
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStorageInfo(!showStorageInfo)}
              >
                <Info className="w-4 h-4 mr-2" />
                Storage Info
              </Button>
            </div>
            
            {showStorageInfo && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">Image Storage Details:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Bucket: "posts" (public storage)</li>
                  <li>• Path: user_id/timestamp_index.webp</li>
                  <li>• Max size: {MAX_IMAGE_SIZE_MB}MB per image</li>
                  <li>• Max images: {MAX_IMAGES} per post</li>
                  <li>• Format: WebP (optimized compression)</li>
                  <li>• Resolution: Max 1920x1920px</li>
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.id = 'community-image-upload';
                    input.name = 'community-images';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      // Check file sizes
                      const validFiles = files.filter(file => {
                        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: `${file.name} exceeds ${MAX_IMAGE_SIZE_MB}MB limit`,
                            variant: "destructive"
                          });
                          return false;
                        }
                        return true;
                      });
                      setSelectedImages(prev => [...prev, ...validFiles.slice(0, MAX_IMAGES - prev.length)]);
                    };
                    input.click();
                  }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Add Images ({selectedImages.length}/{MAX_IMAGES})
              </Button>
              
              <Button 
                onClick={handleSubmitPost} 
                disabled={(!newPost.trim() && selectedImages.length === 0) || loading || processing || newPost.length > POST_CHAR_LIMIT || selectedImages.length > MAX_IMAGES}
                className="ml-2"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading || processing ? 'Sharing...' : 'Share'}
              </Button>
            </div>

            {selectedImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedImages.map((file, index) => (
                  <div key={generateStableKey(file, index)} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => {
                        setSelectedImages(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="glass-card-enhanced">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarImage src={post.profile_data?.avatar_url} />
                  <AvatarFallback>
                    {post.profile_data?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{post.profile_data?.full_name || 'Anonymous'}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2">{post.content}</p>
                  
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {post.image_urls.map((url: string, index: number) => (
                        <div key={generateMediaKey(url, index)} className="relative group">
                          <img
                            src={url}
                            alt={`Post image ${index + 1}`}
                            className="rounded-lg object-cover w-full max-h-96"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => downloadImage(url, index)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator className="mt-4" />
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={post.user_liked ? 'text-primary' : ''}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
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
                    </Button>
                    <ShareButton 
                      postId={post.id} 
                      postContent={post.content || ''} 
                    />
                  </div>

                  {showComments === post.id && (
                    <div className="space-y-4 pt-4 border-t mt-4">
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback>
                                {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {comment.profiles?.full_name || comment.profiles?.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => {
                              if (e.target.value.length <= COMMENT_CHAR_LIMIT) {
                                setNewComment(e.target.value);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addComment(post.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => addComment(post.id)}
                            disabled={!newComment.trim() || newComment.length > COMMENT_CHAR_LIMIT}
                          >
                            Post
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {newComment.length}/{COMMENT_CHAR_LIMIT} characters
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CommunityFeed;