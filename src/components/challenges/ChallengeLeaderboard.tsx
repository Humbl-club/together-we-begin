import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Footprints,
  Users,
  RefreshCw,
  Crown,
  Award,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  user_id: string;
  total_steps: number;
  daily_steps: { [date: string]: number };
  last_updated: string;
  is_validated: boolean;
  flagged_for_review: boolean;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ChallengeLeaderboardProps {
  challengeId: string;
  challengeGoal: number;
  className?: string;
  maxEntries?: number;
  showProgress?: boolean;
  realTimeUpdates?: boolean;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challengeId,
  challengeGoal,
  className,
  maxEntries = 10,
  showProgress = true,
  realTimeUpdates = true
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
    
    if (realTimeUpdates) {
      // Set up real-time subscription
      const channel = supabase
        .channel(`leaderboard-${challengeId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'walking_leaderboards',
            filter: `challenge_id=eq.${challengeId}`
          },
          () => {
            fetchLeaderboard();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [challengeId, realTimeUpdates]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select(`
          user_id,
          total_steps,
          daily_steps,
          last_updated,
          is_validated,
          flagged_for_review,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .eq('is_validated', true)
        .order('total_steps', { ascending: false })
        .limit(maxEntries);

      if (error) throw error;

      const formattedData = data?.map(entry => ({
        user_id: entry.user_id,
        total_steps: entry.total_steps,
        daily_steps: (entry.daily_steps as { [date: string]: number }) || {},
        last_updated: entry.last_updated,
        is_validated: entry.is_validated,
        flagged_for_review: entry.flagged_for_review,
        profile: {
          full_name: (entry.profiles as any)?.full_name || 'Anonymous',
          avatar_url: (entry.profiles as any)?.avatar_url
        }
      })) || [];

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-yellow-50">1st Place</Badge>;
      case 2:
        return <Badge className="bg-gray-400 text-gray-50">2nd Place</Badge>;
      case 3:
        return <Badge className="bg-amber-600 text-amber-50">3rd Place</Badge>;
      default:
        return null;
    }
  };

  const formatSteps = (steps: number) => {
    if (steps >= 1000000) {
      return `${(steps / 1000000).toFixed(1)}M`;
    }
    if (steps >= 1000) {
      return `${(steps / 1000).toFixed(1)}k`;
    }
    return steps.toLocaleString();
  };

  const getProgressPercentage = (steps: number) => {
    return challengeGoal > 0 ? (steps / challengeGoal) * 100 : 0;
  };

  const isCurrentUser = (userId: string) => user?.id === userId;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
            <p className="text-muted-foreground">
              Be the first to join this challenge!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const progressPercentage = getProgressPercentage(entry.total_steps);
              const isUser = isCurrentUser(entry.user_id);
              
              return (
                <div
                  key={entry.user_id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isUser 
                      ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/30' 
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Icon */}
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    {/* User Info */}
                    <Avatar className={`w-10 h-10 ${isUser ? 'ring-2 ring-primary' : ''}`}>
                      <AvatarImage src={entry.profile.avatar_url} />
                      <AvatarFallback>
                        {entry.profile.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">
                          {entry.profile.full_name}
                          {isUser && <span className="text-primary ml-1">(You)</span>}
                        </p>
                        {getRankBadge(rank)}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Footprints className="w-3 h-3" />
                          <span className="font-medium text-foreground">
                            {formatSteps(entry.total_steps)}
                          </span>
                          <span>steps</span>
                        </div>
                        
                        {showProgress && challengeGoal > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{Math.round(progressPercentage)}% of goal</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {showProgress && challengeGoal > 0 && (
                        <div className="mt-2">
                          <Progress 
                            value={Math.min(progressPercentage, 100)} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>

                    {/* Achievement Icons */}
                    <div className="flex items-center gap-1">
                      {progressPercentage >= 100 && (
                        <Award className="w-4 h-4 text-success" />
                      )}
                      {rank <= 3 && (
                        <TrendingUp className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Challenge Summary */}
        {leaderboard.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {leaderboard.length}
                </div>
                <div className="text-xs text-muted-foreground">Participants</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {formatSteps(leaderboard.reduce((sum, entry) => sum + entry.total_steps, 0))}
                </div>
                <div className="text-xs text-muted-foreground">Total Steps</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {formatSteps(Math.round(leaderboard.reduce((sum, entry) => sum + entry.total_steps, 0) / leaderboard.length))}
                </div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};