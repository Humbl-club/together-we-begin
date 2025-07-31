import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { PostComments } from './PostComments';

interface PostListProps {
  posts: Tables<'social_posts'>[];
  profiles: Record<string, Tables<'profiles'>>;
  currentUserId: string | undefined;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  likeCounts: Record<string, number>;
  likedPosts: Set<string>;
  commentCounts: Record<string, number>;
  expandedComments: Set<string>;
  toggleComments: (postId: string) => void;
}

export const PostList: React.FC<PostListProps> = ({
  posts,
  profiles,
  currentUserId,
  onLike,
  onComment,
  likeCounts,
  likedPosts,
  commentCounts,
  expandedComments,
  toggleComments,
}) => {
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const profile = profiles[post.user_id];
        const isLiked = likedPosts.has(post.id);
        const likeCount = likeCounts[post.id] || 0;
        const commentCount = commentCounts[post.id] || 0;
        const showComments = expandedComments.has(post.id);

        return (
          <Card key={post.id} className="glass-card p-4 space-y-4">
            {/* Post Header */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}`}
                  alt={profile?.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{profile?.full_name || 'Anonymous'}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

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
                onClick={() => onLike(post.id)}
                className={isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleComments(post.id)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentCount}
              </Button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <PostComments
                postId={post.id}
                currentUserId={currentUserId}
                onComment={onComment}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
};