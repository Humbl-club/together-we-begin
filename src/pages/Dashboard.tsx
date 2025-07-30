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
import { DashboardLoadingSkeleton } from '@/components/ui/mobile-loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { MobileContainer, MobileSection } from '@/components/ui/mobile-container';
import { MobileOptimizedButton } from '@/components/ui/mobile-optimized-button';
import { useToast } from '@/hooks/use-toast';

// Mobile-enhanced components
import { MobileStatsRing } from '@/components/ui/mobile-stats-ring';
import { SwipeableCard, GestureZone } from '@/components/ui/gesture-components';
import { IOSModal } from '@/components/ui/ios-modal';
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
    return (
      <MobileContainer>
        <DashboardLoadingSkeleton />
      </MobileContainer>
    );
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<DashboardLoadingSkeleton />}>
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
      <PullToRefresh 
        onRefresh={async () => {
          try {
            await refetch();
            toast({
              title: "Dashboard updated",
              description: "Your latest data has been loaded",
            });
          } catch (error) {
            handleError(error as Error);
          }
        }}
        className="space-y-6 min-h-screen"
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
        {isMobile ? (
          <DashboardHeader profile={profile} />
        ) : (
          <DashboardHeader profile={profile} />
        )}

        {/* Enhanced Stats Grid with Mobile-First Design */}
        <StatsGrid stats={stats} />

        {/* Content Grid */}
        <div className="responsive-grid lg:grid-cols-3">
          <div className="lg:col-span-2 space-mobile">
            {/* Upcoming Events */}
            <UpcomingEvents />

            {/* Community Feed */}
            {isEnhanced && (
              <Suspense fallback={<div className="h-96 bg-muted/20 rounded-xl animate-pulse" />}>
                <LazyCommunityFeed />
              </Suspense>
            )}
          </div>

          <div className="space-mobile">
            {/* Enhanced Wellness Card */}
            <Suspense fallback={<div className="h-64 bg-muted rounded-xl animate-pulse" />}>
              <WellnessCard
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
              <Card className="card-secondary">
                <CardHeader>
                  <CardTitle className="editorial-heading text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-mobile">
                  <Button variant="outline" className="w-full justify-start button-glass" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                  <Button variant="outline" className="w-full justify-start button-glass" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                  <Button variant="outline" className="w-full justify-start button-glass" size="sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Challenge
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PullToRefresh>
    </ErrorBoundary>
  );
});

export default Dashboard;