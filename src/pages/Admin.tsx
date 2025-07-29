import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Calendar, Trophy, MessageSquare, Activity, BarChart3, UserCog } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import UserManagement from '@/components/admin/UserManagement';
import InviteManagement from '@/components/admin/InviteManagement';
import ContentModeration from '@/components/admin/ContentModeration';
import EventManagement from '@/components/admin/EventManagement';
import ChallengeManagement from '@/components/admin/ChallengeManagement';
import NotificationManagement from '@/components/admin/NotificationManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import SystemConfiguration from '@/components/admin/SystemConfiguration';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeSection={activeTab} onSectionChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
            <div className="ml-4 flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold gradient-text">Admin Dashboard</h1>
              </div>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Access
              </Badge>
            </div>
          </header>
          
          <main className="flex-1 p-6 space-y-6">
            {activeTab === 'dashboard' && (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
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
                        <Calendar className="w-5 h-5 text-green-500" />
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
                        <Trophy className="w-5 h-5 text-yellow-500" />
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
                        <MessageSquare className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Posts</p>
                          <p className="text-2xl font-bold">{stats.totalPosts}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="glass-card hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/admin/performance')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Activity className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Performance Monitor</h3>
                        <p className="text-sm text-muted-foreground">Real-time app performance metrics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'invites' && <InviteManagement />}
            {activeTab === 'moderation' && <ContentModeration />}
            {activeTab === 'events' && <EventManagement />}
            {activeTab === 'challenges' && <ChallengeManagement />}
            {activeTab === 'notifications' && <NotificationManagement />}
            {activeTab === 'settings' && <SystemConfiguration />}

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;