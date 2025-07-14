import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useProfileData = (userId: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchLoyaltyTransactions(),
        fetchCompletedChallenges()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const fetchLoyaltyTransactions = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLoyaltyTransactions(data || []);
    } catch (error) {
      console.error('Error fetching loyalty transactions:', error);
    }
  };

  const fetchCompletedChallenges = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
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
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setCompletedChallenges(data || []);
    } catch (error) {
      console.error('Error fetching completed challenges:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
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

  return {
    profile,
    loyaltyTransactions,
    completedChallenges,
    loading,
    updateProfile,
    refreshData: fetchAllData
  };
};