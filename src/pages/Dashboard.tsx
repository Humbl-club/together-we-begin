import React, { memo, Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useViewport } from '@/hooks/use-mobile';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';
import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { DashboardSkeleton } from '@/components/ui/optimized-skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Lazy load heavy components for better initial load performance
const LazyWellnessCard = React.lazy(() => import('@/components/dashboard/WellnessCard'));
const LazyCommunityFeed = React.lazy(() => import('@/components/dashboard/CommunityFeed'));

const Dashboard: React.FC = memo(() => {
  const { user } = useAuth();
  const { stats, profile, loading } = useDashboardData(user?.id);
  const { isMobile } = useViewport();
  const { handleError } = useErrorHandler();
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  return (
    <ErrorBoundary>
      {showOnboarding && <WelcomeFlow onComplete={handleOnboardingComplete} />}
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto p-fluid-4 flow-content">
          {/* Header Section */}
          <DashboardHeader profile={profile} />

          {/* Stats Overview */}
          <StatsGrid stats={stats} />

          {/* Main Content Grid */}
          <div className={isMobile ? 'flow-content' : 'responsive-grid'}>
            {/* Left Column - Wellness & Quick Actions */}
            <div className="flow-content">
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
              
              <UpcomingEvents />
            </div>

            {/* Right Column - Community Feed */}
            <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
              <Suspense fallback={<div className="h-96 bg-muted rounded-xl animate-pulse" />}>
                <LazyCommunityFeed />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default Dashboard;