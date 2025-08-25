import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Footprints, Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface LeaderboardEntry {
  user_id: string;
  total_steps: number;
  daily_steps: { [date: string]: number };
  last_updated: string;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

interface WalkingLeaderboardProps {
  challengeId: string;
  className?: string;
  maxEntries?: number;
}

export const WalkingLeaderboard: React.FC<WalkingLeaderboardProps> = ({
  challengeId,
  className,
  maxEntries = 10
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time updates
    const channel = supabase
      .channel('leaderboard-updates')
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
  }, [challengeId]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select(`
          user_id,
          total_steps,
          daily_steps,
          last_updated,
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
        profile: {
          full_name: (entry.profiles as any)?.full_name || 'Anonymous',
          avatar_url: (entry.profiles as any)?.avatar_url
        }
      })) || [];

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return 'default';
      case 2:
        return 'secondary';
      case 3:
        return 'outline';
      default:
        return 'outline';
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 h-4 bg-muted rounded" />
                <div className="w-16 h-4 bg-muted rounded" />
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
        <CardTitle className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-primary" />
          Leaderboard
          <Badge variant="outline" className="ml-auto">
            {leaderboard.length} participants
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Footprints className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No participants yet</p>
            <p className="text-sm">Be the first to join this challenge!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === user?.id;
              
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={entry.profile.avatar_url} />
                    <AvatarFallback>
                      {entry.profile.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                      {entry.profile.full_name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(entry.last_updated).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatSteps(entry.total_steps)}
                    </div>
                    <div className="text-xs text-muted-foreground">steps</div>
                  </div>

                  {/* Rank Badge */}
                  {rank <= 3 && (
                    <Badge variant={getRankBadgeVariant(rank)}>
                      #{rank}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};