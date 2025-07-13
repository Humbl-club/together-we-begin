import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp } from 'lucide-react';
import FeedPost from './FeedPost';
import { mockFeedPosts } from '@/constants/dashboardData';

const CommunityFeed: React.FC = () => {
  return (
    <div className="adaptive-card flow-content">
      <div className="cluster justify-between">
        <h2 className="fluid-subheading font-light tracking-tight">Community</h2>
        <div className="cluster">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Latest updates</span>
        </div>
      </div>
      
      <div className="intrinsic-grid smooth-entrance">
        {mockFeedPosts.map((post, index) => (
          <FeedPost key={index} {...post} />
        ))}
        
        {/* Load More */}
        <Card className="editorial-card border-dashed border-2 border-muted hover-scale">
          <CardContent className="text-center adaptive-card">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="fluid-body text-muted-foreground mb-4">Stay connected with your community</p>
            <Button variant="outline" className="modern-button">
              Load More Stories
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityFeed;