import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, TrendingUp, Plus, Send, MessageCircle } from 'lucide-react';
import FeedPost from './FeedPost';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useAuth } from '@/components/auth/AuthProvider';
import { OptimizedSkeleton } from '@/components/ui/optimized-skeleton';
import { useToast } from '@/hooks/use-toast';

const CommunityFeed: React.FC = memo(() => {
  const { user } = useAuth();
  const { posts, loading } = useCommunityFeed(user?.id);

  if (loading) {
    return (
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light tracking-tight">Community</h2>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Latest updates</span>
          </div>
        </div>
        <OptimizedSkeleton variant="feed" />
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light tracking-tight">Community</h2>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Latest updates</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {posts.map((post) => (
          <FeedPost 
            key={post.id} 
            author={post.user_profile.full_name}
            avatar={post.user_profile.avatar_url}
            time={new Date(post.created_at).toLocaleDateString()}
            content={post.content}
            image={post.image_urls?.[0]}
            likes={post.likes_count}
            comments={post.comments_count}
          />
        ))}
        
        {/* Load More */}
        <Card className="border-0 bg-card/20 backdrop-blur-sm border-dashed border-2 border-muted">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Stay connected with your community</p>
            <Button variant="outline" className="bg-background/50">
              Load More Stories
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default CommunityFeed;