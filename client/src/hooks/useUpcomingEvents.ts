import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';

interface Event {
  id: string;
  title: string;
  start_time: string;
  location?: string;
}

export const useUpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchWithCache } = useOptimizedData<Event[]>('upcoming-events', 10 * 60 * 1000);

  const fetchEvents = useCallback(async () => {
    const cacheKey = 'upcoming-events';
    try {
      const upcomingEvents = await fetchWithCache(cacheKey, async () => {
        const { data } = await supabase
          .from('events')
          .select('id, title, start_time, location')
          .eq('status', 'upcoming')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5);

        return data || [];
      });

      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchWithCache]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    refetch: fetchEvents
  };
};