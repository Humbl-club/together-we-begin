import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { EmptyState } from '@/components/ui/empty-state';
import { SwipeableCard } from '@/components/ui/swipeable-card';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Heart, MessageCircle, Share2, Flag, MoreHorizontal, Users } from 'lucide-react';
import { ShareButton } from './ShareButton';

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

const MobilePostCard: React.FC<{
  post: Post;
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
}> = ({
  post,
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
  const haptics = useHapticFeedback();

  const handleLike = async () => {
    haptics.tap();
    await toggleLike(post.id, post.user_liked || false);
  };

  const handleComment = () => {
    haptics.tap();
    if (showComments === post.id) {
      setShowComments(null);
    } else {
      setShowComments(post.id);
      fetchComments(post.id);
    }
  };

  return (
    <SwipeableCard
      onSwipeLeft={() => handleLike()}
      onSwipeRight={() => handleComment()}
      className="glass-card-enhanced"
    >
      <CardHeader className="pb-4 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/10">
              <AvatarImage src={post.profiles.avatar_url} />
              <AvatarFallback className="text-sm font-medium">
                {post.profiles.full_name?.charAt(0) || post.profiles.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-base truncate">
                {post.profiles.full_name || post.profiles.username}
              </h4>
              <p className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {post.is_story && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary">
                Story
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                haptics.tap();
                reportPost(post.id);
              }}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-6 pb-6">
        {post.content && (
          <p className="text-sm leading-relaxed break-words">
            {post.content}
          </p>
        )}
        
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {post.image_urls.map((url, index) => (
              <OptimizedImage
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-auto rounded-xl object-cover max-h-80"
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
              onClick={handleLike}
              className={`${post.user_liked ? 'text-red-500' : ''} px-3 h-10 rounded-full touch-target-large`}
            >
              <Heart className={`w-4 h-4 mr-2 ${post.user_liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes_count}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="px-3 h-10 rounded-full touch-target-large"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="font-medium">{post.comments_count}</span>
            </Button>
            
            <ShareButton 
              postId={post.id} 
              postContent={post.content || ''} 
              size="sm"
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {showComments === post.id && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.full_name?.charAt(0) || comment.profiles.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/30 rounded-xl p-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {comment.profiles.full_name || comment.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm py-2 -mx-6 px-6">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    haptics.tap();
                    addComment(post.id);
                  }
                }}
                className="text-sm h-10 rounded-full"
              />
              <Button
                size="sm"
                onClick={() => {
                  haptics.success();
                  addComment(post.id);
                }}
                disabled={!newComment.trim()}
                className="px-4 h-10 rounded-full touch-target-large"
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </SwipeableCard>
  );
};

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
    <div className={`space-y-${isMobile ? '6' : '8'}`}>
      {posts.map((post) => (
        isMobile ? (
          <MobilePostCard
            key={post.id}
            post={post}
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
        ) : (
          <Card key={post.id} className="glass-card-enhanced">
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
                    <h4 className="font-semibold">
                      {post.profiles.full_name || post.profiles.username}
                    </h4>
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
                <p className="text-foreground">
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
                  
                  <ShareButton 
                    postId={post.id} 
                    postContent={post.content || ''} 
                    size="sm"
                    isMobile={isMobile}
                  />
                </div>
              </div>
              
              {showComments === post.id && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
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
                          <p className="text-sm leading-relaxed">
                            {comment.content}
                          </p>
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
        )
      ))}
    </div>
  );
};