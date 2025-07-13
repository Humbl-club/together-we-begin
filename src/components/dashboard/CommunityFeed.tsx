import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp } from 'lucide-react';
import FeedPost from './FeedPost';
import { mockFeedPosts } from '@/constants/dashboardData';

const CommunityFeed: React.FC = () => {
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
        {mockFeedPosts.map((post, index) => (
          <FeedPost key={index} {...post} />
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
};

export default CommunityFeed;