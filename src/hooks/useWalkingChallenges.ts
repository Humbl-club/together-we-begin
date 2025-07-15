import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface WalkingChallenge {
  id: string;
  title: string;
  description: string;
  step_goal: number;
  challenge_type: 'one_time' | 'weekly_recurring' | 'monthly_recurring';
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  auto_award_enabled: boolean;
  winner_reward_points: number;
  runner_up_reward_points: number;
  participation_reward_points: number;
  created_by?: string;
  created_at?: string;
}

interface UserProgress {
  challenge_id: string;
  total_steps: number;
  daily_steps: { [date: string]: number };
  is_participating: boolean;
  last_updated: string;
}

interface LeaderboardEntry {
  user_id: string;
  total_steps: number;
  profile: { full_name: string; avatar_url?: string };
}

export const useWalkingChallenges = () => {
  const [challenges, setChallenges] = useState<WalkingChallenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [leaderboards, setLeaderboards] = useState<{ [challengeId: string]: LeaderboardEntry[] }>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWalkingChallenges();
      fetchUserProgress();
      
      // Set up real-time subscriptions
      const challengeChannel = supabase
        .channel('walking-challenges-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: 'step_goal=not.is.null'
        }, () => {
          fetchWalkingChallenges();
        })
        .subscribe();

      const leaderboardChannel = supabase
        .channel('leaderboard-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'walking_leaderboards'
        }, () => {
          fetchUserProgress();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(challengeChannel);
        supabase.removeChannel(leaderboardChannel);
      };
    }
  }, [user]);

  const fetchWalkingChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .not('step_goal', 'is', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges((data || []).map(item => ({
        ...item,
        challenge_type: item.challenge_type as 'one_time' | 'weekly_recurring' | 'monthly_recurring'
      })));
    } catch (error) {
      console.error('Error fetching walking challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load walking challenges",
        variant: "destructive"
      });
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select(`
          challenge_id,
          total_steps,
          daily_steps,
          last_updated,
          challenges!challenge_id (
            id,
            title
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const progress = data?.map(entry => ({
        challenge_id: entry.challenge_id,
        total_steps: entry.total_steps,
        daily_steps: (entry.daily_steps as { [date: string]: number }) || {},
        is_participating: true,
        last_updated: entry.last_updated
      })) || [];

      setUserProgress(progress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select(`
          user_id,
          total_steps,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .eq('is_validated', true)
        .order('total_steps', { ascending: false })
        .limit(10);

      if (error) throw error;

      const leaderboard = data?.map(entry => ({
        user_id: entry.user_id,
        total_steps: entry.total_steps,
        profile: {
          full_name: (entry.profiles as any)?.full_name || 'Anonymous',
          avatar_url: (entry.profiles as any)?.avatar_url
        }
      })) || [];

      setLeaderboards(prev => ({
        ...prev,
        [challengeId]: leaderboard
      }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      // Check if already participating
      const existing = userProgress.find(p => p.challenge_id === challengeId);
      if (existing) {
        toast({
          title: "Already Participating",
          description: "You're already part of this challenge!"
        });
        return;
      }

      // Join challenge by creating leaderboard entry
      const { error: leaderboardError } = await supabase
        .from('walking_leaderboards')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          total_steps: 0,
          daily_steps: {},
          is_validated: true
        });

      if (leaderboardError) throw leaderboardError;

      // Create challenge participation record
      const { error: participationError } = await supabase
        .from('challenge_participations')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          completed: false,
          progress_data: { steps: 0, joined_at: new Date().toISOString() }
        });

      if (participationError) throw participationError;

      toast({
        title: "Challenge Joined!",
        description: "You've successfully joined the walking challenge. Start stepping!"
      });

      // Refresh data
      await fetchUserProgress();
      await fetchLeaderboard(challengeId);

    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive"
      });
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      // Remove from leaderboard
      const { error: leaderboardError } = await supabase
        .from('walking_leaderboards')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (leaderboardError) throw leaderboardError;

      // Remove participation record
      const { error: participationError } = await supabase
        .from('challenge_participations')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (participationError) throw participationError;

      toast({
        title: "Left Challenge",
        description: "You've left the walking challenge"
      });

      // Refresh data
      await fetchUserProgress();

    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast({
        title: "Error",
        description: "Failed to leave challenge",
        variant: "destructive"
      });
    }
  };

  const createWalkingChallenge = async (challengeData: Partial<WalkingChallenge>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('challenges')
        .insert({
          title: challengeData.title || '',
          description: challengeData.description,
          step_goal: challengeData.step_goal,
          challenge_type: challengeData.challenge_type || 'one_time',
          start_date: challengeData.start_date,
          end_date: challengeData.end_date,
          status: challengeData.status || 'active',
          auto_award_enabled: challengeData.auto_award_enabled || false,
          winner_reward_points: challengeData.winner_reward_points || 0,
          runner_up_reward_points: challengeData.runner_up_reward_points || 0,
          participation_reward_points: challengeData.participation_reward_points || 0
        });

      if (error) throw error;

      toast({
        title: "Challenge Created!",
        description: "Your walking challenge has been created successfully"
      });

      await fetchWalkingChallenges();

    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive"
      });
    }
  };

  const getUserProgressForChallenge = (challengeId: string): UserProgress | undefined => {
    return userProgress.find(p => p.challenge_id === challengeId);
  };

  const getLeaderboardForChallenge = (challengeId: string): LeaderboardEntry[] => {
    return leaderboards[challengeId] || [];
  };

  const refreshChallenge = useCallback(async (challengeId: string) => {
    await Promise.all([
      fetchUserProgress(),
      fetchLeaderboard(challengeId)
    ]);
  }, [user]);

  return {
    challenges,
    userProgress,
    leaderboards,
    loading,
    joinChallenge,
    leaveChallenge,
    createWalkingChallenge,
    fetchLeaderboard,
    getUserProgressForChallenge,
    getLeaderboardForChallenge,
    refreshChallenge,
    refetch: fetchWalkingChallenges
  };
};