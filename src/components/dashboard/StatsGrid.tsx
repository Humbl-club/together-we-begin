import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Trophy, Users } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';

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
    <div className="stats-grid">
      {statCards.map(({ title, value, icon: Icon, gradient, change, color }) => (
        <Card key={title} className="adaptive-card smooth-entrance">
          <CardContent className="p-fluid-3">
            <div className="cluster justify-between mb-fluid-2">
              <div className={`p-fluid-2 rounded-lg bg-gradient-to-br ${gradient} ring-1 ring-border/20`}>
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} strokeWidth={2.5} />
              </div>
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 font-medium">
                {change}
              </Badge>
            </div>
            <div className="flow-content">
              <p className="fluid-xl font-light tracking-tight text-foreground">
                {value.toLocaleString()}
              </p>
              <p className="fluid-xs text-muted-foreground font-medium uppercase tracking-wide leading-none">
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