import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useViewport, useResponsiveValue } from '@/hooks/use-mobile';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, profile, loading } = useDashboardData(user?.id);
  const { isMobile, isTablet } = useViewport();
  
  // Responsive values using the new hook
  const spacing = useResponsiveValue({
    mobile: 'spacing-responsive-md',
    tablet: 'spacing-responsive-md', 
    desktop: 'spacing-responsive-lg',
    default: 'space-y-6'
  });

  const gridCols = useResponsiveValue({
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'lg:grid-cols-3',
    default: 'lg:grid-cols-3'
  });

  if (loading) {
    return (
      <div className={spacing}>
        <div className="animate-pulse spacing-responsive-lg">
          <div className="mobile:h-14 sm:h-16 lg:h-24 bg-muted rounded-xl"></div>
          <div className="grid-responsive-stats">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mobile:h-14 sm:h-16 lg:h-20 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className={`max-w-7xl mx-auto ${spacing}`}>
        {/* Header Section */}
        <DashboardHeader profile={profile} />

        {/* Stats Overview */}
        <StatsGrid stats={stats} />

        {/* Main Content Grid */}
        <div className={`grid ${gridCols} mobile:gap-4 sm:gap-6`}>
          {/* Left Column - Wellness & Quick Actions */}
          <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
            <WellnessCard 
              steps={8420}
              goalSteps={10000}
              leaderboardPosition={12}
              totalParticipants={247}
              challengeName="Spring Steps"
              weeklyProgress={15}
            />
            
            <UpcomingEvents />
          </div>

          {/* Right Column - Community Feed */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-1' : 'col-span-2'}`}>
            <CommunityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;