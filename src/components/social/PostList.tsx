import React from 'react';
import { generateStableKey, generateMediaKey } from '@/utils/keyGenerators';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { PostComments } from './PostComments';
import { MobileTypography } from '@/components/ui/mobile-typography';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useIsMobile } from '@/hooks/use-mobile';
import { MasonryGrid } from '@/components/sections/MasonryGrid';

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
  onCreatePost?: () => void;
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
  onCreatePost,
}) => {
  const isMobile = useIsMobile();
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="w-full h-full" />}
        title="No posts yet"
        description="Be the first to share something inspiring with the community!"
        action={onCreatePost ? {
          label: "Create First Post",
          onClick: onCreatePost,
          variant: "default"
        } : undefined}
      />
    );
  }

  const items = posts.map((post) => {
    const profile = profiles[post.user_id];
    const isLiked = likedPosts.has(post.id);
    const likeCount = likeCounts[post.id] || 0;
    const commentCount = commentCounts[post.id] || 0;
    const showComments = expandedComments.has(post.id);

    return (
      <Card key={post.id} className="card-secondary glass-card hover:shadow-lg transition-shadow p-4 space-y-4 animate-fade-in hover-scale">
        {/* Post Header */}
        <div className="flex items-center gap-3">
          <Avatar>
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}`}
              alt={profile?.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div className="flex-1">
            <MobileTypography variant="body" weight="semibold">
              {profile?.full_name || 'Anonymous'}
            </MobileTypography>
            <MobileTypography variant="caption" className="text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </MobileTypography>
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <MobileTypography variant="body" className="whitespace-pre-wrap">
            {post.content}
          </MobileTypography>
        )}

        {/* Post Images */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.image_urls.map((url, index) => (
              <OptimizedImage
                key={generateMediaKey(url, index)}
                src={url}
                alt={`Post image ${index + 1}`}
                className="rounded-lg h-48"
                aspectRatio="auto"
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
            className={isLiked ? 'text-primary' : ''}
            aria-pressed={isLiked}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleComments(post.id)}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
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
  });

  return isMobile ? (
    <div className="space-y-4">{items}</div>
  ) : (
    <MasonryGrid columns={{ base: 1, sm: 2, lg: 2 }} gap="gap-3">{items}</MasonryGrid>
  );
};