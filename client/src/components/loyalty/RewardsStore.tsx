import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Trophy, Star, Coffee, ShoppingCart, Ticket } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Reward {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  points_cost: number;
  category: string;
  stock_quantity?: number;
  redemption_limit_per_user?: number;
  is_active: boolean;
}

interface RedemptionHistory {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  redemption_code: string;
  redeemed_at: string;
  rewards_catalog: {
    title: string;
    category: string;
  };
}

export const RewardsStore: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [userPoints, setUserPoints] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchRedemptionHistory();
      fetchUserPoints();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: "Error",
        description: "Failed to load rewards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptionHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          id,
          reward_id,
          points_spent,
          status,
          redemption_code,
          redeemed_at,
          rewards_catalog!reward_id (
            title,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      setRedemptionHistory(data || []);
    } catch (error) {
      console.error('Error fetching redemption history:', error);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_available_points', {
        user_id_param: user.id
      });

      if (error) throw error;
      setUserPoints(data || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!user || redeeming) return;

    setRedeeming(rewardId);
    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        reward_id_param: rewardId,
        user_id_param: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; redemption_code?: string; points_spent?: number };

      if (result.success) {
        toast({
          title: "🎉 Reward Redeemed!",
          description: `Your redemption code is: ${result.redemption_code}`,
        });

        // Refresh data
        await Promise.all([
          fetchRewards(),
          fetchRedemptionHistory(),
          fetchUserPoints()
        ]);
      } else {
        toast({
          title: "Redemption Failed",
          description: result.error || "Failed to redeem reward",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        title: "Error",
        description: "Failed to redeem reward",
        variant: "destructive"
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'events': return <Ticket className="w-4 h-4" />;
      case 'food': return <Coffee className="w-4 h-4" />;
      case 'merchandise': return <ShoppingCart className="w-4 h-4" />;
      case 'badges': return <Star className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const filteredRewards = rewards.filter(reward => 
    categoryFilter === 'all' || reward.category === categoryFilter
  );

  const categories = ['all', ...Array.from(new Set(rewards.map(r => r.category)))];

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center">Loading rewards...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Points Display */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-xl font-bold">{userPoints.toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground">Available Points</p>
              </div>
            </div>
            <Button onClick={fetchUserPoints} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="history">My Redemptions</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-4 items-center">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="glass-card hover:scale-105 transition-transform">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(reward.category)}
                      <Badge variant="outline" className="text-xs">
                        {reward.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{reward.points_cost}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{reward.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reward.description && (
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {reward.stock_quantity && (
                      <span>{reward.stock_quantity} in stock</span>
                    )}
                    {reward.redemption_limit_per_user && (
                      <span>Limit: {reward.redemption_limit_per_user} per user</span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleRedeemReward(reward.id)}
                    disabled={
                      redeeming === reward.id ||
                      userPoints < reward.points_cost ||
                      (reward.stock_quantity !== null && reward.stock_quantity <= 0)
                    }
                    className="w-full"
                  >
                    {redeeming === reward.id ? 'Redeeming...' : 
                     userPoints < reward.points_cost ? 'Insufficient Points' :
                     (reward.stock_quantity !== null && reward.stock_quantity <= 0) ? 'Out of Stock' :
                     'Redeem'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRewards.length === 0 && (
            <EmptyState
              icon={<Gift className="w-full h-full" />}
              title="No Rewards Available"
              description={categoryFilter === 'all' ? 
                'Check back later for new rewards!' : 
                'No rewards in this category yet.'
              }
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {redemptionHistory.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Redemptions Yet</h3>
              <p className="text-muted-foreground">
                Start redeeming rewards to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptionHistory.map((redemption) => (
                <Card key={redemption.id} className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon((redemption.rewards_catalog as any)?.category || 'general')}
                        <div>
                          <h4 className="font-semibold">{(redemption.rewards_catalog as any)?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Code: <span className="font-mono">{redemption.redemption_code}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={redemption.status === 'fulfilled' ? 'secondary' : 'outline'}>
                          {redemption.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          -{redemption.points_spent} points
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};