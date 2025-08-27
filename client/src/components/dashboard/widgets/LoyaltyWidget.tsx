import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Gift, Star, Trophy, Coins, TrendingUp, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface LoyaltyWidgetProps {
  configuration: {
    showBalance?: boolean;
    showRewards?: boolean;
    showProgress?: boolean;
    maxRewards?: number;
    viewMode?: 'overview' | 'rewards' | 'progress';
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface LoyaltyData {
  currentPoints: number;
  lifetimePoints: number;
  currentTier: string;
  nextTier?: string;
  pointsToNextTier?: number;
  recentTransactions: Transaction[];
  availableRewards: Reward[];
  tierBenefits: string[];
}

interface Transaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  created_at: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  redemption_count: number;
  max_redemptions?: number;
}

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-800 border-orange-300',
  silver: 'bg-gray-100 text-gray-800 border-gray-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  platinum: 'bg-purple-100 text-purple-800 border-purple-300',
  diamond: 'bg-blue-100 text-blue-800 border-blue-300'
};

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 2500,
  platinum: 5000,
  diamond: 10000
};

export const LoyaltyWidget: React.FC<LoyaltyWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'rewards' | 'history'>('overview');

  const {
    showBalance = true,
    showRewards = true,
    showProgress = size !== 'small',
    maxRewards = size === 'small' ? 3 : size === 'medium' ? 4 : 6,
    viewMode = size === 'small' ? 'overview' : 'overview'
  } = configuration;

  useEffect(() => {
    loadLoyaltyData();
  }, [currentOrganization?.id]);

  const loadLoyaltyData = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) return;

      // Get user's current points
      const { data: pointsData } = await supabase.rpc('get_user_available_points', {
        user_id: userId
      });

      const currentPoints = pointsData || 0;

      // Get recent transactions
      const { data: transactionsData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get available rewards
      const { data: rewardsData } = await supabase
        .from('rewards_catalog')
        .select(`
          *,
          reward_redemptions(count)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .lte('points_cost', currentPoints + 500) // Show rewards slightly above current points
        .order('points_cost', { ascending: true })
        .limit(maxRewards);

      // Calculate tier information
      const lifetimePoints = transactionsData?.reduce((total, t) => 
        t.transaction_type === 'earned' ? total + t.points_amount : total, 0) || 0;

      const { currentTier, nextTier, pointsToNextTier } = calculateTier(lifetimePoints);

      const formattedRewards = rewardsData?.map(reward => ({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        points_cost: reward.points_cost,
        category: reward.category,
        is_available: currentPoints >= reward.points_cost,
        image_url: reward.image_url,
        redemption_count: reward.reward_redemptions?.[0]?.count || 0,
        max_redemptions: reward.max_redemptions_per_user
      })) || [];

      const formattedTransactions = transactionsData?.map(t => ({
        id: t.id,
        type: t.transaction_type === 'earned' ? 'earned' : 'redeemed',
        points: t.points_amount,
        description: t.description || t.transaction_type,
        created_at: t.created_at
      })) || [];

      setLoyaltyData({
        currentPoints,
        lifetimePoints,
        currentTier,
        nextTier,
        pointsToNextTier,
        recentTransactions: formattedTransactions,
        availableRewards: formattedRewards,
        tierBenefits: getTierBenefits(currentTier)
      });

    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTier = (lifetimePoints: number) => {
    const tiers = Object.entries(TIER_THRESHOLDS);
    
    // Find current tier
    let currentTier = 'bronze';
    for (let i = tiers.length - 1; i >= 0; i--) {
      const [tier, threshold] = tiers[i];
      if (lifetimePoints >= threshold) {
        currentTier = tier;
        break;
      }
    }

    // Find next tier
    let nextTier = undefined;
    let pointsToNextTier = undefined;
    
    for (const [tier, threshold] of tiers) {
      if (lifetimePoints < threshold) {
        nextTier = tier;
        pointsToNextTier = threshold - lifetimePoints;
        break;
      }
    }

    return { currentTier, nextTier, pointsToNextTier };
  };

  const getTierBenefits = (tier: string): string[] => {
    const benefits = {
      bronze: ['Earn 1 point per $1', 'Birthday reward'],
      silver: ['Earn 1.25 points per $1', 'Free shipping', 'Birthday reward'],
      gold: ['Earn 1.5 points per $1', 'Free shipping', 'Exclusive events', 'Birthday reward'],
      platinum: ['Earn 2 points per $1', 'Free shipping', 'Exclusive events', 'Priority support'],
      diamond: ['Earn 2.5 points per $1', 'Free shipping', 'VIP events', 'Dedicated concierge']
    };
    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderOverview = () => {
    if (!loyaltyData) return null;

    return (
      <div className="space-y-4">
        {/* Points Balance */}
        {showBalance && (
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-6 h-6 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">
                {loyaltyData.currentPoints.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600">Available Points</p>
            
            {loyaltyData.nextTier && showProgress && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize">{loyaltyData.currentTier}</span>
                  <span className="capitalize">{loyaltyData.nextTier}</span>
                </div>
                <Progress 
                  value={((loyaltyData.lifetimePoints - TIER_THRESHOLDS[loyaltyData.currentTier as keyof typeof TIER_THRESHOLDS]) / 
                          (TIER_THRESHOLDS[loyaltyData.nextTier as keyof typeof TIER_THRESHOLDS] - TIER_THRESHOLDS[loyaltyData.currentTier as keyof typeof TIER_THRESHOLDS])) * 100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {loyaltyData.pointsToNextTier} points to {loyaltyData.nextTier}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Current Tier */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="font-semibold capitalize">{loyaltyData.currentTier} Member</div>
              <div className="text-sm text-gray-600">
                {loyaltyData.lifetimePoints.toLocaleString()} lifetime points
              </div>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={TIER_COLORS[loyaltyData.currentTier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze}
          >
            <Star className="w-3 h-3 mr-1" />
            {loyaltyData.currentTier}
          </Badge>
        </div>

        {/* Recent Activity */}
        {loyaltyData.recentTransactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Recent Activity</h4>
            {loyaltyData.recentTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${
                    transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'earned' ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <ShoppingBag className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{transaction.description}</div>
                    <div className="text-xs text-gray-500">{formatTimeAgo(transaction.created_at)}</div>
                  </div>
                </div>
                <div className={`font-semibold text-sm ${
                  transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRewards = () => {
    if (!loyaltyData) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Available Rewards</h4>
          <Badge variant="outline">
            {loyaltyData.availableRewards.filter(r => r.is_available).length} available
          </Badge>
        </div>

        <div className={`grid gap-3 ${
          size === 'large' || size === 'full' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          {loyaltyData.availableRewards.map((reward) => (
            <Card key={reward.id} className={`overflow-hidden ${
              !reward.is_available ? 'opacity-60' : ''
            }`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm line-clamp-1">{reward.title}</h5>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {reward.description}
                    </p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {reward.category}
                    </Badge>
                  </div>
                  
                  {reward.image_url && (
                    <img 
                      src={reward.image_url} 
                      alt={reward.title}
                      className="w-12 h-12 object-cover rounded ml-2"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Coins className="w-4 h-4 text-yellow-600" />
                    {reward.points_cost.toLocaleString()}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant={reward.is_available ? "default" : "outline"}
                    disabled={!reward.is_available}
                    className="h-7"
                  >
                    {reward.is_available ? (
                      <>
                        <Gift className="w-3 h-3 mr-1" />
                        Redeem
                      </>
                    ) : (
                      'Not enough points'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="text-center py-8">
        <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">Join our loyalty program</div>
        <Button size="sm" variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      {(size === 'large' || size === 'full') && showRewards && (
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'overview' ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeView === 'rewards' ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView('rewards')}
          >
            Rewards
          </Button>
          <Button
            variant={activeView === 'history' ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView('history')}
          >
            History
          </Button>
        </div>
      )}

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'rewards' && showRewards && renderRewards()}
      {activeView === 'history' && (
        <div className="space-y-2">
          {loyaltyData.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'earned' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{transaction.description}</div>
                  <div className="text-xs text-gray-500">{formatTimeAgo(transaction.created_at)}</div>
                </div>
              </div>
              <div className={`font-bold ${
                transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Rewards Store
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <TrendingUp className="w-4 h-4 mr-2" />
          Earn More
        </Button>
      </div>
    </div>
  );
};