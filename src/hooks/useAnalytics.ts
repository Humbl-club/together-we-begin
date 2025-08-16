import { useState, useEffect } from 'react';
import AnalyticsService, { AnalyticsEvent } from '@/services/analyticsService';
import { useAuth } from '@/components/auth/AuthProvider';

export const useAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [aggregated, setAggregated] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const analyticsService = AnalyticsService.getInstance();

  useEffect(() => {
    if (user) {
      analyticsService.setUserId(user.id);
      analyticsService.trackEvent('session_start');
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [dailyData, aggregatedData] = await Promise.all([
        analyticsService.getAnalytics(user.id),
        analyticsService.getAggregatedAnalytics(user.id)
      ]);
      
      setAnalytics(dailyData);
      setAggregated(aggregatedData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = (event: AnalyticsEvent, data?: any) => {
    analyticsService.trackEvent(event, data);
  };

  return {
    analytics,
    aggregated,
    loading,
    trackEvent,
    refetch: fetchAnalytics
  };
};