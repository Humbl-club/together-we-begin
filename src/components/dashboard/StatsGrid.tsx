import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Trophy, Users } from 'lucide-react';

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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map(({ title, value, icon: Icon, gradient, change }) => (
        <Card key={title} className="border-0 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                <Icon className="w-4 h-4 text-foreground/70" />
              </div>
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                {change}
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-light tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsGrid;