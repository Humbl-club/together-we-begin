import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Trophy, 
  MessageSquare, 
  Shield, 
  Gift,
  UserPlus,
  Flag,
  BarChart,
  Settings,
  Copy,
  Check,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  available_loyalty_points: number | null;
  total_loyalty_points: number | null;
  created_at: string;
}

interface Invite {
  id: string;
  code: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
  notes: string | null;
  created_by: string | null;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
  used_by_profile?: {
    full_name: string | null;
    username: string | null;
  };
}

interface FlaggedPost {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    username: string | null;
  };
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEvents: 0,
    activeChallenges: 0,
    totalPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Enhanced invite state
  const [inviteFilter, setInviteFilter] = useState('all');
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteStartDate, setInviteStartDate] = useState<Date | undefined>();
  const [inviteEndDate, setInviteEndDate] = useState<Date | undefined>();
  const [newInviteNotes, setNewInviteNotes] = useState('');
  const [newInviteExpiry, setNewInviteExpiry] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [bulkCreateCount, setBulkCreateCount] = useState(1);
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Filtered invites computation
  const filteredInvites = useMemo(() => {
    return invites.filter(invite => {
      // Status filter
      if (inviteFilter !== 'all' && invite.status !== inviteFilter) return false;
      
      // Search filter
      if (inviteSearch && !invite.code.toLowerCase().includes(inviteSearch.toLowerCase())) return false;
      
      // Date range filter
      const createdDate = new Date(invite.created_at);
      if (inviteStartDate && createdDate < inviteStartDate) return false;
      if (inviteEndDate && createdDate > inviteEndDate) return false;
      
      return true;
    });
  }, [invites, inviteFilter, inviteSearch, inviteStartDate, inviteEndDate]);
  
  // Invite analytics computation
  const inviteAnalytics = useMemo(() => {
    const usedInvites = invites.filter(i => i.status === 'used');
    const totalInvites = invites.length;
    const successRate = totalInvites > 0 ? ((usedInvites.length / totalInvites) * 100).toFixed(1) : 0;
    
    // Calculate average time to use invite
    const timesToUse = usedInvites
      .filter(i => i.used_at && i.created_at)
      .map(i => new Date(i.used_at!).getTime() - new Date(i.created_at).getTime());
    
    const avgTimeToUse = timesToUse.length > 0 
      ? Math.round(timesToUse.reduce((a, b) => a + b, 0) / timesToUse.length / (1000 * 60 * 60 * 24))
      : 0;
    
    // Find most active inviter
    const inviterCounts = invites
      .filter(i => i.created_by)
      .reduce((acc, i) => {
        const creator = i.profiles?.full_name || i.profiles?.username || 'Unknown';
        acc[creator] = (acc[creator] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const mostActiveInviter = Object.entries(inviterCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      successRate: parseFloat(successRate.toString()),
      avgTimeToUse,
      mostActiveInviter: mostActiveInviter ? mostActiveInviter[0] : 'None',
      mostActiveInviterCount: mostActiveInviter ? mostActiveInviter[1] : 0
    };
  }, [invites]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchInvites(),
        fetchFlaggedPosts(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, available_loyalty_points, total_loyalty_points, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile information separately for created_by and used_by
      const invitesWithProfiles = await Promise.all(
        (data || []).map(async (invite) => {
          const [creatorProfile, usedByProfile] = await Promise.all([
            invite.created_by ? supabase
              .from('profiles')
              .select('full_name, username')
              .eq('id', invite.created_by)
              .single() : Promise.resolve({ data: null }),
            invite.used_by ? supabase
              .from('profiles')
              .select('full_name, username')
              .eq('id', invite.used_by)
              .single() : Promise.resolve({ data: null })
          ]);
          
          return {
            ...invite,
            profiles: creatorProfile.data,
            used_by_profile: usedByProfile.data
          };
        })
      );
      
      setInvites(invitesWithProfiles);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('status', 'flagged')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For now, set mock profile data for flagged posts
      const postsWithMockProfiles = (data || []).map(post => ({
        ...post,
        profiles: {
          full_name: 'Sophia Williams',
          username: 'sophiaw'
        }
      }));
      
      setFlaggedPosts(postsWithMockProfiles);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
    }
  };

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
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createInvite = async () => {
    try {
      const invitePromises = [];
      
      for (let i = 0; i < bulkCreateCount; i++) {
        const code = newInviteCode || generateInviteCode();
        invitePromises.push(
          supabase
            .from('invites')
            .insert([{
              code: (bulkCreateCount > 1 ? generateInviteCode() : code).toUpperCase(),
              created_by: user!.id,
              expires_at: newInviteExpiry?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              notes: newInviteNotes || null
            }])
        );
      }

      const results = await Promise.all(invitePromises);
      const hasError = results.some(result => result.error);
      
      if (hasError) throw new Error('Some invites failed to create');

      toast({
        title: "Success",
        description: `${bulkCreateCount} invite code${bulkCreateCount > 1 ? 's' : ''} created successfully!`
      });

      setNewInviteCode('');
      setNewInviteNotes('');
      setBulkCreateCount(1);
      setNewInviteExpiry(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      fetchInvites();
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: "Error",
        description: "Failed to create invite code(s)",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const moderatePost = async (postId: string, action: 'approve' | 'remove') => {
    try {
      const status = action === 'approve' ? 'active' : 'removed';
      
      const { error } = await supabase
        .from('social_posts')
        .update({ status })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Post ${action === 'approve' ? 'approved' : 'removed'} successfully`
      });

      fetchFlaggedPosts();
    } catch (error) {
      console.error('Error moderating post:', error);
      toast({
        title: "Error",
        description: "Failed to moderate post",
        variant: "destructive"
      });
    }
  };

  const awardLoyaltyPoints = async (userId: string, points: number, description: string) => {
    try {
      const { error } = await supabase
        .from('loyalty_transactions')
        .insert([{
          user_id: userId,
          type: 'earned',
          points: points,
          description: description,
          reference_type: 'admin_award'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${points} points awarded successfully!`
      });

      fetchUsers();
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: "Error",
        description: "Failed to award points",
        variant: "destructive"
      });
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
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your HUMBL community</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Admin Access
        </Badge>
      </div>

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

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Available Points</TableHead>
                      <TableHead>Total Points</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.full_name || 'Unnamed User'}
                        </TableCell>
                        <TableCell>
                          {user.username ? `@${user.username}` : '-'}
                        </TableCell>
                        <TableCell>
                          {user.available_loyalty_points || 0}
                        </TableCell>
                        <TableCell>
                          {user.total_loyalty_points || 0}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Gift className="w-4 h-4 mr-1" />
                                Award Points
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Award Loyalty Points</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User: {user.full_name || user.username || 'Unnamed User'}</Label>
                                </div>
                                <div>
                                  <Label htmlFor="points">Points to Award</Label>
                                  <Input
                                    id="points"
                                    type="number"
                                    placeholder="100"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        const points = parseInt((e.target as HTMLInputElement).value);
                                        if (points > 0) {
                                          awardLoyaltyPoints(user.id, points, 'Admin bonus points');
                                        }
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    const input = document.getElementById('points') as HTMLInputElement;
                                    const points = parseInt(input.value);
                                    if (points > 0) {
                                      awardLoyaltyPoints(user.id, points, 'Admin bonus points');
                                    }
                                  }}
                                  className="w-full"
                                >
                                  Award Points
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {/* Invite Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{inviteAnalytics.successRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Time to Use</p>
                    <p className="text-2xl font-bold">{inviteAnalytics.avgTimeToUse}d</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Top Inviter</p>
                    <p className="text-lg font-bold truncate">{inviteAnalytics.mostActiveInviter}</p>
                    <p className="text-xs text-muted-foreground">{inviteAnalytics.mostActiveInviterCount} invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invite Management</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Invite</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="invite-code">Custom Code (Optional)</Label>
                        <Input
                          id="invite-code"
                          value={newInviteCode}
                          onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                          placeholder="Leave blank for auto-generated"
                          maxLength={8}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="invite-notes">Notes</Label>
                        <Textarea
                          id="invite-notes"
                          value={newInviteNotes}
                          onChange={(e) => setNewInviteNotes(e.target.value)}
                          placeholder="Who is this invite for?"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Expiration Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newInviteExpiry && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newInviteExpiry ? format(newInviteExpiry, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={newInviteExpiry}
                              onSelect={setNewInviteExpiry}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label htmlFor="bulk-count">Bulk Create</Label>
                        <Select value={bulkCreateCount.toString()} onValueChange={(value) => setBulkCreateCount(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 5, 10, 20, 50].map(count => (
                              <SelectItem key={count} value={count.toString()}>
                                {count} invite{count > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={createInvite} className="w-full">
                        Create {bulkCreateCount > 1 ? `${bulkCreateCount} ` : ''}Invite Code{bulkCreateCount > 1 ? 's' : ''}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invite codes..."
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={inviteFilter} onValueChange={setInviteFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[140px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        From
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={inviteStartDate}
                        onSelect={setInviteStartDate}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[140px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        To
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={inviteEndDate}
                        onSelect={setInviteEndDate}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {(inviteStartDate || inviteEndDate) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setInviteStartDate(undefined);
                        setInviteEndDate(undefined);
                      }}
                      size="sm"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-mono font-bold">
                          {invite.code}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invite.status === 'used' ? 'secondary' :
                              invite.status === 'expired' ? 'destructive' :
                              'default'
                            }
                          >
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.profiles?.full_name || invite.profiles?.username || 'Admin'}
                        </TableCell>
                        <TableCell>
                          {invite.used_by_profile ? 
                            (invite.used_by_profile.full_name || invite.used_by_profile.username || 'Unknown') 
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate" title={invite.notes || ''}>
                            {invite.notes || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(invite.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(invite.code)}
                            disabled={invite.status !== 'pending'}
                          >
                            {copiedCode === invite.code ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              {flaggedPosts.length > 0 ? (
                <div className="space-y-4">
                  {flaggedPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">
                            {post.profiles.full_name || post.profiles.username || 'Unknown User'}
                          </span>
                          <Badge variant="destructive">Flagged</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {post.content && (
                        <p className="text-sm bg-muted/50 p-3 rounded">
                          {post.content}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moderatePost(post.id, 'approve')}
                          className="text-green-600 hover:text-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moderatePost(post.id, 'remove')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No flagged content to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Community Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">User Growth</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Members</span>
                      <span className="font-medium">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Invites</span>
                      <span className="font-medium">
                        {invites.filter(i => i.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Used Invites</span>
                      <span className="font-medium">
                        {invites.filter(i => i.status === 'used').length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Content Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Posts</span>
                      <span className="font-medium">{stats.totalPosts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Flagged Posts</span>
                      <span className="font-medium">{flaggedPosts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Events</span>
                      <span className="font-medium">{stats.activeEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Challenges</span>
                      <span className="font-medium">{stats.activeChallenges}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;