import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface PlatformStats {
  total_organizations: number;
  active_organizations: number;
  total_users: number;
  active_users: number;
  total_events: number;
  total_posts: number;
  total_messages: number;
  total_revenue_cents: number;
  health_distribution: Record<string, number>;
  subscription_distribution: Record<string, number>;
  date_range_days: number;
  generated_at: string;
}

export const usePlatformStats = (dateRange: number = 30) => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_platform_statistics_real',
        { 
          admin_user_id: user.id,
          date_range_days: dateRange
        }
      );

      if (rpcError) throw rpcError;
      
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching platform stats:', err);
      setError(err.message || 'Failed to load platform statistics');
      toast({
        title: 'Error',
        description: 'Failed to load platform statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, dateRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user?.id, dateRange]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    metrics: {
      organizationGrowth: stats ? 
        ((stats.active_organizations / stats.total_organizations) * 100).toFixed(1) : '0',
      userEngagement: stats ? 
        ((stats.active_users / stats.total_users) * 100).toFixed(1) : '0',
      monthlyRevenue: stats ? 
        (stats.total_revenue_cents / 100).toFixed(2) : '0',
      contentActivity: stats ? 
        (stats.total_posts + stats.total_events + stats.total_messages) : 0
    }
  };
};