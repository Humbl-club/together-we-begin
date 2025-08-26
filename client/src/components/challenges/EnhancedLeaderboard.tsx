import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Trophy, Medal, Award, AlertTriangle, Eye, Filter, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardEntry {
  user_id: string;
  total_steps: number;
  daily_steps: { [date: string]: number };
  is_validated: boolean | null;
  flagged_for_review: boolean | null;
  last_updated: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
  validation_score?: number;
  rank?: number;
}

interface EnhancedLeaderboardProps {
  challengeId: string;
  challengeTitle?: string;
  stepGoal?: number;
  showValidationStatus?: boolean;
  compact?: boolean;
}

export const EnhancedLeaderboard: React.FC<EnhancedLeaderboardProps> = ({
  challengeId,
  challengeTitle,
  stepGoal,
  showValidationStatus = false,
  compact = false
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week'>('all');
  const [validationFilter, setValidationFilter] = useState<'all' | 'validated' | 'flagged'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { user, isAdmin } = useAuth();

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select(`
          user_id,
          total_steps,
          daily_steps,
          is_validated,
          flagged_for_review,
          last_updated,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('total_steps', { ascending: false });

      if (error) throw error;

      // Calculate validation scores and ranks
      const enrichedEntries = await Promise.all(
        (data || []).map(async (entry, index) => {
          // Get validation score from logs
          const { data: validationData } = await supabase
            .from('step_validation_logs')
            .select('validation_score')
            .eq('user_id', entry.user_id)
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: false })
            .limit(5);

          const avgValidationScore = validationData && validationData.length > 0
            ? validationData.reduce((sum, log) => sum + (log.validation_score || 1), 0) / validationData.length
            : 1;

          return {
            ...entry,
            daily_steps: (entry.daily_steps as any) || {},
            validation_score: avgValidationScore,
            rank: index + 1,
            profiles: entry.profiles as any,
            is_validated: entry.is_validated ?? false,
            flagged_for_review: entry.flagged_for_review ?? false
          };
        })
      );

      setEntries(enrichedEntries);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...entries];

    // Time range filter
    if (timeRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.map(entry => ({
        ...entry,
        total_steps: (entry.daily_steps as any)?.[today] || 0
      })).sort((a, b) => b.total_steps - a.total_steps);
    } else if (timeRange === 'week') {
      // Calculate last 7 days steps
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });

      filtered = filtered.map(entry => ({
        ...entry,
        total_steps: last7Days.reduce((sum, date) => 
          sum + ((entry.daily_steps as any)?.[date] || 0), 0
        )
      })).sort((a, b) => b.total_steps - a.total_steps);
    }

    // Validation filter
    if (validationFilter === 'validated') {
      filtered = filtered.filter(entry => entry.is_validated && !entry.flagged_for_review);
    } else if (validationFilter === 'flagged') {
      filtered = filtered.filter(entry => entry.flagged_for_review);
    }

    // Recalculate ranks after filtering
    filtered = filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    setFilteredEntries(filtered);
  }, [entries, timeRange, validationFilter]);

  // Set up real-time subscription
  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel(`leaderboard-${challengeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'walking_leaderboards',
        filter: `challenge_id=eq.${challengeId}`
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchLeaderboard, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [challengeId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold">{rank}</span>;
    }
  };

  const getValidationBadge = (entry: LeaderboardEntry) => {
    if (entry.flagged_for_review) {
      return <Badge variant="destructive" className="text-xs">Flagged</Badge>;
    }
    if (!entry.is_validated) {
      return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
    if ((entry.validation_score || 1) < 0.8) {
      return <Badge variant="secondary" className="text-xs">Low Score</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Verified</Badge>;
  };

  const toggleFlagUser = async (userId: string, flagged: boolean) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('walking_leaderboards')
        .update({ flagged_for_review: flagged })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) throw error;
      await fetchLeaderboard();
    } catch (error) {
      console.error('Error toggling flag:', error);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {challengeTitle ? `${challengeTitle} Leaderboard` : 'Leaderboard'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={fetchLeaderboard}>
              <RefreshCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {!compact && (
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="today">Today</SelectItem>
              </SelectContent>
            </Select>

            {showValidationStatus && (
              <Select value={validationFilter} onValueChange={(value: any) => setValidationFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="validated">Verified Only</SelectItem>
                  <SelectItem value="flagged">Flagged Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No participants yet
            </div>
          ) : (
            filteredEntries.slice(0, compact ? 5 : 20).map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  entry.user_id === user?.id ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank || 0)}
                </div>

                <Avatar className="w-8 h-8">
                  <AvatarImage src={entry.profiles?.avatar_url} />
                  <AvatarFallback>
                    {entry.profiles?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {entry.profiles?.full_name || 'Anonymous'}
                    {entry.user_id === user?.id && (
                      <span className="text-xs text-primary ml-2">(You)</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.total_steps.toLocaleString()} steps
                    {stepGoal && (
                      <span className="ml-2">
                        ({Math.round((entry.total_steps / stepGoal) * 100)}% of goal)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {showValidationStatus && getValidationBadge(entry)}
                  
                  {entry.flagged_for_review && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}

                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFlagUser(entry.user_id, !entry.flagged_for_review)}
                        className="h-6 px-2"
                      >
                        {entry.flagged_for_review ? 'Unflag' : 'Flag'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};