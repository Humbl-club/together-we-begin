import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';
import { Event, Post } from '@/types/api';

interface DashboardStats {
  nextEventInDays: number;
  unreadMessages: number;
  stepsToday: number;
  newPostsToday: number;
}

interface Profile {
  full_name?: string;
  avatar_url?: string;
  available_loyalty_points?: number;
}

interface SimpleEvent {
  id: string;
  title: string;
  start_time: string;
  location: string | null;
}

interface DashboardData {
  profile: Profile | null;
  events?: SimpleEvent[];
  nextEventInDays: number;
  unreadMessages: number;
  stepsToday: number;
  newPostsToday: number;
}

export const useDashboardData = (userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    nextEventInDays: 0,
    unreadMessages: 0,
    stepsToday: 0,
    newPostsToday: 0
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
        const today = new Date();
        const todayISODate = today.toISOString().slice(0, 10);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayISO = startOfToday.toISOString();

        const [profileResult, eventsResult, unreadMessagesResult, stepsResult, postsTodayResult] = await Promise.all([
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
            .from('direct_messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .is('read_at', null),
          supabase
            .from('health_data')
            .select('steps')
            .eq('user_id', userId)
            .eq('date', todayISODate)
            .maybeSingle(),
          supabase
            .from('social_posts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .gte('created_at', startOfTodayISO)
        ]);

        const nextEventStart = (eventsResult.data as any)?.[0]?.start_time as string | undefined;
        let nextEventInDays = 0;
        if (nextEventStart) {
          const now = new Date();
          const nextDate = new Date(nextEventStart);
          const diffMs = nextDate.getTime() - now.getTime();
          nextEventInDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }

        return {
          profile: profileResult.data,
          events: (eventsResult.data || []) as SimpleEvent[],
          nextEventInDays,
          unreadMessages: unreadMessagesResult.count || 0,
          stepsToday: (stepsResult.data as any)?.steps || 0,
          newPostsToday: postsTodayResult.count || 0,
        };
      });

      if (dashboardData.profile) setProfile(dashboardData.profile);

      setStats({
        nextEventInDays: dashboardData.nextEventInDays,
        unreadMessages: dashboardData.unreadMessages,
        stepsToday: dashboardData.stepsToday,
        newPostsToday: dashboardData.newPostsToday
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