import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Trophy, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const statCards = [
    {
      title: 'Points',
      value: stats.loyaltyPoints,
      icon: Award,
      gradient: 'from-amber-500/10 to-yellow-500/10',
      change: '+12'
    },
    {
      title: 'Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      gradient: 'from-blue-500/10 to-indigo-500/10',
      change: '+1'
    },
    {
      title: 'Active',
      value: stats.activeChallenges,
      icon: Trophy,
      gradient: 'from-purple-500/10 to-pink-500/10',
      change: 'New'
    },
    {
      title: 'Posts',
      value: stats.totalPosts,
      icon: Users,
      gradient: 'from-green-500/10 to-teal-500/10',
      change: '+3'
    }
  ];

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
      {statCards.map(({ title, value, icon: Icon, gradient, change }) => (
        <Card key={title} className="border-0 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
              <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-gradient-to-br ${gradient}`}>
                <Icon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-foreground/70`} />
              </div>
              <Badge variant="secondary" className={`${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs'} bg-primary/10 text-primary border-0`}>
                {change}
              </Badge>
            </div>
            <div>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-light tracking-tight`}>{value}</p>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground font-medium uppercase tracking-wide`}>{title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsGrid;