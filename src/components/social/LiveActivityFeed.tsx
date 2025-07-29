import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeActivityFeed } from '@/hooks/useRealtimeActivityFeed';
import { 
  Activity, 
  MessageSquare, 
  Trophy, 
  Calendar, 
  Target, 
  RefreshCw,
  Heart,
  Star,
  Image as ImageIcon
} from 'lucide-react';

interface LiveActivityFeedProps {
  className?: string;
  maxItems?: number;
  showTimestamps?: boolean;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  className,
  maxItems = 15,
  showTimestamps = true
}) => {
  const { activities, loading, refreshFeed } = useRealtimeActivityFeed(maxItems);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_created':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'challenge_joined':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'event_registered':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'goal_achieved':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'story_posted':
        return <ImageIcon className="w-4 h-4 text-pink-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityMessage = (activity: any) => {
    switch (activity.activity_type) {
      case 'post_created':
        return 'shared a new post';
      case 'challenge_joined':
        return `joined "${activity.activity_data.challenge_name}" challenge`;
      case 'event_registered':
        return `registered for "${activity.activity_data.event_name}"`;
      case 'goal_achieved':
        return `earned ${activity.activity_data.points_earned} points`;
      case 'story_posted':
        return 'posted a new story';
      default:
        return 'was active';
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'post_created':
        return <Badge variant="outline" className="text-xs">Post</Badge>;
      case 'challenge_joined':
        return <Badge variant="outline" className="text-xs">Challenge</Badge>;
      case 'event_registered':
        return <Badge variant="outline" className="text-xs">Event</Badge>;
      case 'goal_achieved':
        return <Badge variant="outline" className="text-xs">Achievement</Badge>;
      case 'story_posted':
        return <Badge variant="outline" className="text-xs">Story</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Activity</Badge>;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const activityTime = new Date(dateString);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-primary" />
            Live Activity
            <Badge variant="secondary" className="ml-2 animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Live
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshFeed}
            className="h-auto p-1"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
            <p className="text-muted-foreground text-sm">
              Community activity will appear here as it happens
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={activity.user_profile.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {activity.user_profile.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.user_profile.full_name}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {getActivityMessage(activity)}
                        </span>
                      </p>
                      {getActivityBadge(activity.activity_type)}
                    </div>

                    {activity.activity_data.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        "{activity.activity_data.description}"
                      </p>
                    )}

                    {activity.activity_data.points_earned && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-600">
                          +{activity.activity_data.points_earned} points
                        </span>
                      </div>
                    )}

                    {showTimestamps && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    )}
                  </div>

                  {/* Quick interaction buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <Heart className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};