import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useHealthTracking } from '@/hooks/useHealthTracking';
import { useOrganization } from '@/contexts/OrganizationContext';

interface EnhancedChallenge {
  id: string;
  title: string;
  description: string;
  step_goal: number;
  challenge_type: 'one_time' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  winner_reward_points: number;
  runner_up_reward_points: number;
  participation_reward_points: number;
  badge_name?: string;
  badge_image_url?: string;
  created_by?: string;
  created_at?: string;
}

interface UserProgress {
  challenge_id: string;
  user_id: string;
  total_steps: number;
  daily_steps: { [date: string]: number };
  is_participating: boolean;
  last_updated: string;
  is_validated: boolean;
}

interface ChallengeParticipant {
  user_id: string;
  total_steps: number;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ChallengeStats {
  participantCount: number;
  totalSteps: number;
  averageSteps: number;
  completionRate: number;
}

export const useEnhancedChallenges = () => {
  const [challenges, setChallenges] = useState<EnhancedChallenge[]>([]);
  const [userProgress, setUserProgress] = useState<{ [challengeId: string]: UserProgress }>({});
  const [leaderboards, setLeaderboards] = useState<{ [challengeId: string]: ChallengeParticipant[] }>({});
  const [challengeStats, setChallengeStats] = useState<{ [challengeId: string]: ChallengeStats }>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { healthData, syncChallengeProgress } = useHealthTracking();

  useEffect(() => {
    if (user && currentOrganization) {
      fetchChallenges();
      fetchUserProgress();
      setupRealtimeSubscriptions();
    } else if (!currentOrganization) {
      setChallenges([]);
      setUserProgress({});
      setLeaderboards({});
      setChallengeStats({});
      setLoading(false);
    }
  }, [user, currentOrganization?.id]);

  const setupRealtimeSubscriptions = () => {
    if (!currentOrganization) return () => {};
    
    // Subscribe to challenge updates for current organization
    const challengeChannel = supabase
      .channel(`enhanced-challenges-${currentOrganization.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `organization_id=eq.${currentOrganization.id}`
      }, () => {
        fetchChallenges();
      })
      .subscribe();

    // Subscribe to leaderboard updates for current organization
    const leaderboardChannel = supabase
      .channel(`enhanced-leaderboards-${currentOrganization.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'walking_leaderboards',
        filter: `organization_id=eq.${currentOrganization.id}`
      }, () => {
        fetchUserProgress();
        fetchLeaderboards();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(challengeChannel);
      supabase.removeChannel(leaderboardChannel);
    };
  };

  const fetchChallenges = async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .not('step_goal', 'is', null)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const enhancedChallenges = (data || []).map(item => ({
        ...item,
        challenge_type: item.challenge_type as 'one_time' | 'weekly' | 'monthly'
      }));
      
      setChallenges(enhancedChallenges);
      
      // Fetch additional data for each challenge
      enhancedChallenges.forEach(challenge => {
        fetchChallengeLeaderboard(challenge.id);
        fetchChallengeStats(challenge.id);
      });
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user || !currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      const progressMap: { [challengeId: string]: UserProgress } = {};
      data?.forEach(entry => {
        progressMap[entry.challenge_id] = {
          challenge_id: entry.challenge_id,
          user_id: entry.user_id,
          total_steps: entry.total_steps,
          daily_steps: entry.daily_steps as { [date: string]: number } || {},
          is_participating: true,
          last_updated: entry.last_updated,
          is_validated: entry.is_validated
        };
      });

      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchChallengeLeaderboard = async (challengeId: string) => {
    if (!currentOrganization) return;
    
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
        .eq('organization_id', currentOrganization.id)
        .eq('is_validated', true)
        .order('total_steps', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedLeaderboard = data?.map(entry => ({
        user_id: entry.user_id,
        total_steps: entry.total_steps,
        profile: {
          full_name: (entry.profiles as any)?.full_name || 'Anonymous',
          avatar_url: (entry.profiles as any)?.avatar_url
        }
      })) || [];

      setLeaderboards(prev => ({
        ...prev,
        [challengeId]: formattedLeaderboard
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchChallengeStats = async (challengeId: string) => {
    if (!currentOrganization) return;
    
    try {
      const { data, error } = await supabase
        .from('walking_leaderboards')
        .select('total_steps')
        .eq('challenge_id', challengeId)
        .eq('organization_id', currentOrganization.id)
        .eq('is_validated', true);

      if (error) throw error;

      const participantCount = data?.length || 0;
      const totalSteps = data?.reduce((sum, entry) => sum + entry.total_steps, 0) || 0;
      const averageSteps = participantCount > 0 ? totalSteps / participantCount : 0;

      // Get challenge goal to calculate completion rate
      const challenge = challenges.find(c => c.id === challengeId);
      const completionRate = challenge ? 
        data?.filter(entry => entry.total_steps >= challenge.step_goal).length / participantCount * 100 : 0;

      setChallengeStats(prev => ({
        ...prev,
        [challengeId]: {
          participantCount,
          totalSteps,
          averageSteps,
          completionRate
        }
      }));
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user || !currentOrganization) return false;

    try {
      // First join the challenge_participations table
      const { error: participationError } = await supabase
        .from('challenge_participations')
        .upsert([{
          challenge_id: challengeId,
          user_id: user.id,
          organization_id: currentOrganization.id,
          progress_data: { steps: 0 },
          joined_at: new Date().toISOString()
        }]);

      if (participationError) throw participationError;

      // Then create/update leaderboard entry
      const { error: leaderboardError } = await supabase
        .from('walking_leaderboards')
        .upsert([{
          challenge_id: challengeId,
          user_id: user.id,
          organization_id: currentOrganization.id,
          total_steps: 0,
          daily_steps: {},
          last_updated: new Date().toISOString(),
          is_validated: true
        }]);

      if (leaderboardError) throw leaderboardError;

      // Sync current steps if available
      if (healthData.steps > 0) {
        await syncChallengeProgress(challengeId);
      }

      toast({
        title: "Success",
        description: "You've joined the challenge!"
      });

      // Refresh data
      await fetchUserProgress();
      await fetchChallengeLeaderboard(challengeId);
      await fetchChallengeStats(challengeId);

      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive"
      });
      return false;
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    if (!user || !currentOrganization) return false;

    try {
      // Remove from participations
      const { error: participationError } = await supabase
        .from('challenge_participations')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id);

      if (participationError) throw participationError;

      // Remove from leaderboard
      const { error: leaderboardError } = await supabase
        .from('walking_leaderboards')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id);

      if (leaderboardError) throw leaderboardError;

      toast({
        title: "Success",
        description: "You've left the challenge"
      });

      // Refresh data
      await fetchUserProgress();
      await fetchChallengeLeaderboard(challengeId);
      await fetchChallengeStats(challengeId);

      return true;
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast({
        title: "Error",
        description: "Failed to leave challenge",
        variant: "destructive"
      });
      return false;
    }
  };

  const syncAllChallengeProgress = async () => {
    if (!user || Object.keys(userProgress).length === 0) return;

    const activeChallengeIds = Object.keys(userProgress);
    
    for (const challengeId of activeChallengeIds) {
      await syncChallengeProgress(challengeId);
    }

    // Refresh data after sync
    await fetchUserProgress();
    Object.keys(userProgress).forEach(challengeId => {
      fetchChallengeLeaderboard(challengeId);
    });
  };

  const fetchLeaderboards = () => {
    challenges.forEach(challenge => {
      fetchChallengeLeaderboard(challenge.id);
    });
  };

  const refreshChallengeData = async (challengeId?: string) => {
    if (challengeId) {
      await fetchChallengeLeaderboard(challengeId);
      await fetchChallengeStats(challengeId);
    } else {
      await fetchChallenges();
      await fetchUserProgress();
    }
  };

  return {
    challenges,
    userProgress,
    leaderboards,
    challengeStats,
    loading,
    joinChallenge,
    leaveChallenge,
    syncAllChallengeProgress,
    refreshChallengeData,
    fetchChallengeLeaderboard,
    fetchChallengeStats
  };
};