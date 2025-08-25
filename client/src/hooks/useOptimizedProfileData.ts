import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedData } from '@/hooks/useOptimizedData';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  instagram_handle: string | null;
  available_loyalty_points: number | null;
  total_loyalty_points: number | null;
  created_at: string;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
  reference_type: string | null;
}

interface CompletedChallenge {
  id: string;
  completion_date: string;
  challenges: {
    title: string;
    badge_name: string | null;
    points_reward: number | null;
  };
}

interface ProfileData {
  profile: UserProfile | null;
  loyaltyTransactions: LoyaltyTransaction[];
  completedChallenges: CompletedChallenge[];
}

export const useOptimizedProfileData = (userId: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const { fetchWithCache, invalidateCache } = useOptimizedData<ProfileData>('profile', 5 * 60 * 1000);

  const fetchProfileData = useCallback(async (): Promise<ProfileData> => {
    if (!userId) throw new Error('No user ID provided');

    const [profileResult, transactionsResult, challengesResult] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      
      supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('challenge_participations')
        .select(`
          id,
          completion_date,
          challenges!challenge_participations_challenge_id_fkey (
            title,
            badge_name,
            points_reward
          )
        `)
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completion_date', { ascending: false })
        .limit(20)
    ]);

    // Handle profile
    let profile = null;
    if (profileResult.status === 'fulfilled') {
      if (profileResult.value.error) {
        console.error('Profile fetch error:', profileResult.value.error);
      } else {
        profile = profileResult.value.data;
      }
    }

    // Handle transactions
    let loyaltyTransactions: LoyaltyTransaction[] = [];
    if (transactionsResult.status === 'fulfilled') {
      if (transactionsResult.value.error) {
        console.error('Transactions fetch error:', transactionsResult.value.error);
      } else {
        loyaltyTransactions = transactionsResult.value.data || [];
      }
    }

    // Handle challenges
    let completedChallenges: CompletedChallenge[] = [];
    if (challengesResult.status === 'fulfilled') {
      if (challengesResult.value.error) {
        console.error('Challenges fetch error:', challengesResult.value.error);
      } else {
        completedChallenges = challengesResult.value.data || [];
      }
    }

    return { profile, loyaltyTransactions, completedChallenges };
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchWithCache(`profile-${userId}`, fetchProfileData);
      setProfile(data.profile);
      setLoyaltyTransactions(data.loyaltyTransactions);
      setCompletedChallenges(data.completedChallenges);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, fetchWithCache, fetchProfileData, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Invalidate cache to force refresh on next load
      invalidateCache(`profile-${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return false;
    }
  };

  const refreshData = useCallback(() => {
    invalidateCache(`profile-${userId}`);
    loadData();
  }, [userId, invalidateCache, loadData]);

  return {
    profile,
    loyaltyTransactions,
    completedChallenges,
    loading,
    updateProfile,
    refreshData
  };
};