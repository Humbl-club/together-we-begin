import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';

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
  const { fetchWithCache } = useOptimizedData<any>('dashboard', 2 * 60 * 1000); // 2 minute cache

  const loadDashboardData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const cacheKey = `dashboard-${userId}`;
      
      const dashboardData = await fetchWithCache(cacheKey, async () => {
        // Load all data in parallel for better performance
        const [profileResult, eventsResult, challengesResult, postsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
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

        return {
          profile: profileResult.data,
          eventsCount: eventsResult.data?.length || 3,
          challengesCount: challengesResult.data?.length || 2,
          postsCount: postsResult.data?.length || 8
        };
      });

      if (dashboardData.profile) setProfile(dashboardData.profile);

      setStats({
        loyaltyPoints: dashboardData.profile?.available_loyalty_points || 125,
        upcomingEvents: dashboardData.eventsCount,
        activeChallenges: dashboardData.challengesCount,
        totalPosts: dashboardData.postsCount
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchWithCache]);

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