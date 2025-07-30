import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Camera, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/image/ImageUpload';
import { useImageCompression } from '@/hooks/useImageCompression';

const CommunityFeed: React.FC = () => {
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const { toast } = useToast();
  const { compressImage, processing } = useImageCompression();

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
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) return;

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
    <div className="space-y-6">
      <Card className="glass-card-enhanced">
        <CardHeader>
          <h2 className="text-xl font-semibold">Community Feed</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Post */}
          <div className="space-y-4">
            <Textarea
              placeholder="Share something with the community..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
            />
            
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
                    setSelectedImages(prev => [...prev, ...files.slice(0, 4 - prev.length)]);
                  };
                  input.click();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Add Images
              </Button>
              
              <Button 
                onClick={handleSubmitPost} 
                disabled={(!newPost.trim() && selectedImages.length === 0) || loading || processing}
                className="ml-2"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading || processing ? 'Sharing...' : 'Share'}
              </Button>
            </div>

            {selectedImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative">
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {post.image_urls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="rounded-lg object-cover aspect-square"
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes_count || 0}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.comments_count || 0}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
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