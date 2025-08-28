import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useStepTracking } from '@/hooks/useStepTracking';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRateLimited } from '@/hooks/useRateLimited';
import { useOptimizedData } from '@/hooks/useOptimizedData';

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

interface PaginationState {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number | null;
}

interface LeaderboardPagination {
  [challengeId: string]: PaginationState;
}

export const useWalkingChallenges = () => {
  const [challenges, setChallenges] = useState<WalkingChallenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [leaderboards, setLeaderboards] = useState<{ [challengeId: string]: LeaderboardEntry[] }>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState<{ [challengeId: string]: boolean }>({});
  
  // Pagination state
  const [challengePagination, setChallengePagination] = useState<PaginationState>({
    page: 0,
    pageSize: 20,
    hasMore: true,
    total: null
  });
  const [leaderboardPagination, setLeaderboardPagination] = useState<LeaderboardPagination>({});
  
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { syncSteps, startTracking, isTracking } = useStepTracking();
  const { executeWithRateLimit } = useRateLimited();
  const { fetchWithCache } = useOptimizedData<any>('walking-challenges', 3 * 60 * 1000); // 3 minute cache

  useEffect(() => {
    if (user && currentOrganization) {
      loadChallenges();
      fetchUserProgress();
      
      // Set up real-time subscriptions with organization filtering
      const challengeChannel = supabase
        .channel(`walking-challenges-${currentOrganization.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `organization_id=eq.${currentOrganization.id}`
        }, () => {
          loadChallenges();
        })
        .subscribe();

      const leaderboardChannel = supabase
        .channel(`leaderboard-updates-${currentOrganization.id}`)
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
  }, [user?.id, currentOrganization?.id]);

  // Auto-start pedometer when there are active walking challenges
  useEffect(() => {
    if (!user) return;
    const hasActiveWalking = challenges.length > 0;
    if (hasActiveWalking && !isTracking) {
      startTracking();
    }
  }, [user, challenges, isTracking, startTracking]);

  // Load challenges with pagination
  const loadChallenges = useCallback(async (append = false) => {
    if (!user || !currentOrganization) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    const isLoadingMore = append;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setChallengePagination(prev => ({ ...prev, page: 0, hasMore: true }));
    }

    try {
      const page = append ? challengePagination.page + 1 : 0;
      const cacheKey = `challenges-${currentOrganization.id}-page-${page}`;
      
      const challengeData = await fetchWithCache(cacheKey, async () => {
        const from = page * challengePagination.pageSize;
        const to = from + challengePagination.pageSize - 1;
        
        const { data, error, count } = await supabase
          .from('challenges')
          .select('*', { count: 'exact' })
          .eq('organization_id', currentOrganization.id)
          .not('step_goal', 'is', null)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        return {
          challenges: (data || []).map(item => ({
            ...item,
            challenge_type: item.challenge_type as 'one_time' | 'weekly_recurring' | 'monthly_recurring'
          })),
          count: count || 0
        };
      });

      const hasMore = challengeData.challenges.length === challengePagination.pageSize;
      
      setChallengePagination(prev => ({
        ...prev,
        page,
        hasMore,
        total: challengeData.count
      }));

      if (append) {
        setChallenges(prev => [...prev, ...challengeData.challenges]);
      } else {
        setChallenges(challengeData.challenges);
      }
      
    } catch (error) {
      console.error('Error fetching walking challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load walking challenges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, currentOrganization, challengePagination.page, challengePagination.pageSize, fetchWithCache]);

  // Load more challenges
  const loadMoreChallenges = useCallback(async () => {
    if (!challengePagination.hasMore || loadingMore) return;
    await loadChallenges(true);
  }, [challengePagination.hasMore, loadingMore, loadChallenges]);

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

  const fetchLeaderboard = useCallback(async (challengeId: string, append = false) => {
    if (!currentOrganization) return [];

    const isLoadingMore = append;
    if (isLoadingMore) {
      setLoadingLeaderboards(prev => ({ ...prev, [challengeId]: true }));
    }

    try {
      const currentPagination = leaderboardPagination[challengeId] || {
        page: 0,
        pageSize: 20,
        hasMore: true,
        total: null
      };

      const page = append ? currentPagination.page + 1 : 0;
      const from = page * currentPagination.pageSize;
      const to = from + currentPagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('walking_leaderboards')
        .select(`
          user_id,
          total_steps,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('challenge_id', challengeId)
        .eq('is_validated', true)
        .order('total_steps', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const leaderboard = data?.map(entry => ({
        user_id: entry.user_id,
        total_steps: entry.total_steps,
        profile: {
          full_name: (entry.profiles as any)?.full_name || 'Anonymous',
          avatar_url: (entry.profiles as any)?.avatar_url
        }
      })) || [];

      const hasMore = leaderboard.length === currentPagination.pageSize;

      setLeaderboardPagination(prev => ({
        ...prev,
        [challengeId]: {
          page,
          pageSize: currentPagination.pageSize,
          hasMore,
          total: count || 0
        }
      }));

      if (append) {
        setLeaderboards(prev => ({
          ...prev,
          [challengeId]: [...(prev[challengeId] || []), ...leaderboard]
        }));
      } else {
        setLeaderboards(prev => ({
          ...prev,
          [challengeId]: leaderboard
        }));
      }

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    } finally {
      setLoadingLeaderboards(prev => ({ ...prev, [challengeId]: false }));
    }
  }, [currentOrganization, leaderboardPagination]);

  // Load more leaderboard entries
  const loadMoreLeaderboard = useCallback(async (challengeId: string) => {
    const pagination = leaderboardPagination[challengeId];
    if (!pagination?.hasMore || loadingLeaderboards[challengeId]) return;
    
    await fetchLeaderboard(challengeId, true);
  }, [leaderboardPagination, loadingLeaderboards, fetchLeaderboard]);

  // Refresh challenge data
  const refreshChallenge = useCallback(async (challengeId: string) => {
    await Promise.all([
      fetchUserProgress(),
      fetchLeaderboard(challengeId)
    ]);
  }, [fetchUserProgress, fetchLeaderboard]);

  // Sync steps for a specific challenge
  const syncStepsForChallenge = useCallback(async (challengeId: string) => {
    if (!user) return;

    try {
      const result = await syncSteps(challengeId);
      if (result?.success) {
        await refreshChallenge(challengeId);
      }
      return result;
    } catch (error) {
      console.error('Error syncing steps for challenge:', error);
      return null;
    }
  }, [user, syncSteps, refreshChallenge]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user || !currentOrganization) return;

    return executeWithRateLimit(
      async () => {
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
            organization_id: currentOrganization.id,
            joined_at: new Date().toISOString(),
            completed: false,
            progress_data: { steps: 0, joined_at: new Date().toISOString() }
          });

        if (participationError) throw participationError;

        toast({
          title: "Challenge Joined!",
          description: "You've successfully joined the walking challenge. Start stepping!"
        });

        // Ensure tracking is on and sync immediately
        try { await startTracking(); } catch {}
        const result = await syncStepsForChallenge(challengeId);

        // Refresh data
        await fetchUserProgress();
        await fetchLeaderboard(challengeId);
      },
      { configKey: 'challenges:join', showToast: true }
    );
  }, [user, currentOrganization, userProgress, executeWithRateLimit, fetchUserProgress, fetchLeaderboard, syncStepsForChallenge, startTracking, toast]);

  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!user || !currentOrganization) return;

    return executeWithRateLimit(
      async () => {
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
      },
      { configKey: 'challenges:leave', showToast: true }
    );
  }, [user, currentOrganization, executeWithRateLimit, fetchUserProgress, toast]);

  const createWalkingChallenge = useCallback(async (challengeData: Partial<WalkingChallenge>) => {
    if (!user || !currentOrganization) return;

    return executeWithRateLimit(
      async () => {
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
            participation_reward_points: challengeData.participation_reward_points || 0,
            organization_id: currentOrganization.id,
            created_by: user.id
          });

        if (error) throw error;

        toast({
          title: "Challenge Created!",
          description: "Your walking challenge has been created successfully"
        });

        await loadChallenges();
      },
      { configKey: 'challenges:create', showToast: true }
    );
  }, [user, currentOrganization, executeWithRateLimit, loadChallenges, toast]);

  const getUserProgressForChallenge = (challengeId: string): UserProgress | undefined => {
    return userProgress.find(p => p.challenge_id === challengeId);
  };

  const getLeaderboardForChallenge = (challengeId: string): LeaderboardEntry[] => {
    return leaderboards[challengeId] || [];
  };

  return {
    // Data
    challenges,
    userProgress,
    leaderboards,
    
    // Loading states
    loading,
    loadingMore,
    loadingLeaderboards,
    
    // Pagination info
    hasMoreChallenges: challengePagination.hasMore,
    totalChallenges: challengePagination.total,
    
    // Actions
    joinChallenge,
    leaveChallenge,
    createWalkingChallenge,
    fetchLeaderboard,
    loadMoreChallenges,
    loadMoreLeaderboard,
    
    // Utilities
    getUserProgressForChallenge,
    getLeaderboardForChallenge,
    refreshChallenge,
    syncStepsForChallenge,
    
    // Refresh
    refetch: () => loadChallenges()
  };
};