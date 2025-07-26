import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Heart, MessageCircle, Share2, Flag, MoreHorizontal, Users } from 'lucide-react';

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

interface PostListProps {
  posts: Post[];
  loading: boolean;
  isMobile: boolean;
  isAdmin: boolean;
  showComments: string | null;
  comments: Comment[];
  newComment: string;
  setNewComment: (value: string) => void;
  toggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>;
  setShowComments: (postId: string | null) => void;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string) => Promise<void>;
  reportPost: (postId: string) => Promise<void>;
  removePost: (postId: string) => Promise<void>;
}

export const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  isMobile,
  isAdmin,
  showComments,
  comments,
  newComment,
  setNewComment,
  toggleLike,
  setShowComments,
  fetchComments,
  addComment,
  reportPost,
  removePost
}) => {
  if (posts.length === 0 && !loading) {
    return (
      <EmptyState
        icon={Users}
        title="Welcome to the Community!"
        description="No posts yet. Be the first to share something inspiring with the community and start meaningful conversations!"
        actionLabel="Create Your First Post"
        onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    );
  }

  return (
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
                  <OptimizedImage
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
    </div>
  );
};