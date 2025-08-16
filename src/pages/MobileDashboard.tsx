import React, { memo, Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useToast } from '@/hooks/use-toast';
import { MobileErrorBoundary } from '@/components/ui/mobile-error-boundary';
import { MobileOfflineIndicator } from '@/components/ui/mobile-offline-indicator';

// Mobile-optimized components
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

// Lazy-loaded mobile-optimized components

import WellnessWidget from '@/components/wellness/WellnessWidget';
import HealthPermissionPrompt from '@/components/wellness/HealthPermissionPrompt';
import { WalkingChallengeWidget } from '@/components/wellness/WalkingChallengeWidget';
const LazyMobileUpcomingEvents = React.lazy(() => import('@/components/dashboard/MobileUpcomingEvents'));
const LazyMobileCommunityFeed = React.lazy(() => import('@/components/dashboard/MobileCommunityFeed'));

// Icons
import { RefreshCw, Search, QrCode, Bell, Plus, Calendar, Users, Zap, Menu } from 'lucide-react';

const MobileDashboard: React.FC = memo(() => {
  const { user } = useAuth();
  const { stats, profile, loading, refetch } = useDashboardData(user?.id);
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents();
  const { posts: feedPosts, loading: postsLoading } = useCommunityFeed();
  const { safeAreaInsets } = useMobileFirst();
  const { handleError } = useErrorHandler();
  const { toast } = useToast();
  const feedback = useHapticFeedback();
  
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Mobile-first loading state
  if (loading) {
    return (
      <div 
        className="mobile-app-container"
        style={{
          paddingTop: `max(20px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(100px, ${safeAreaInsets.bottom + 80}px)`
        }}
      >
        <div className="animate-pulse space-y-4 px-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted/60 rounded w-24"></div>
            </div>
            <div className="h-10 w-10 bg-muted rounded-full"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-48 bg-muted rounded-2xl"></div>
            <div className="h-32 bg-muted rounded-2xl"></div>
            <div className="h-64 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    try {
      feedback.impact('light');
      await refetch();
      toast({
        title: "✨ Updated",
        description: "Your dashboard is now fresh!",
      });
      feedback.success();
    } catch (error) {
      handleError(error as Error);
      feedback.error();
    }
  };

  const quickActions = [
    { id: 'scan', icon: QrCode, label: 'Scan QR', action: () => feedback.tap() },
    { id: 'search', icon: Search, label: 'Search', action: () => feedback.tap() },
    { id: 'create', icon: Plus, label: 'Create', action: () => feedback.tap() },
    { id: 'events', icon: Calendar, label: 'Events', action: () => feedback.tap() },
  ];

  return (
    <MobileErrorBoundary>
      <MobileOfflineIndicator />
      <div 
        className="mobile-app-container bg-background"
        style={{
          paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(100px, ${safeAreaInsets.bottom + 80}px)`
        }}
      >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 px-4">
          {/* Mobile Header */}
          <header className="flex items-center justify-between py-2">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Hey, {profile?.full_name?.split(' ')[0] || 'Beautiful'}! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ready to make today amazing?
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <MobileNativeButton
                variant="ghost"
                size="sm"
                className="touch-target"
                onClick={() => {
                  feedback.tap();
                  setShowQuickActions(!showQuickActions);
                }}
              >
                <Menu className="h-5 w-5" />
              </MobileNativeButton>
              
              <MobileNativeButton
                variant="ghost"
                size="sm"
                className="touch-target"
                onClick={() => feedback.tap()}
              >
                <Bell className="h-5 w-5" />
              </MobileNativeButton>
            </div>
          </header>

          {/* Quick Actions Row */}
          {showQuickActions && (
            <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-top duration-300">
              {quickActions.map((action) => (
                <MobileNativeButton
                  key={action.id}
                  variant="secondary"
                  size="sm"
                  className="flex-col h-16 touch-target-large"
                  onClick={action.action}
                >
                  <action.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{action.label}</span>
                </MobileNativeButton>
              ))}
            </div>
          )}

          {/* Mobile Content Stack */}
          <div className="space-y-6">
            {/* Events First */}
            <section>
              <Suspense fallback={<div className="h-32 bg-muted rounded-2xl animate-pulse" />}>
                <LazyMobileUpcomingEvents events={upcomingEvents as any} />
              </Suspense>
            </section>

            {/* Challenges Forefront */}
            <section>
              <WalkingChallengeWidget />
            </section>

            {/* Community Section */}
            <section>
              <Suspense fallback={<div className="h-64 bg-muted rounded-2xl animate-pulse" />}>
                <LazyMobileCommunityFeed posts={feedPosts as any} />
              </Suspense>
            </section>

            {/* Wellness moved below */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
                Your Wellness Journey
              </h2>
              <Suspense fallback={<div className="h-48 bg-muted rounded-2xl animate-pulse" />}>
                <HealthPermissionPrompt onConnected={() => refetch()} />
                <WellnessWidget onChallengeSync={(challengeId) => console.log('Sync challenge:', challengeId)} />
              </Suspense>
            </section>

            {/* Bottom Spacer for Navigation */}
            <div className="h-20" />
          </div>
        </div>
      </PullToRefresh>
      </div>
    </MobileErrorBoundary>
  );
});

export default MobileDashboard;