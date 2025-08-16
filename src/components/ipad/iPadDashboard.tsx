import React, { memo } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { iPadCard } from './iPadCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useStepTracking } from '@/hooks/useStepTracking';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { 
  Calendar, Users, Trophy, TrendingUp, 
  Heart, Zap, Target, Award,
  MessageCircle, CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface iPadDashboardProps {
  children?: React.ReactNode;
}

const IPadCard = iPadCard;

export const iPadDashboard: React.FC<iPadDashboardProps> = memo(({ children }) => {
  const { isTablet, isDesktop } = useMobileOptimization();
  const { user } = useAuth();
  const { profile } = useDashboardData(user?.id);
  const { todaySteps } = useStepTracking();
  const stepGoal = 10000; // Default goal
  const haptics = useHapticFeedback();

  // Only render on tablet/iPad screens
  if (!isTablet && !isDesktop) {
    return <>{children}</>;
  }

  const stepProgress = stepGoal > 0 ? (todaySteps / stepGoal) * 100 : 0;

  const quickStats = [
    { 
      label: 'Today\'s Steps', 
      value: todaySteps?.toLocaleString() || '0',
      icon: Target,
      color: 'text-emerald-600',
      progress: stepProgress
    },
    { 
      label: 'Weekly Goal', 
      value: '4/7 days',
      icon: Trophy,
      color: 'text-amber-600',
      progress: 57
    },
    { 
      label: 'Community Rank', 
      value: '#12',
      icon: TrendingUp,
      color: 'text-blue-600',
      progress: 88
    },
    { 
      label: 'Total Points', 
      value: '2,847',
      icon: Award,
      color: 'text-purple-600',
      progress: 72
    }
  ];

  const recentActivity = [
    { type: 'challenge', message: 'Completed morning walk challenge', time: '2 hours ago', icon: CheckCircle },
    { type: 'social', message: 'Sarah liked your post', time: '4 hours ago', icon: Heart },
    { type: 'event', message: 'Yoga session starts in 1 hour', time: '6 hours ago', icon: Calendar },
    { type: 'message', message: '3 new messages from the group', time: '8 hours ago', icon: MessageCircle }
  ];

  return (
    <div className="ipad-dashboard-layout">
      {/* Hero Section */}
      <div className="ipad-dashboard-hero">
        <div className="ipad-hero-content">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Good morning, {profile?.full_name?.split(' ')[0] || 'there'}! ✨
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6">
            Ready to continue your wellness journey today?
          </p>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              size="lg" 
              className="ipad-action-button"
              onClick={() => haptics.tap()}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Challenge
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="ipad-action-button-outline"
              onClick={() => haptics.tap()}
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Events
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ipad-stats-grid">
        {quickStats.map((stat, index) => (
          <IPadCard
            key={stat.label}
            variant="glass"
            size="sm"
            className="ipad-stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
              <Badge variant="secondary" className="text-xs">
                {Math.round(stat.progress)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <Progress value={stat.progress} className="h-2" />
            </div>
          </IPadCard>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="ipad-content-grid">
        {/* Left Column - Main Content */}
        <div className="ipad-main-column">
          {children}
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="ipad-sidebar-column">
          {/* Recent Activity */}
          <IPadCard
            title="Recent Activity"
            icon={TrendingUp}
            variant="elevated"
            className="mb-6"
          >
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <activity.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </IPadCard>

          {/* Community Spotlight */}
          <IPadCard
            title="Community Spotlight"
            icon={Users}
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">147</div>
                <p className="text-sm text-muted-foreground">Active members today</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="text-center">
                  <div className="text-lg md:text-xl font-semibold text-foreground">23</div>
                  <p className="text-xs text-muted-foreground">New posts</p>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-xl font-semibold text-foreground">8</div>
                  <p className="text-xs text-muted-foreground">Live events</p>
                </div>
              </div>
            </div>
          </IPadCard>
        </div>
      </div>
    </div>
  );
});

iPadDashboard.displayName = 'iPadDashboard';