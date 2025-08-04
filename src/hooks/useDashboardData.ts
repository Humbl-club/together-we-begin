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

interface DashboardData {
  profile: Profile | null;
  eventsCount: number;
  challengesCount: number;
  postsCount: number;
  events?: any[];
  feedPosts?: any[];
}

export const useDashboardData = (userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    loyaltyPoints: 0,
    upcomingEvents: 0,
    activeChallenges: 0,
    totalPosts: 0
  });
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true); // Start with loading true
  const { fetchWithCache } = useOptimizedData<any>('dashboard', 2 * 60 * 1000); // 2 minute cache

  const loadDashboardData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const cacheKey = `dashboard-${userId}`;
      
      const dashboardData = await fetchWithCache(cacheKey, async (): Promise<DashboardData> => {
        // Optimized parallel queries with better data selection
        const [profileResult, eventsResult, challengesResult, postsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('events')
            .select('id, title, start_time, location')
            .eq('status', 'upcoming')
            .order('start_time', { ascending: true })
            .limit(5),
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
          eventsCount: eventsResult.data?.length || 0,
          challengesCount: challengesResult.data?.length || 0,
          postsCount: postsResult.data?.length || 0,
          events: eventsResult.data || [],
        };
      });

      if (dashboardData.profile) setProfile(dashboardData.profile);

      setStats({
        loyaltyPoints: dashboardData.profile?.available_loyalty_points || 0,
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