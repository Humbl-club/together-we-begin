import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Calendar, Trophy, Users, TrendingUp } from 'lucide-react';
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
  bgColor: string;
  progress: number;
  change: string;
  trend: 'up' | 'down' | 'stable';
}> = memo(({ title, value, icon: Icon, color, bgColor, progress, change, trend }) => {
  const haptics = useHapticFeedback();

  return (
    <Card 
      className="glass-card-enhanced touch-target-large cursor-pointer hover:scale-[1.03] transition-all duration-500 overflow-hidden"
      onClick={() => haptics.tap()}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgColor} shadow-lg`}>
            <Icon className={`w-6 h-6 ${color}`} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-3 h-3 ${trend === 'up' ? 'text-green-500' : 'text-muted-foreground'}`} />
            <Badge variant="secondary" className="text-xs font-bold bg-primary/15 text-primary border-0 px-2">
              {change}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold tracking-tight mb-1">
              {value.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
              {title}
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-2.5 bg-muted/30" 
              style={{
                '--progress-foreground': color.replace('text-', 'hsl(var(--') + '))'
              } as React.CSSProperties}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">
                Progress
              </span>
              <span className="text-xs font-bold text-primary">
                {progress}%
              </span>
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
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/20',
      progress: Math.min((stats.loyaltyPoints / 500) * 100, 100),
      change: '+12',
      trend: 'up' as const
    },
    {
      title: 'Events This Month',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/20',
      progress: Math.min((stats.upcomingEvents / 10) * 100, 100),
      change: '+1',
      trend: 'up' as const
    },
    {
      title: 'Active Challenges',
      value: stats.activeChallenges,
      icon: Trophy,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/20',
      progress: Math.min((stats.activeChallenges / 5) * 100, 100),
      change: 'New',
      trend: 'stable' as const
    },
    {
      title: 'Community Posts',
      value: stats.totalPosts,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-500/20',
      progress: Math.min((stats.totalPosts / 20) * 100, 100),
      change: '+3',
      trend: 'up' as const
    }
  ], [stats]);

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statCards.map((card) => (
          <MobileStatsCard key={card.title} {...card} />
        ))}
      </div>
    );
  }

  // Desktop version with enhanced design
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statCards.map(({ title, value, icon: Icon, color, bgColor, change, trend }) => (
        <Card key={title} className="glass-card-enhanced hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${bgColor} shadow-sm`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className={`w-3 h-3 ${trend === 'up' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 font-medium">
                  {change}
                </Badge>
              </div>
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