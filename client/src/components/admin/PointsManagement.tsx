import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Clock, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

interface ExpirationPolicy {
  id: string;
  policy_name: string;
  expiration_months: number;
  applies_to_point_type: string;
  is_active: boolean;
}

interface UserBalance {
  user_id: string;
  available_points: number;
  expiring_soon: number;
  profiles: {
    full_name: string;
    username?: string | null;
  };
}

export const PointsManagement: React.FC = () => {
  const [expirationPolicies, setExpirationPolicies] = useState<ExpirationPolicy[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');
  
  // Form states
  const [newPolicy, setNewPolicy] = useState({
    policy_name: '',
    expiration_months: 12,
    applies_to_point_type: 'general'
  });
  
  const [selectedUser, setSelectedUser] = useState('');
  const [pointsAdjustment, setPointsAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && isAdmin) {
      fetchExpirationPolicies();
      fetchUserBalances();
    }
  }, [user, isAdmin]);

  const fetchExpirationPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('points_expiration_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpirationPolicies((data || []).map(policy => ({
        ...policy,
        applies_to_point_type: policy.applies_to_point_type || 'general'
      })));
    } catch (error) {
      console.error('Error fetching expiration policies:', error);
      toast({
        title: "Error",
        description: "Failed to load expiration policies",
        variant: "destructive"
      });
    }
  };

  const fetchUserBalances = async () => {
    try {
      // Get users with their current points
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          available_loyalty_points
        `)
        .order('available_loyalty_points', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate expiring points for each user
      const userBalancesData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          const { data: expiringTransactions } = await supabase
            .from('loyalty_transactions')
            .select('points')
            .eq('user_id', profile.id)
            .eq('type', 'earned')
            .not('expires_at', 'is', null)
            .lte('expires_at', expiryDate.toISOString());

          const expiringSoon = expiringTransactions?.reduce((sum, t) => sum + t.points, 0) || 0;

          return {
            user_id: profile.id,
            available_points: profile.available_loyalty_points || 0,
            expiring_soon: expiringSoon,
            profiles: {
              full_name: profile.full_name || 'Unknown',
              username: profile.username
            }
          };
        })
      );

      setUserBalances(userBalancesData);
    } catch (error) {
      console.error('Error fetching user balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExpirationPolicy = async () => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('points_expiration_policies')
        .insert([{
          ...newPolicy,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expiration policy created successfully"
      });

      setNewPolicy({
        policy_name: '',
        expiration_months: 12,
        applies_to_point_type: 'general'
      });

      await fetchExpirationPolicies();
    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: "Error",
        description: "Failed to create expiration policy",
        variant: "destructive"
      });
    }
  };

  const togglePolicyStatus = async (policyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('points_expiration_policies')
        .update({ is_active: !currentStatus })
        .eq('id', policyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Policy ${!currentStatus ? 'activated' : 'deactivated'}`
      });

      await fetchExpirationPolicies();
    } catch (error) {
      console.error('Error updating policy:', error);
      toast({
        title: "Error",
        description: "Failed to update policy status",
        variant: "destructive"
      });
    }
  };

  const adjustUserPoints = async () => {
    if (!user || !isAdmin || !selectedUser || pointsAdjustment === 0) return;

    try {
      const { data, error } = await supabase.rpc('admin_adjust_user_points', {
        target_user_id: selectedUser,
        points_adjustment: pointsAdjustment,
        reason: adjustmentReason || 'Admin adjustment',
        admin_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully adjusted user points by ${pointsAdjustment > 0 ? '+' : ''}${pointsAdjustment}`
        });

        setSelectedUser('');
        setPointsAdjustment(0);
        setAdjustmentReason('');
        await fetchUserBalances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast({
        title: "Error",
        description: "Failed to adjust user points",
        variant: "destructive"
      });
    }
  };

  const expireOldPoints = async () => {
    try {
      const { data, error } = await supabase.rpc('expire_old_points');

      if (error) throw error;

      toast({
        title: "Success",
        description: `Expired ${data} point transactions`
      });

      await fetchUserBalances();
    } catch (error) {
      console.error('Error expiring points:', error);
      toast({
        title: "Error",
        description: "Failed to expire old points",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">You need admin privileges to access points management.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center">Loading points management...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Points Management System
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policies">Expiration Policies</TabsTrigger>
          <TabsTrigger value="balances">User Balances</TabsTrigger>
          <TabsTrigger value="admin-tools">Admin Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          {/* Create New Policy */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Expiration Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input
                    id="policy-name"
                    value={newPolicy.policy_name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, policy_name: e.target.value })}
                    placeholder="e.g., Standard Expiry"
                  />
                </div>
                <div>
                  <Label htmlFor="expiration-months">Expiration (Months)</Label>
                  <Input
                    id="expiration-months"
                    type="number"
                    min="1"
                    max="120"
                    value={newPolicy.expiration_months}
                    onChange={(e) => setNewPolicy({ ...newPolicy, expiration_months: parseInt(e.target.value) || 12 })}
                  />
                </div>
                <div>
                  <Label htmlFor="point-type">Point Type</Label>
                  <Select value={newPolicy.applies_to_point_type} onValueChange={(value) => setNewPolicy({ ...newPolicy, applies_to_point_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="event">Event Points</SelectItem>
                      <SelectItem value="challenge">Challenge Points</SelectItem>
                      <SelectItem value="social">Social Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createExpirationPolicy} disabled={!newPolicy.policy_name}>
                Create Policy
              </Button>
            </CardContent>
          </Card>

          {/* Existing Policies */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Expiration Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expirationPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{policy.policy_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {policy.expiration_months} months • {policy.applies_to_point_type || 'general'} points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.is_active ? 'secondary' : 'outline'}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePolicyStatus(policy.id, policy.is_active)}
                      >
                        {policy.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Point Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userBalances.map((balance) => (
                  <div key={balance.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{balance.profiles.full_name}</h4>
                      {balance.profiles.username && (
                        <p className="text-sm text-muted-foreground">@{balance.profiles.username}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{balance.available_points} points</div>
                      {balance.expiring_soon > 0 && (
                        <div className="text-sm text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {balance.expiring_soon} expiring soon
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-tools" className="space-y-4">
          {/* Manual Points Adjustment */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Manual Points Adjustment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-select">Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {userBalances.map((balance) => (
                        <SelectItem key={balance.user_id} value={balance.user_id}>
                          {balance.profiles.full_name} ({balance.available_points} points)
                        </SelectItem>
                      ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points-adjustment">Points Adjustment</Label>
                  <Input
                    id="points-adjustment"
                    type="number"
                    value={pointsAdjustment}
                    onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                    placeholder="Positive to add, negative to subtract"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="adjustment-reason">Reason (Optional)</Label>
                <Textarea
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explain why points are being adjusted"
                />
              </div>
              <Button 
                onClick={adjustUserPoints} 
                disabled={!selectedUser || pointsAdjustment === 0}
              >
                Adjust Points
              </Button>
            </CardContent>
          </Card>

          {/* System Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  These actions affect the entire system. Use with caution.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button onClick={expireOldPoints} variant="outline">
                  Expire Old Points
                </Button>
                <p className="text-sm text-muted-foreground">
                  Process all points that have reached their expiration date according to active policies.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
