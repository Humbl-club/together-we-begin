import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, profile, loading } = useDashboardData(user?.id);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse space-y-6">
          <div className={`${isMobile ? 'h-16' : 'h-24'} bg-muted rounded-xl`}></div>
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`${isMobile ? 'h-16' : 'h-20'} bg-muted rounded-xl`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
        {/* Header Section */}
        <DashboardHeader profile={profile} />

        {/* Stats Overview */}
        <StatsGrid stats={stats} />

        {/* Main Content Grid */}
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Left Column - Wellness & Quick Actions */}
          <div className="space-y-6">
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
          <CommunityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;