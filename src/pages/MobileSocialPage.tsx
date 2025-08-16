import React, { memo, useState } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  Camera, 
  Plus,
  Filter,
  Sparkles,
  Users2,
  TrendingUp
} from 'lucide-react';
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

const MobileSocialPage: React.FC = memo(() => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();
  const [activeFilter, setActiveFilter] = useState<'all' | 'following' | 'trending'>('all');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const mockPosts: Post[] = [
    {
      id: '1',
      author: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        verified: true
      },
      content: 'Just completed my first 10K! 🏃‍♀️ The training was tough but so worth it. Thank you to everyone who cheered me on! 💪✨',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      timestamp: '2h ago',
      likes: 42,
      comments: 12,
      category: 'milestone'
    },
    {
      id: '2',
      author: {
        name: 'Maya Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Morning meditation session was exactly what I needed today. Sometimes the best productivity hack is just taking a moment to breathe 🧘‍♀️✨',
      timestamp: '4h ago',
      likes: 28,
      comments: 8,
      category: 'motivation'
    },
    {
      id: '3',
      author: {
        name: 'Emma Thompson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Who else is struggling with work-life balance? Looking for tips on how to make time for self-care during busy weeks. Drop your best advice below! 👇',
      timestamp: '6h ago',
      likes: 15,
      comments: 24,
      category: 'question'
    }
  ];

  const handleRefresh = async () => {
    feedback.impact('light');
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    feedback.success();
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

  const getCategoryEmoji = (category: Post['category']) => {
    const emojis = {
      milestone: '🎉',
      motivation: '✨',
      question: '🤔',
      celebration: '🎊'
    };
    return category ? emojis[category] : '';
  };

  if (!isMobile) {
    // Desktop version
    return (
      <UnifiedLayout>
        <div className="container mx-auto px-8 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Social</h1>
          {/* Desktop social content */}
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div 
        className="min-h-screen bg-background"
        style={{
          paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`,
          paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
          paddingRight: `max(16px, ${safeAreaInsets.right}px)`
        }}
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-4 px-4">
            {/* Header */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Community</h1>
                <p className="text-sm text-muted-foreground">Share your journey</p>
              </div>
              
              <div className="flex items-center gap-2">
                <MobileNativeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => feedback.tap()}
                >
                  <Filter className="h-5 w-5" />
                </MobileNativeButton>
                <MobileNativeButton
                  variant="primary"
                  size="sm"
                  onClick={() => feedback.tap()}
                  className="h-10 w-10 p-0 rounded-full"
                >
                  <Plus className="h-5 w-5" />
                </MobileNativeButton>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-secondary/30 rounded-2xl p-1">
              {[
                { key: 'all', label: 'All', icon: Sparkles },
                { key: 'following', label: 'Following', icon: Users2 },
                { key: 'trending', label: 'Trending', icon: TrendingUp }
              ].map((filter) => (
                <MobileNativeButton
                  key={filter.key}
                  variant={activeFilter === filter.key ? "primary" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex-1 h-10",
                    activeFilter === filter.key && "shadow-sm"
                  )}
                  onClick={() => {
                    feedback.tap();
                    setActiveFilter(filter.key as typeof activeFilter);
                  }}
                >
                  <filter.icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </MobileNativeButton>
              ))}
            </div>

            {/* Create Post Prompt */}
            <MobileFirstCard variant="glass" padding="md" interactive onClick={() => feedback.tap()}>
              <MobileFirstCardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">What's on your mind?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MobileNativeButton
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </MobileNativeButton>
                  </div>
                </div>
              </MobileFirstCardContent>
            </MobileFirstCard>

            {/* Posts Feed */}
            <div className="space-y-4">
              {mockPosts.map((post) => (
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

            {/* Load More */}
            <div className="py-4">
              <MobileNativeButton
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => feedback.tap()}
              >
                Load More Posts
              </MobileNativeButton>
            </div>
          </div>
        </PullToRefresh>
      </div>
    </UnifiedLayout>
  );
});

export default MobileSocialPage;