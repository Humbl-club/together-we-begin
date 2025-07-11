import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  loyaltyPoints: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
}

interface Profile {
  full_name?: string;
  avatar_url?: string;
  available_loyalty_points?: number;
}

export const useDashboardData = (userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    loyaltyPoints: 125,
    upcomingEvents: 3,
    activeChallenges: 2,
    totalPosts: 8
  });
  const [profile, setProfile] = useState<Profile>({
    full_name: 'Alexandra Chen',
    avatar_url: undefined
  });
  const [loading, setLoading] = useState(false);

  const loadDashboardData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) setProfile(profileData);

      // Load dashboard stats
      const [eventsResult, challengesResult, postsResult] = await Promise.all([
        supabase
          .from('events')
          .select('id')
          .eq('status', 'upcoming'),
        supabase
          .from('challenges')
          .select('id')
          .eq('status', 'active'),
        supabase
          .from('social_posts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
      ]);

      setStats({
        loyaltyPoints: profileData?.available_loyalty_points || 125,
        upcomingEvents: eventsResult.data?.length || 3,
        activeChallenges: challengesResult.data?.length || 2,
        totalPosts: postsResult.data?.length || 8
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  return {
    stats,
    profile,
    loading,
    refetch: loadDashboardData
  };
};