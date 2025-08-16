import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useToast } from '@/hooks/use-toast';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import MobileDashboard from './MobileDashboard';

// Desktop imports
import DashboardHeader from '@/components/dashboard/DashboardHeader';

import WellnessWidget from '@/components/wellness/WellnessWidget';
import HealthPermissionPrompt from '@/components/wellness/HealthPermissionPrompt';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';
import { WalkingChallengeWidget } from '@/components/wellness/WalkingChallengeWidget';
import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { DashboardLoadingSkeleton, MobileLoading } from '@/components/ui/mobile-loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EnhancedErrorBoundary } from '@/hooks/useEnhancedErrorBoundary';
import { MobileContainer } from '@/components/ui/mobile-container';
import { CardKit, CardKitContent, CardKitHeader, CardKitTitle } from '@/components/ui/card-kit';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/seo/SEO';
import { Calendar, Users, Zap } from 'lucide-react';

const Dashboard: React.FC = memo(() => {
  const { user, isAdmin } = useAuth();
  const { stats, profile, loading, refetch } = useDashboardData(user?.id);
  const { isMobile, isTablet, safeAreaInsets } = useMobileFirst();
  const { handleError } = useErrorHandler();
  const { toast } = useToast();
  const { usePullToRefresh } = useProgressiveEnhancement();

  // Add pull to refresh functionality
  usePullToRefresh(async () => {
    try {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Dashboard data updated"
      });
    } catch (error) {
      console.error('Pull to refresh failed:', error);
    }
  });

  console.log('Dashboard render:', { user, stats, profile, loading });

  if (loading) {
    return <MobileLoading variant="skeleton" size="lg" text="Loading dashboard..." />;
  }

  // Use dedicated mobile component for optimal mobile experience
  if (isMobile) {
    return (
      <div className="mobile-app-container" data-pull-refresh>
        <SEO title="Dashboard" description="Your community, events, and wellness at a glance." canonical="/dashboard" />
        <h1 className="sr-only">Dashboard</h1>
        <MobileDashboard />
      </div>
    );
  }

  // Enhanced Tablet experience with iPad Layout
  if (isTablet) {
    return (
      <div className="ipad-layout min-h-screen bg-background" data-pull-refresh>
        <EnhancedErrorBoundary
          showErrorDetails={process.env.NODE_ENV === 'development'}
          allowRetry={true}
        >
          <SEO title="Dashboard" description="Your community, events, and wellness at a glance." canonical="/dashboard" />
          <h1 className="sr-only">Dashboard</h1>
          
          {/* Use iPad Dashboard Component */}
          <div className="space-y-6">
            <div className="space-y-4">
              <WalkingChallengeWidget />
              <UpcomingEvents />
              <CommunityFeed />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthPermissionPrompt onConnected={() => refetch()} />
              <WellnessWidget onChallengeSync={(challengeId) => console.log('Sync challenge:', challengeId)} />
            </div>

            {isAdmin && (
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" size="default" className="tablet-button touch-target-tablet" aria-label="Start a challenge">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Challenge
                </Button>
                <Button variant="outline" size="default" className="tablet-button touch-target-tablet" aria-label="Create an event">
                  <Calendar className="w-5 h-5 mr-2" />
                  Create Event
                </Button>
              </div>
            )}
          </div>
        </EnhancedErrorBoundary>
      </div>
    );
  }

  // Enhanced Desktop experience
  return (
    <div className="desktop-layout min-h-screen bg-background" data-pull-refresh>
      <EnhancedErrorBoundary
        showErrorDetails={process.env.NODE_ENV === 'development'}
        allowRetry={true}
      >
        <div className="desktop-dashboard-container p-6 space-y-6 ml-20">
          <SEO title="Dashboard" description="Your community, events, and wellness at a glance." canonical="/dashboard" />
          <h1 className="sr-only">Dashboard</h1>
          <DashboardHeader profile={profile} />

          {/* Hero Strip */}
          <section className="relative overflow-hidden rounded-2xl bg-atelier-hero motion-safe:animate-fade-in">
            <div className="glass-card p-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold font-display tracking-tight text-foreground">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Friend'} ✨
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Let’s make today empowering and fun.
                </p>
              </div>
              <div className="hidden md:flex gap-2">
                <Button variant="secondary" size="sm" className="touch-target" aria-label="Start a challenge" haptic="light">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Challenge
                </Button>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="touch-target" aria-label="Create an event" haptic="light">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>
            </div>
          </section>

          <div className="responsive-grid lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <WalkingChallengeWidget />
              <UpcomingEvents />
              <CommunityFeed />
            </div>

            <div className="space-y-6">
              <HealthPermissionPrompt onConnected={() => refetch()} />
              <WellnessWidget onChallengeSync={(challengeId) => console.log('Sync challenge:', challengeId)} />

              <CardKit className="motion-safe:animate-fade-in">
                <CardKitHeader>
                  <CardKitTitle className="text-lg">Quick Actions</CardKitTitle>
                </CardKitHeader>
                <CardKitContent className="space-y-3">
                  {isAdmin && (
                    <Button variant="outline" className="w-full justify-start" size="sm" haptic="tap">
                      <Calendar className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start" size="sm" haptic="tap">
                    <Users className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm" haptic="tap">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Challenge
                  </Button>
                </CardKitContent>
              </CardKit>
            </div>
          </div>
        </div>
      </EnhancedErrorBoundary>
    </div>
  );
});

export default Dashboard;