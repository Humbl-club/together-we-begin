import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Calendar, Trophy, MessageSquare, Activity, BarChart3, Settings, Flag, Bell } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import InviteManagement from '@/components/admin/InviteManagement';
import ContentModeration from '@/components/admin/ContentModeration';
import EventManagement from '@/components/admin/EventManagement';
import ChallengeManagement from '@/components/admin/ChallengeManagement';
import NotificationManagement from '@/components/admin/NotificationManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import SystemConfiguration from '@/components/admin/SystemConfiguration';

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEvents: 0,
    activeChallenges: 0,
    totalPosts: 0
  });
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    try {
      const [usersCount, eventsCount, challengesCount, postsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).in('status', ['upcoming', 'ongoing']),
        supabase.from('challenges').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        activeEvents: eventsCount.count || 0,
        activeChallenges: challengesCount.count || 0,
        totalPosts: postsCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-hero">
      <div className="container max-w-7xl mx-auto p-4">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Access
          </Badge>
        </div>

        {/* Mobile-First Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="glass-nav rounded-lg p-1 mb-6 overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 min-w-max">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] data-[state=active]:bg-background/90 data-[state=active]:text-foreground"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] data-[state=active]:bg-background/90 data-[state=active]:text-foreground"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="content" 
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] data-[state=active]:bg-background/90 data-[state=active]:text-foreground"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="system" 
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] data-[state=active]:bg-background/90 data-[state=active]:text-foreground"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Events</p>
                      <p className="text-2xl font-bold">{stats.activeEvents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Challenges</p>
                      <p className="text-2xl font-bold">{stats.activeChallenges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                      <p className="text-2xl font-bold">{stats.totalPosts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/admin/performance')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Performance Monitor</h3>
                      <p className="text-sm text-muted-foreground">Real-time app performance metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Analytics Overview</h3>
                      <p className="text-sm text-muted-foreground">View detailed analytics data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Tabs defaultValue="management" className="w-full">
              <div className="glass-nav rounded-lg p-1 mb-4">
                <TabsList className="grid w-full grid-cols-3 bg-transparent gap-1">
                  <TabsTrigger value="management" className="data-[state=active]:bg-background/90">Management</TabsTrigger>
                  <TabsTrigger value="invites" className="data-[state=active]:bg-background/90">Invites</TabsTrigger>
                  <TabsTrigger value="moderation" className="data-[state=active]:bg-background/90">Moderation</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="management"><UserManagement /></TabsContent>
              <TabsContent value="invites"><InviteManagement /></TabsContent>
              <TabsContent value="moderation"><ContentModeration /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Tabs defaultValue="events" className="w-full">
              <div className="glass-nav rounded-lg p-1 mb-4">
                <TabsList className="grid w-full grid-cols-2 bg-transparent gap-1">
                  <TabsTrigger value="events" className="data-[state=active]:bg-background/90">Events</TabsTrigger>
                  <TabsTrigger value="challenges" className="data-[state=active]:bg-background/90">Challenges</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="events"><EventManagement /></TabsContent>
              <TabsContent value="challenges"><ChallengeManagement /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Tabs defaultValue="analytics" className="w-full">
              <div className="glass-nav rounded-lg p-1 mb-4">
                <TabsList className="grid w-full grid-cols-3 bg-transparent gap-1">
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-background/90">Analytics</TabsTrigger>
                  <TabsTrigger value="notifications" className="data-[state=active]:bg-background/90">Notifications</TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-background/90">Settings</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
              <TabsContent value="notifications"><NotificationManagement /></TabsContent>
              <TabsContent value="settings"><SystemConfiguration /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;