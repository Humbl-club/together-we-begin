
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Calendar, 
  Trophy, 
  Users, 
  Star,
  TrendingUp
} from 'lucide-react';
import WellnessWidget from '@/components/wellness/WellnessWidget';

interface DashboardStats {
  loyaltyPoints: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    loyaltyPoints: 0,
    upcomingEvents: 0,
    activeChallenges: 0,
    totalPosts: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      setProfile(profileData);

      // Check if this is a new user (no full_name set)
      if (!profileData?.full_name) {
        setShowWelcome(true);
      }

      // Load dashboard stats
      const [eventsResult, challengesResult, postsResult] = await Promise.all([
        supabase
          .from('events')
          .select('id')
          .eq('status', 'upcoming'),
        supabase
          .from('challenges')
          .select('id')
          .eq('status', 'active'),
        supabase
          .from('social_posts')
          .select('id')
          .eq('user_id', user?.id)
          .eq('status', 'active')
      ]);

      setStats({
        loyaltyPoints: profileData?.available_loyalty_points || 0,
        upcomingEvents: eventsResult.data?.length || 0,
        activeChallenges: challengesResult.data?.length || 0,
        totalPosts: postsResult.data?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-3xl"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Loyalty Points',
      value: stats.loyaltyPoints,
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Challenges',
      value: stats.activeChallenges,
      icon: Trophy,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Posts',
      value: stats.totalPosts,
      icon: Heart,
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-900/20'
    }
  ];

  return (
    <>
      {showWelcome && (
        <WelcomeFlow onComplete={() => {
          setShowWelcome(false);
          loadDashboardData(); // Refresh data after profile completion
        }} />
      )}
      
      <div className="space-y-6">
      {/* Welcome Section */}
      <div className="floating-card">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold gradient-text">
              Welcome back, {profile?.full_name || 'Beautiful'}! ✨
            </h1>
            <p className="text-muted-foreground">
              Ready to inspire and be inspired today?
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title} className="glass-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <WellnessWidget />

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Community Highlights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah completed the mindfulness challenge!</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New wellness workshop next week</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
};

export default Dashboard;
