import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useViewport } from '@/hooks/use-mobile';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, profile, loading } = useDashboardData(user?.id);
  const { isMobile, isTablet } = useViewport();

  if (loading) {
    return (
      <div className="flow-content">
        <div className="animate-pulse">
          <div className="h-16 md:h-24 bg-muted rounded-xl"></div>
          <div className="stats-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 md:h-20 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
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
          <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
            <CommunityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;