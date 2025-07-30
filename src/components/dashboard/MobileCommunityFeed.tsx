import React, { memo, useState } from 'react';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Heart, MessageCircle, Share, MoreHorizontal, Camera, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
  category?: 'milestone' | 'motivation' | 'question' | 'celebration';
}

interface MobileCommunityFeedProps {
  posts?: Post[];
}

const MobileCommunityFeed: React.FC<MobileCommunityFeedProps> = memo(({ posts }) => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const mockPosts: Post[] = [
    {
      id: '1',
      author: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        verified: true
      },
      content: 'Just completed my first 10K! 🏃‍♀️ The training was tough but so worth it. Thank you to everyone who cheered me on! 💪',
      timestamp: '2h ago',
      likes: 24,
      comments: 8,
      category: 'milestone'
    },
    {
      id: '2',
      author: {
        name: 'Maya Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
      },
      content: 'Anyone else struggling with work-life balance? Looking for tips on how to make time for self-care during busy weeks. 🤔',
      timestamp: '4h ago',
      likes: 15,
      comments: 12,
      category: 'question'
    },
    {
      id: '3',
      author: {
        name: 'Emma Thompson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
      },
      content: 'Morning meditation session in the park was absolutely magical today ✨ There\'s something so powerful about starting the day with intention.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      timestamp: '6h ago',
      likes: 31,
      comments: 5,
      category: 'motivation'
    }
  ];

  const displayPosts = posts || mockPosts;

  const getCategoryEmoji = (category: Post['category']) => {
    const emojis = {
      milestone: '🎉',
      motivation: '✨',
      question: '🤔',
      celebration: '🎊'
    };
    return category ? emojis[category] : '';
  };

  const handleLike = (postId: string) => {
    feedback.impact('light');
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        feedback.success();
      }
      return newSet;
    });
  };

  const handleComment = (postId: string) => {
    feedback.tap();
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    feedback.tap();
    console.log('Share post:', postId);
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
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{post.author.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">{post.likes} likes</span>
                      <span className="text-xs text-muted-foreground">{post.comments} comments</span>
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
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="text-sm">{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {post.author.name}
                        </h3>
                        {post.author.verified && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            ✓
                          </Badge>
                        )}
                        {post.category && (
                          <span className="text-sm" role="img" aria-label={post.category}>
                            {getCategoryEmoji(post.category)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
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
                  
                  {post.image && (
                    <div className="rounded-xl overflow-hidden bg-muted">
                      <img 
                        src={post.image} 
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
                        likedPosts.has(post.id) && "text-red-500"
                      )}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          likedPosts.has(post.id) && "fill-current"
                        )} 
                      />
                      <span className="text-xs font-medium">
                        {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                      </span>
                    </MobileNativeButton>
                    
                    <MobileNativeButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      className="flex items-center gap-2 h-8 px-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">{post.comments}</span>
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