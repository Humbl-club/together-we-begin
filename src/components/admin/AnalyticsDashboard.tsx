import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Users, 
  Calendar,
  Trophy,
  MessageSquare,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalEvents: number;
  eventsThisMonth: number;
  totalChallenges: number;
  activeChallenges: number;
  totalPosts: number;
  postsThisMonth: number;
  totalMessages: number;
  messagesThisMonth: number;
  userGrowth: Array<{date: string, count: number}>;
  eventAttendance: Array<{date: string, count: number}>;
  challengeParticipation: Array<{challenge_id: string, title: string, participants: number}>;
  popularEvents: Array<{id: string, title: string, registrations: number}>;
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      
      // Calculate date ranges
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get new users this month
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      // Get total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get events this month
      const { count: eventsThisMonth } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      // Get total challenges
      const { count: totalChallenges } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true });

      // Get active challenges
      const { count: activeChallenges } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total posts
      const { count: totalPosts } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get posts this month
      const { count: postsThisMonth } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('created_at', monthStart.toISOString());

      // Get total messages
      const { count: totalMessages } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true });

      // Get messages this month
      const { count: messagesThisMonth } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      // Get popular events (with most registrations)
      const { data: popularEventsData } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_registrations(count)
        `)
        .limit(5);

      const popularEvents = popularEventsData?.map(event => ({
        id: event.id,
        title: event.title,
        registrations: event.event_registrations?.length || 0
      })).sort((a, b) => b.registrations - a.registrations) || [];

      // Get challenge participation data
      const { data: challengeData } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          challenge_participations(count)
        `)
        .eq('status', 'active');

      const challengeParticipation = challengeData?.map(challenge => ({
        challenge_id: challenge.id,
        title: challenge.title,
        participants: challenge.challenge_participations?.length || 0
      })) || [];

      setAnalytics({
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalEvents: totalEvents || 0,
        eventsThisMonth: eventsThisMonth || 0,
        totalChallenges: totalChallenges || 0,
        activeChallenges: activeChallenges || 0,
        totalPosts: totalPosts || 0,
        postsThisMonth: postsThisMonth || 0,
        totalMessages: totalMessages || 0,
        messagesThisMonth: messagesThisMonth || 0,
        userGrowth: [], // Would need more complex query for time series data
        eventAttendance: [], // Would need more complex query for time series data
        challengeParticipation,
        popularEvents
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportData = async () => {
    try {
      const csvContent = `
Metric,Value
Total Users,${analytics?.totalUsers || 0}
New Users This Month,${analytics?.newUsersThisMonth || 0}
Total Events,${analytics?.totalEvents || 0}
Events This Month,${analytics?.eventsThisMonth || 0}
Total Challenges,${analytics?.totalChallenges || 0}
Active Challenges,${analytics?.activeChallenges || 0}
Total Posts,${analytics?.totalPosts || 0}
Posts This Month,${analytics?.postsThisMonth || 0}
Total Messages,${analytics?.totalMessages || 0}
Messages This Month,${analytics?.messagesThisMonth || 0}
      `.trim();

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights and analytics</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={loadAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={exportData} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics?.totalUsers || 0}</p>
                <p className="text-xs text-green-600">
                  +{analytics?.newUsersThisMonth || 0} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{analytics?.totalEvents || 0}</p>
                <p className="text-xs text-green-600">
                  +{analytics?.eventsThisMonth || 0} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Challenges</p>
                <p className="text-2xl font-bold">{analytics?.totalChallenges || 0}</p>
                <p className="text-xs text-blue-600">
                  {analytics?.activeChallenges || 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">{analytics?.totalPosts || 0}</p>
                <p className="text-xs text-green-600">
                  +{analytics?.postsThisMonth || 0} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Popular Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.popularEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.registrations} registrations
                    </p>
                  </div>
                  <Badge variant={index < 3 ? 'default' : 'outline'}>
                    #{index + 1}
                  </Badge>
                </div>
              ))}
              
              {analytics?.popularEvents.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No events with registrations yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Challenge Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.challengeParticipation.map((challenge) => (
                <div key={challenge.challenge_id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium truncate">{challenge.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {challenge.participants} participants
                    </p>
                  </div>
                  <Badge variant="outline">
                    {challenge.participants}
                  </Badge>
                </div>
              ))}
              
              {analytics?.challengeParticipation.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No active challenges yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{analytics?.totalMessages || 0}</p>
                <p className="text-xs text-green-600">
                  +{analytics?.messagesThisMonth || 0} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">User Growth Rate</p>
                <p className="text-2xl font-bold">
                  {analytics?.totalUsers ? 
                    Math.round((analytics.newUsersThisMonth / analytics.totalUsers) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Engagement Score</p>
                <p className="text-2xl font-bold">
                  {analytics?.totalUsers ? 
                    Math.round(((analytics.postsThisMonth + analytics.messagesThisMonth) / analytics.totalUsers) * 10) / 10 : 0}
                </p>
                <p className="text-xs text-muted-foreground">Actions per user</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;