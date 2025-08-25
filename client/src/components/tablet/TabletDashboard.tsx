import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Calendar, MessageCircle, Trophy, Users, Plus, Search, Bell, Settings } from 'lucide-react';

interface TabletDashboardProps {
  children?: React.ReactNode;
}

export const TabletDashboard: React.FC<TabletDashboardProps> = memo(({ children }) => {
  const { isTablet, fontSize, spacing, padding } = useMobileOptimization();
  const haptics = useHapticFeedback();

  if (!isTablet) return <>{children}</>;

  const quickActions = [
    { icon: Search, label: 'Search', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Plus, label: 'Create', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Bell, label: 'Notifications', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Settings, label: 'Settings', color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="tablet-dashboard-grid">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {children}
      </div>

      {/* Tablet Sidebar */}
      <div className="tablet-sidebar-content">
        {/* Quick Actions */}
        <Card className="tablet-card-enhanced mb-6">
          <CardHeader className="pb-3">
            <CardTitle className={`${fontSize.heading} flex items-center gap-2`}>
              <Trophy className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="lg"
                  className={`h-auto p-4 flex flex-col items-center gap-2 tablet-nav-item ${action.bg}`}
                  onClick={() => haptics.tap()}
                >
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tablet Stats Overview */}
        <Card className="tablet-card-enhanced mb-6">
          <CardHeader className="pb-3">
            <CardTitle className={`${fontSize.heading} flex items-center gap-2`}>
              <Users className="w-5 h-5 text-primary" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">Next Event</span>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                Tomorrow
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">Messages</span>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                3 new
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium">Steps Today</span>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                6,842
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Community Activity */}
        <Card className="tablet-card-enhanced">
          <CardHeader className="pb-3">
            <CardTitle className={`${fontSize.heading} flex items-center gap-2`}>
              <Users className="w-5 h-5 text-primary" />
              Community Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">12 members online</p>
                  <p className="text-xs text-muted-foreground">Most active today</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">5 new posts</p>
                  <p className="text-xs text-muted-foreground">In the last hour</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">2 events today</p>
                  <p className="text-xs text-muted-foreground">Join now</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

TabletDashboard.displayName = 'TabletDashboard';