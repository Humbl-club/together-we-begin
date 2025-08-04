import React, { memo, useState, useEffect } from 'react';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { Heart, MessageCircle, Share, MoreHorizontal, Camera, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_urls?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_story: boolean;
  status: string;
  profile_data: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  };
  user_liked?: boolean;
}

interface MobileCommunityFeedProps {
  posts?: Post[];
}

const MobileCommunityFeed: React.FC<MobileCommunityFeedProps> = memo(({ posts: propPosts }) => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();
  const { posts: feedPosts, loading, toggleLike } = useCommunityFeed();

  const displayPosts = propPosts || feedPosts;

  const handleLike = async (postId: string) => {
    feedback.impact('light');
    try {
      await toggleLike(postId);
      feedback.success();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = (postId: string) => {
    feedback.tap();
    // TODO: Open comment modal
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    feedback.tap();
    // TODO: Open share modal
    console.log('Share post:', postId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isMobile) {
    // Desktop version
    return (
      <MobileFirstCard variant="default" className="w-full">
        <MobileFirstCardHeader>
          <MobileFirstCardTitle>Community Updates</MobileFirstCardTitle>
        </MobileFirstCardHeader>
        <MobileFirstCardContent>
          <div className="space-y-4">
            {displayPosts.slice(0, 2).map((post) => (
              <div key={post.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profile_data?.avatar_url} />
                      <AvatarFallback>{post.profile_data?.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{post.profile_data?.full_name || 'Anonymous'}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">{post.likes_count} likes</span>
                        <span className="text-xs text-muted-foreground">{post.comments_count} comments</span>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </MobileFirstCardContent>
      </MobileFirstCard>
    );
  }

  return (
    <div 
      className="space-y-4"
      style={{
        paddingLeft: `max(0px, ${safeAreaInsets.left}px)`,
        paddingRight: `max(0px, ${safeAreaInsets.right}px)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-foreground">Community Vibes</h2>
        <MobileNativeButton
          variant="ghost"
          size="sm"
          onClick={() => feedback.tap()}
          className="text-primary"
        >
          <Camera className="h-4 w-4" />
        </MobileNativeButton>
      </div>

      {/* Posts */}
      <div className="space-y-4 px-4">
        {displayPosts.map((post) => (
          <MobileFirstCard
            key={post.id}
            variant="elevated"
            padding="none"
            className="overflow-hidden"
          >
            <MobileFirstCardContent>
              <div className="p-4 space-y-3">
                {/* Post Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={post.profile_data?.avatar_url} />
                      <AvatarFallback className="text-sm">{post.profile_data?.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {post.profile_data?.full_name || 'Anonymous'}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(post.created_at)}</p>
                    </div>
                  </div>
                  
                  <MobileNativeButton
                    variant="ghost"
                    size="sm"
                    onClick={() => feedback.tap()}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </MobileNativeButton>
                </div>

                {/* Post Content */}
                <div className="space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {post.content}
                  </p>
                  
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="rounded-xl overflow-hidden bg-muted">
                      <img 
                        src={post.image_urls[0]} 
                        alt="Post content"
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    <MobileNativeButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={cn(
                        "flex items-center gap-2 h-8 px-2",
                        post.user_liked && "text-red-500"
                      )}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          post.user_liked && "fill-current"
                        )} 
                      />
                      <span className="text-xs font-medium">
                        {post.likes_count}
                      </span>
                    </MobileNativeButton>
                    
                    <MobileNativeButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      className="flex items-center gap-2 h-8 px-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">{post.comments_count}</span>
                    </MobileNativeButton>
                  </div>
                  
                  <MobileNativeButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(post.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Share className="h-4 w-4" />
                  </MobileNativeButton>
                </div>
              </div>
            </MobileFirstCardContent>
          </MobileFirstCard>
        ))}
      </div>

      {/* Community Stats */}
      <div className="px-4">
        <MobileFirstCard variant="glass" padding="md">
          <MobileFirstCardContent>
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">247</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div>
                <p className="text-2xl font-bold text-primary">89</p>
                <p className="text-xs text-muted-foreground">Posts This Week</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div>
                <p className="text-2xl font-bold text-primary">1.2k</p>
                <p className="text-xs text-muted-foreground">Connections Made</p>
              </div>
            </div>
          </MobileFirstCardContent>
        </MobileFirstCard>
      </div>
    </div>
  );
});

MobileCommunityFeed.displayName = 'MobileCommunityFeed';

export default MobileCommunityFeed;