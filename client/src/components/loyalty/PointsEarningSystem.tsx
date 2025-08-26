import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Star, Calendar, Activity, TrendingUp, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EarningOpportunity {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  action_type: 'event_attendance' | 'challenge_completion' | 'social_engagement';
  is_completed?: boolean;
  progress?: number;
  max_progress?: number;
}

interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string | null;
  created_at: string | null;
  source_category: string | null;
  expires_at?: string | null;
}

interface PointsSummary {
  total_earned: number;
  total_spent: number;
  available_points: number;
  expiring_soon: number;
  this_month_earned: number;
}

export const PointsEarningSystem: React.FC = () => {
  const [opportunities, setOpportunities] = useState<EarningOpportunity[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PointsTransaction[]>([]);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary>({
    total_earned: 0,
    total_spent: 0,
    available_points: 0,
    expiring_soon: 0,
    this_month_earned: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchEarningOpportunities();
      fetchRecentTransactions();
      fetchPointsSummary();
    }
  }, [user]);

  const fetchEarningOpportunities = async () => {
    if (!user) return;

    try {
      // Get active events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, attendance_points, start_time')
        .eq('status', 'upcoming')
        .gte('start_time', new Date().toISOString())
        .limit(3);

      // Get active challenges
      const { data: challengesData } = await supabase
        .from('challenges')
        .select('id, title, participation_reward_points, end_date')
        .eq('status', 'active')
        .limit(3);

      // Get user's registrations to check completion status
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id);

      const { data: participations } = await supabase
        .from('challenge_participations')
        .select('challenge_id, completed')
        .eq('user_id', user.id);

      const registeredEventIds = new Set(registrations?.map(r => r.event_id) || []);
      const challengeParticipations = new Map(participations?.map(p => [p.challenge_id, p.completed]) || []);

      const earningOps: EarningOpportunity[] = [];

      // Add event opportunities
      eventsData?.forEach(event => {
        earningOps.push({
          id: `event_${event.id}`,
          title: `Attend: ${event.title}`,
          description: 'Scan QR code at event to earn points',
          points: event.attendance_points || 0,
          category: 'events',
          action_type: 'event_attendance',
          is_completed: false
        });
      });

      // Add challenge opportunities
      challengesData?.forEach(challenge => {
        const isParticipating = challengeParticipations.has(challenge.id);
        const isCompleted = challengeParticipations.get(challenge.id) || false;
        
        earningOps.push({
          id: `challenge_${challenge.id}`,
          title: `Complete: ${challenge.title}`,
          description: 'Finish challenge to earn points',
          points: challenge.participation_reward_points || 0,
          category: 'challenges',
          action_type: 'challenge_completion',
          is_completed: isCompleted,
          progress: isParticipating ? (isCompleted ? 100 : 50) : 0,
          max_progress: 100
        });
      });

      // Add social engagement opportunities
      earningOps.push(
        {
          id: 'daily_post',
          title: 'Share Your Day',
          description: 'Create a post to earn community points',
          points: 5,
          category: 'social',
          action_type: 'social_engagement'
        },
        {
          id: 'weekly_engagement',
          title: 'Weekly Engagement',
          description: 'Like and comment on 5 posts this week',
          points: 15,
          category: 'social',
          action_type: 'social_engagement'
        }
      );

      setOpportunities(earningOps);
    } catch (error) {
      console.error('Error fetching earning opportunities:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTransactions((data || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'earned' | 'redeemed'
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchPointsSummary = async () => {
    if (!user) return;

    try {
      // Get available points
      const { data: availablePoints } = await supabase.rpc('get_user_available_points', {
        user_id_param: user.id
      });

      // Get user's total and available points from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_loyalty_points, available_loyalty_points')
        .eq('id', user.id)
        .single();

      // Get expiring points (next 30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const { data: expiringTransactions } = await supabase
        .from('loyalty_transactions')
        .select('points')
        .eq('user_id', user.id)
        .eq('type', 'earned')
        .not('expires_at', 'is', null)
        .lte('expires_at', expiryDate.toISOString());

      // Get this month's earnings
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthlyEarnings } = await supabase
        .from('loyalty_transactions')
        .select('points')
        .eq('user_id', user.id)
        .eq('type', 'earned')
        .gte('created_at', monthStart.toISOString());

      const expiringPoints = expiringTransactions?.reduce((sum, t) => sum + t.points, 0) || 0;
      const monthlyPoints = monthlyEarnings?.reduce((sum, t) => sum + t.points, 0) || 0;

      setPointsSummary({
        total_earned: profile?.total_loyalty_points || 0,
        total_spent: (profile?.total_loyalty_points || 0) - (profile?.available_loyalty_points || 0),
        available_points: availablePoints || 0,
        expiring_soon: expiringPoints,
        this_month_earned: monthlyPoints
      });
    } catch (error) {
      console.error('Error fetching points summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'event_attendance': return <Calendar className="w-4 h-4" />;
      case 'challenge_completion': return <Trophy className="w-4 h-4" />;
      case 'social_engagement': return <Activity className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'events': return 'tag-event';
      case 'challenges': return 'tag-challenge';
      case 'social': return 'tag-social';
      default: return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center">Loading points system...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-xl font-bold">{pointsSummary.available_points}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-bold">+{pointsSummary.this_month_earned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold">{pointsSummary.total_earned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-xl font-bold">{pointsSummary.expiring_soon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earning Opportunities */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Earning Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  {getActionIcon(opportunity.action_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{opportunity.title}</h4>
                    <Badge className={getCategoryColor(opportunity.category)}>
                      {opportunity.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                  {opportunity.progress !== undefined && (
                    <div className="mt-2">
                      <Progress value={opportunity.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {opportunity.progress}% complete
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-bold text-primary">+{opportunity.points}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                  {opportunity.is_completed && (
                    <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'earned' ? 
                        <TrendingUp className="w-4 h-4 text-green-600" /> :
                        <Gift className="w-4 h-4 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description || 'No description'}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.created_at ? formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true }) : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                    </p>
                    {transaction.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(transaction.expires_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};