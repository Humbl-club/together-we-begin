import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Trophy, Users } from 'lucide-react';
import { useViewport, useResponsiveValue } from '@/hooks/use-mobile';

interface DashboardStats {
  loyaltyPoints: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const { isMobile, isTablet } = useViewport();
  
  const statCards = [
    {
      title: 'Points',
      value: stats.loyaltyPoints,
      icon: Award,
      gradient: 'from-amber-500/10 to-yellow-500/10',
      change: '+12',
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      gradient: 'from-blue-500/10 to-indigo-500/10',
      change: '+1',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active',
      value: stats.activeChallenges,
      icon: Trophy,
      gradient: 'from-purple-500/10 to-pink-500/10',
      change: 'New',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Posts',
      value: stats.totalPosts,
      icon: Users,
      gradient: 'from-green-500/10 to-teal-500/10',
      change: '+3',
      color: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="grid-responsive-stats">
      {statCards.map(({ title, value, icon: Icon, gradient, change, color }) => (
        <Card 
          key={title} 
          className="border-0 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:scale-[1.02] transition-all duration-300 mobile-card"
        >
          <CardContent className="mobile:p-3 sm:p-4 lg:p-5">
            <div className="flex items-center justify-between mobile:mb-1 sm:mb-2">
              <div className={`mobile:p-1.5 sm:p-2 lg:p-2.5 rounded-lg bg-gradient-to-br ${gradient} ring-1 ring-border/20`}>
                <Icon className={`mobile:w-3 mobile:h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${color}`} strokeWidth={2.5} />
              </div>
              <Badge 
                variant="secondary" 
                className="mobile:text-[10px] mobile:px-1.5 mobile:py-0.5 sm:text-xs sm:px-2 sm:py-1 bg-primary/10 text-primary border-0 font-medium"
              >
                {change}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="mobile:text-lg sm:text-xl lg:text-2xl xl:text-3xl font-light tracking-tight text-foreground">
                {value.toLocaleString()}
              </p>
              <p className="mobile:text-[10px] sm:text-xs lg:text-xs text-muted-foreground font-medium uppercase tracking-wide leading-none">
                {title}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsGrid;