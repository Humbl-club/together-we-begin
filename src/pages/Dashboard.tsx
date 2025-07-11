import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import WellnessCard from '@/components/dashboard/WellnessCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import CommunityFeed from '@/components/dashboard/CommunityFeed';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, profile, loading } = useDashboardData(user?.id);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <DashboardHeader profile={profile} />

        {/* Stats Overview */}
        <StatsGrid stats={stats} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
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