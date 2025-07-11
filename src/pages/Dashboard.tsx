import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Trophy, 
  Users, 
  TrendingUp,
  ChevronRight,
  Award,
  Sparkles,
  Plus
} from 'lucide-react';
import WellnessCard from '@/components/dashboard/WellnessCard';
import FeedPost from '@/components/dashboard/FeedPost';

interface DashboardStats {
  loyaltyPoints: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    loyaltyPoints: 125,
    upcomingEvents: 3,
    activeChallenges: 2,
    totalPosts: 8
  });
  const [profile, setProfile] = useState<any>({
    full_name: 'Alexandra Chen',
    avatar_url: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load user profile (skip if no user for testing)
      let profileData = null;
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        profileData = data;
      }

      if (profileData) setProfile(profileData);

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
        loyaltyPoints: profileData?.available_loyalty_points || 125,
        upcomingEvents: eventsResult.data?.length || 3,
        activeChallenges: challengesResult.data?.length || 2,
        totalPosts: postsResult.data?.length || 8
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const mockFeedPosts = [
    {
      author: { name: 'Emma Richardson', handle: 'emmarich', avatar: undefined },
      content: 'Just completed my morning meditation and I feel so centered. The mindfulness challenge is really helping me build consistency.',
      likes: 24,
      comments: 8,
      timestamp: '2h ago',
      achievement: { type: 'Milestone', title: '7-Day Mindfulness Streak' }
    },
    {
      author: { name: 'Sofia Martinez', handle: 'sofia_moves', avatar: undefined },
      content: 'Beautiful sunrise run this morning! The city looks magical when the world is still quiet.',
      image: `https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop`,
      likes: 42,
      comments: 12,
      timestamp: '4h ago'
    }
  ];

  const statCards = [
    {
      title: 'Points',
      value: stats.loyaltyPoints,
      icon: Award,
      gradient: 'from-amber-500/10 to-yellow-500/10',
      change: '+12'
    },
    {
      title: 'Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      gradient: 'from-blue-500/10 to-indigo-500/10',
      change: '+1'
    },
    {
      title: 'Active',
      value: stats.activeChallenges,
      icon: Trophy,
      gradient: 'from-purple-500/10 to-pink-500/10',
      change: 'New'
    },
    {
      title: 'Posts',
      value: stats.totalPosts,
      icon: Users,
      gradient: 'from-green-500/10 to-teal-500/10',
      change: '+3'
    }
  ];

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
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-medium">
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'AC'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">
                  Good morning, {profile?.full_name?.split(' ')[0] || 'Alexandra'}
                </h1>
                <p className="text-muted-foreground mt-1 font-light">
                  Your wellness journey continues
                </p>
              </div>
            </div>
            <Button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Share Update
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ title, value, icon: Icon, gradient, change }) => (
            <Card key={title} className="border-0 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                    <Icon className="w-4 h-4 text-foreground/70" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                    {change}
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-light tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
            
            {/* Upcoming Events */}
            <Card className="border-0 bg-card/40 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">This Week</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Mindful Movement Workshop</p>
                    <p className="text-xs text-muted-foreground">Tomorrow, 6:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg">
                  <div className="w-2 h-8 bg-muted rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Book Club: Wellness & You</p>
                    <p className="text-xs text-muted-foreground">Friday, 7:30 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Community Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light tracking-tight">Community</h2>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Latest updates</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {mockFeedPosts.map((post, index) => (
                <FeedPost key={index} {...post} />
              ))}
              
              {/* Load More */}
              <Card className="border-0 bg-card/20 backdrop-blur-sm border-dashed border-2 border-muted">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Stay connected with your community</p>
                  <Button variant="outline" className="bg-background/50">
                    Load More Stories
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;