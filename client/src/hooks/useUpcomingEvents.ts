import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';
import { useOrganization } from '@/contexts/OrganizationContext';

interface Event {
  id: string;
  title: string;
  start_time: string;
  location?: string;
  description?: string;
  capacity?: number;
  registration_count?: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number | null;
}

export const useUpcomingEvents = (pageSize: number = 10) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize,
    hasMore: true,
    total: null
  });
  
  const { fetchWithCache, invalidateCache } = useOptimizedData<Event[]>('upcoming-events', 10 * 60 * 1000);
  const { currentOrganization } = useOrganization();
  const isInitialMount = useRef(true);

  // Fetch a single page of events
  const fetchEventsPage = useCallback(async (page: number, append: boolean = false) => {
    if (!currentOrganization) {
      setEvents([]);
      setLoading(false);
      setPagination(prev => ({ ...prev, hasMore: false }));
      return [];
    }
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const currentDate = new Date().toISOString();
    
    try {
      // Get total count if we don't have it
      if (pagination.total === null) {
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'upcoming')
          .gte('start_time', currentDate);
        
        setPagination(prev => ({ ...prev, total: count || 0 }));
      }
      
      // Fetch the page of events
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_time, location, description, capacity, registration_count')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'upcoming')
        .gte('start_time', currentDate)
        .order('start_time', { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data || data.length === 0) {
        setPagination(prev => ({ ...prev, hasMore: false }));
        return [];
      }

      // Check if there are more events
      const hasMore = data.length === pageSize && 
                      (pagination.total === null || from + data.length < pagination.total);
      
      setPagination(prev => ({
        ...prev,
        page,
        hasMore
      }));

      if (append) {
        setEvents(prev => [...prev, ...data]);
      } else {
        setEvents(data);
      }

      return data;
    } catch (error) {
      console.error('Error fetching events page:', error);
      setPagination(prev => ({ ...prev, hasMore: false }));
      return [];
    }
  }, [currentOrganization, pageSize, pagination.total]);

  // Initial fetch (first page)
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setPagination({
      page: 0,
      pageSize,
      hasMore: true,
      total: null
    });
    
    // Try to use cache for the first page
    const cacheKey = `upcoming-events-${currentOrganization?.id}-page-0`;
    if (currentOrganization) {
      try {
        const cachedEvents = await fetchWithCache(cacheKey, async () => {
          return await fetchEventsPage(0, false);
        });
        if (cachedEvents && cachedEvents.length > 0) {
          setEvents(cachedEvents);
        }
      } catch (error) {
        await fetchEventsPage(0, false);
      }
    } else {
      await fetchEventsPage(0, false);
    }
    
    setLoading(false);
  }, [fetchEventsPage, fetchWithCache, currentOrganization, pageSize]);

  // Load more events (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    const nextPage = pagination.page + 1;
    await fetchEventsPage(nextPage, true);
    setLoadingMore(false);
  }, [loadingMore, pagination.hasMore, pagination.page, fetchEventsPage]);

  // Real-time subscription for event updates
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel(`events-${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        async (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'INSERT') {
            // For new events, check if they should be added to the list
            const newEvent = payload.new as Event;
            const currentDate = new Date().toISOString();
            
            if (newEvent.start_time >= currentDate && pagination.page === 0) {
              // Add to beginning if we're on the first page and it's upcoming
              setEvents(prev => {
                const updated = [newEvent, ...prev];
                // Keep only pageSize items on the first page
                return updated.slice(0, pageSize);
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing event
            setEvents(prev => prev.map(event =>
              event.id === payload.new.id ? { ...event, ...payload.new } : event
            ));
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted event
            setEvents(prev => prev.filter(event => event.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, pagination.page, pageSize]);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchEvents();
    }
  }, [currentOrganization?.id]); // Only refetch when org changes

  // Refresh events (invalidates cache)
  const refetch = useCallback(async () => {
    if (currentOrganization) {
      invalidateCache(`upcoming-events-${currentOrganization.id}-page-0`);
    }
    await fetchEvents();
  }, [currentOrganization, invalidateCache, fetchEvents]);

  return {
    events,
    loading,
    loadingMore,
    hasMore: pagination.hasMore,
    totalEvents: pagination.total,
    currentPage: pagination.page,
    pageSize: pagination.pageSize,
    loadMore,
    refetch
  };
};