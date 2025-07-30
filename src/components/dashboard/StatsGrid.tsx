import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Calendar, Trophy, Users } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface DashboardStats {
  loyaltyPoints: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

const MobileStatsCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ComponentType<any>; 
  color: string;
  progress: number;
  change: string;
}> = memo(({ title, value, icon: Icon, color, progress, change }) => {
  const haptics = useHapticFeedback();

  return (
    <Card 
      className="glass-card-enhanced touch-target-large cursor-pointer hover:scale-[1.02] transition-all duration-300"
      onClick={() => haptics.tap()}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
            {change}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-3xl font-bold tracking-tight">
              {value.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {title}
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {progress}% of target
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const StatsGrid: React.FC<StatsGridProps> = memo(({ stats }) => {
  const { isMobile } = useViewport();
  
  const statCards = useMemo(() => [
    {
      title: 'Loyalty Points',
      value: stats.loyaltyPoints,
      icon: Award,
      color: 'text-amber-600 bg-amber-500',
      progress: Math.min((stats.loyaltyPoints / 500) * 100, 100),
      change: '+12'
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-500',
      progress: Math.min((stats.upcomingEvents / 10) * 100, 100),
      change: '+1'
    },
    {
      title: 'Active Challenges',
      value: stats.activeChallenges,
      icon: Trophy,
      color: 'text-purple-600 bg-purple-500',
      progress: Math.min((stats.activeChallenges / 5) * 100, 100),
      change: 'New'
    },
    {
      title: 'Community Posts',
      value: stats.totalPosts,
      icon: Users,
      color: 'text-green-600 bg-green-500',
      progress: Math.min((stats.totalPosts / 20) * 100, 100),
      change: '+3'
    }
  ], [stats]);

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card) => (
          <MobileStatsCard key={card.title} {...card} />
        ))}
      </div>
    );
  }

  // Desktop version with traditional layout
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map(({ title, value, icon: Icon, color, change }) => (
        <Card key={title} className="glass-card-enhanced">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                <Icon className="w-5 h-5" />
              </div>
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 font-medium">
                {change}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight">
                {value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                {title}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default StatsGrid;