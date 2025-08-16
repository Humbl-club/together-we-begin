import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Calendar, Trophy, Users, TrendingUp } from 'lucide-react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface DashboardStats {
  nextEventInDays: number;
  unreadMessages: number;
  stepsToday: number;
  newPostsToday: number;
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
      className="card-primary touch-target-large cursor-pointer hover:scale-[1.03] transition-all duration-300 overflow-hidden"
      onClick={() => haptics.tap()}
    >
      <CardContent className="p-mobile space-mobile">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgColor} shadow-lg`}>
            <Icon className={`w-6 h-6 ${color}`} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-3 h-3 ${trend === 'up' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Badge variant="secondary" className="text-xs font-bold bg-primary/15 text-primary border-0 px-2">
              {change}
            </Badge>
          </div>
        </div>
        
        <div className="space-mobile">
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
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const haptics = useHapticFeedback();
  
  const statCards = useMemo(() => [
    {
      title: 'Next Event (days)',
      value: stats.nextEventInDays,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: Math.min((stats.nextEventInDays / 14) * 100, 100),
      change: stats.nextEventInDays === 0 ? 'Today' : `${stats.nextEventInDays}d`,
      trend: 'stable' as const
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: Math.min((stats.unreadMessages / 20) * 100, 100),
      change: stats.unreadMessages > 0 ? `+${stats.unreadMessages}` : '0',
      trend: stats.unreadMessages > 0 ? 'up' as const : 'stable' as const
    },
    {
      title: 'Steps Today',
      value: stats.stepsToday,
      icon: Trophy,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: Math.min((stats.stepsToday / 8000) * 100, 100),
      change: `${Math.min(100, Math.round((stats.stepsToday / 8000) * 100))}%`,
      trend: 'up' as const
    },
  ], [stats]);

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3 mx-1 mb-4">
        {statCards.map((card) => (
          <Card 
            key={card.title}
            className="card-secondary touch-feedback p-3 rounded-xl"
            onClick={() => haptics.tap()}
          >
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight leading-none">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-1 leading-tight">
                    {card.title}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 px-2 py-0.5">
                  {card.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop version with unified design
  return (
    <div className="responsive-grid grid-cols-2 lg:grid-cols-4 mb-6">
      {statCards.map(({ title, value, icon: Icon, color, bgColor, change, trend }) => (
        <Card key={title} className="card-primary hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-mobile">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${bgColor} shadow-sm`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-3 h-3 ${trend === 'up' ? 'text-primary' : 'text-muted-foreground'}`} />
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