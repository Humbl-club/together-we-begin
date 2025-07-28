import React, { memo, Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useViewport } from '@/hooks/use-mobile';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';
import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { DashboardSkeleton } from '@/components/ui/optimized-skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useToast } from '@/hooks/use-toast';

// Mobile-enhanced components
import { MobileStatsRing } from '@/components/ui/mobile-stats-ring';
import { SwipeableCard } from '@/components/ui/swipeable-card';
import { MobileActionSheet } from '@/components/ui/mobile-action-sheet';

// Icons and UI
import { 
  RefreshCw, 
  Search, 
  QrCode, 
  Bell, 
  Plus, 
  Calendar,
  Users,
  Zap,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load heavy components for better initial load performance
const LazyWellnessCard = React.lazy(() => import('@/components/dashboard/WellnessCard'));
const LazyCommunityFeed = React.lazy(() => import('@/components/dashboard/CommunityFeed'));

const Dashboard: React.FC = memo(() => {
  const { user } = useAuth();
  const { stats, profile, loading, refetch } = useDashboardData(user?.id);
  const { isMobile, isTablet } = useViewport();
  const { handleError } = useErrorHandler();
  const progressiveEnhancement = useProgressiveEnhancement();
  const isEnhanced = true; // Enable enhanced features for now
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Pull to refresh functionality
  const { containerRef, isRefreshing, isPulling, refreshIndicatorStyle } = usePullToRefresh({
    onRefresh: async () => {
      try {
        await refetch();
        toast({
          title: "Dashboard updated",
          description: "Your latest data has been loaded",
        });
      } catch (error) {
        handleError(error as Error);
      }
    }
  });

  console.log('Dashboard render:', { user, stats, profile, loading });

  useEffect(() => {
    // Show onboarding if user hasn't completed profile
    if (!loading && profile && !profile.full_name) {
      setShowOnboarding(true);
    }
  }, [loading, profile]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh the dashboard data
    window.location.reload();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <WelcomeFlow onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  // Quick actions for mobile action sheet
  const quickActions = [
    {
      id: 'qr-scan',
      label: 'Scan QR Code',
      icon: QrCode,
      onSelect: () => console.log('QR scan')
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onSelect: () => console.log('Search')
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      onSelect: () => console.log('Notifications')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onSelect: () => console.log('Settings')
    }
  ];

  return (
    <ErrorBoundary>
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="space-y-6 relative overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Pull to refresh indicator */}
        {(isPulling || isRefreshing) && (
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50"
            style={refreshIndicatorStyle}
          >
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg border">
              <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            </div>
          </div>
        )}

        {/* Enhanced Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={profile?.avatar_url || '/placeholder.svg'} 
                  alt="Profile"
                  className="w-12 h-12 rounded-full ring-2 ring-primary/20"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.full_name?.split(' ')[0] || 'Welcome back'}
                </p>
              </div>
            </div>
            
            <MobileActionSheet
              trigger={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Plus className="w-5 h-5" />
                </Button>
              }
              title="Quick Actions"
              actions={quickActions}
            />
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <DashboardHeader profile={profile} />
        )}

        {/* Enhanced Stats Grid with Mobile Rings */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isMobile ? (
            // Mobile ring stats
            <>
              <SwipeableCard 
                className="p-4 text-center"
                onTap={() => console.log('Points tapped')}
              >
                <MobileStatsRing value={stats.loyaltyPoints} max={200} size="md">
                  <div className="text-center">
                    <div className="text-lg font-bold">{stats.loyaltyPoints}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                </MobileStatsRing>
              </SwipeableCard>
              
              <SwipeableCard 
                className="p-4 text-center"
                onTap={() => console.log('Events tapped')}
              >
                <MobileStatsRing value={stats.upcomingEvents} max={10} size="md" color="hsl(var(--blue-500))">
                  <div className="text-center">
                    <div className="text-lg font-bold">{stats.upcomingEvents}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                </MobileStatsRing>
              </SwipeableCard>
              
              <SwipeableCard 
                className="p-4 text-center"
                onTap={() => console.log('Challenges tapped')}
              >
                <MobileStatsRing value={stats.activeChallenges} max={5} size="md" color="hsl(var(--purple-500))">
                  <div className="text-center">
                    <div className="text-lg font-bold">{stats.activeChallenges}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </MobileStatsRing>
              </SwipeableCard>
              
              <SwipeableCard 
                className="p-4 text-center"
                onTap={() => console.log('Posts tapped')}
              >
                <MobileStatsRing value={stats.totalPosts} max={20} size="md" color="hsl(var(--green-500))">
                  <div className="text-center">
                    <div className="text-lg font-bold">{stats.totalPosts}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                </MobileStatsRing>
              </SwipeableCard>
            </>
          ) : (
            // Desktop stats grid
            <StatsGrid stats={stats} />
          )}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <UpcomingEvents />

            {/* Community Feed */}
            {isEnhanced && (
              <Suspense fallback={<div className="h-96 bg-muted rounded-xl animate-pulse" />}>
                <LazyCommunityFeed />
              </Suspense>
            )}
          </div>

          <div className="space-y-6">
            {/* Enhanced Wellness Card */}
            <Suspense fallback={<div className="h-64 bg-muted rounded-xl animate-pulse" />}>
              <LazyWellnessCard
                steps={8420}
                goalSteps={10000}
                leaderboardPosition={12}
                totalParticipants={247}
                challengeName="Spring Steps"
                weeklyProgress={15}
              />
            </Suspense>

            {/* Quick Actions Card for Desktop */}
            {!isMobile && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Challenge
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default Dashboard;