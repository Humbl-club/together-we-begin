import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Domain-driven dashboard data access layer
export class DashboardRepository {
  private static instance: DashboardRepository;

  private constructor() {}

  static getInstance(): DashboardRepository {
    if (!DashboardRepository.instance) {
      DashboardRepository.instance = new DashboardRepository();
    }
    return DashboardRepository.instance;
  }

  // Optimized dashboard data with single database call
  async getDashboardData(userId: string) {
    const { data, error } = await supabase.rpc('get_dashboard_data_v2', {
      user_id_param: userId
    });

    if (error) throw error;
    return data?.[0] || {
      user_profile: {},
      stats: {},
      recent_events: [],
      active_challenges: [],
      recent_posts: []
    };
  }

  // Get user activity insights (simplified version without materialized view)
  async getUserActivitySummary(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        total_loyalty_points,
        event_registrations!inner(count),
        challenge_participations!inner(count),
        social_posts!inner(count)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}