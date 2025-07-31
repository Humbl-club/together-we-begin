import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useToast } from '@/hooks/use-toast';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { MobileFirstNavigation } from '@/components/layout/MobileFirstNavigation';
import MobileDashboard from './MobileDashboard';

// Desktop imports
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';
import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { DashboardLoadingSkeleton } from '@/components/ui/mobile-loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer } from '@/components/ui/mobile-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Zap } from 'lucide-react';

const Dashboard: React.FC = memo(() => {
  const { user } = useAuth();
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
    if (isMobile) {
      return (
        <div 
          className="mobile-app-container"
          style={{
            paddingTop: `max(20px, ${safeAreaInsets.top}px)`,
            paddingBottom: `max(100px, ${safeAreaInsets.bottom + 80}px)`
          }}
        >
          <DashboardLoadingSkeleton />
        </div>
      );
    }
    
    return (
      <MobileContainer>
        <DashboardLoadingSkeleton />
      </MobileContainer>
    );
  }

  // Use dedicated mobile component for optimal mobile experience
  if (isMobile) {
    return (
      <div className="mobile-app-container">
        <MobileDashboard />
        <MobileFirstNavigation profile={profile} />
      </div>
    );
  }

  // Desktop experience
  return (
    <div className="desktop-layout min-h-screen bg-background">
      <ErrorBoundary>
        <div className="desktop-dashboard-container p-6 space-y-6 ml-20">
          <DashboardHeader profile={profile} />
          <StatsGrid stats={stats} />
          
          <div className="responsive-grid lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <UpcomingEvents />
              <CommunityFeed />
            </div>

            <div className="space-y-6">
              <WellnessCard
                steps={8420}
                goalSteps={10000}
                leaderboardPosition={12}
                totalParticipants={247}
                challengeName="Spring Steps"
                weeklyProgress={15}
              />

              <Card className="card-secondary">
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
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
});

export default Dashboard;