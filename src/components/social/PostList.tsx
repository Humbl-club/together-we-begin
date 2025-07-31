import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostComments } from './PostComments';

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

interface PostListProps {
  posts: Post[];
  loading: boolean;
  isMobile: boolean;
  isAdmin: boolean;
  showComments: string | null;
  comments: any[];
  newComment: string;
  setNewComment: (comment: string) => void;
  toggleLike: (postId: string, currentlyLiked: boolean) => void;
  setShowComments: (postId: string | null) => void;
  fetchComments: (postId: string) => void;
  addComment: (postId: string) => void;
  reportPost: (postId: string) => void;
  removePost: (postId: string) => void;
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
  removePost,
}) => {
  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="glass-card p-4 animate-pulse">
            <div className="h-20 bg-muted rounded-lg mb-4" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="glass-card p-4 space-y-4">
          {/* Post Header */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <img
                src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name || 'User'}`}
                alt={post.profiles?.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
          )}

          {/* Post Images */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.image_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="rounded-lg w-full h-48 object-cover"
                />
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center space-x-4 pt-2">
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
          </div>

          {/* Comments Section */}
          {showComments === post.id && (
            <PostComments
              postId={post.id}
              currentUserId={undefined}
              onComment={(postId, content) => {
                setNewComment(content);
                addComment(postId);
              }}
            />
          )}
        </Card>
      ))}
    </div>
  );
};