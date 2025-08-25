import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Advanced query optimization with intelligent caching and batching
export const useAdvancedQueryOptimization = () => {
  const queryCache = useRef(new Map());
  const pendingQueries = useRef(new Map());
  const queryQueue = useRef<Array<{ query: () => Promise<any>, resolve: (value: any) => void, reject: (error: any) => void }>>([]);

  // Intelligent query batching
  const batchQuery = useCallback(async <T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number;
      dedupe?: boolean;
      batch?: boolean;
    } = {}
  ): Promise<T> => {
    const { ttl = 5 * 60 * 1000, dedupe = true, batch = false } = options;
    
    // Check cache first
    const cached = queryCache.current.get(queryKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Deduplicate identical queries
    if (dedupe && pendingQueries.current.has(queryKey)) {
      return pendingQueries.current.get(queryKey);
    }

    const queryPromise = new Promise<T>((resolve, reject) => {
      if (batch) {
        // Add to batch queue
        queryQueue.current.push({
          query: queryFn,
          resolve,
          reject
        });

        // Process batch after short delay
        setTimeout(() => {
          if (queryQueue.current.length > 0) {
            processBatch();
          }
        }, 10);
      } else {
        // Execute immediately
        queryFn()
          .then(data => {
            queryCache.current.set(queryKey, {
              data,
              timestamp: Date.now()
            });
            resolve(data);
          })
          .catch(reject)
          .finally(() => {
            pendingQueries.current.delete(queryKey);
          });
      }
    });

    if (dedupe) {
      pendingQueries.current.set(queryKey, queryPromise);
    }

    return queryPromise;
  }, []);

  // Process batched queries
  const processBatch = useCallback(async () => {
    const batch = [...queryQueue.current];
    queryQueue.current = [];

    try {
      const results = await Promise.allSettled(
        batch.map(({ query }) => query())
      );

      results.forEach((result, index) => {
        const { resolve, reject } = batch[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }, []);

  // Optimized dashboard data fetching
  const fetchDashboardDataOptimized = useCallback(async (userId: string) => {
    return batchQuery(
      `dashboard-${userId}`,
      async () => {
        // Optimized parallel queries instead of RPC call
        const [profileResult, eventsResult, challengesResult, postsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('events')
            .select('id')
            .eq('status', 'upcoming')
            .gte('start_time', new Date().toISOString()),
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
          postsCount: postsResult.data?.length || 0
        };
      },
      { ttl: 2 * 60 * 1000, batch: true }
    );
  }, [batchQuery]);

  // Optimized events data fetching
  const fetchEventsOptimized = useCallback(async (userId?: string) => {
    return batchQuery(
      `events-${userId || 'public'}`,
      async () => {
        let query = supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            location,
            start_time,
            end_time,
            price_cents,
            loyalty_points_price,
            max_capacity,
            current_capacity,
            status,
            image_url,
            created_at,
            registrations:event_registrations(
              user_id,
              payment_status
            )
          `)
          .in('status', ['upcoming', 'ongoing'])
          .order('start_time', { ascending: true });

        if (userId) {
          query = query.eq('registrations.user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      { ttl: 5 * 60 * 1000, batch: true }
    );
  }, [batchQuery]);

  // Advanced caching utilities
  const cacheUtils = useMemo(() => ({
    clear: (pattern?: string) => {
      if (pattern) {
        for (const key of queryCache.current.keys()) {
          if (key.includes(pattern)) {
            queryCache.current.delete(key);
          }
        }
      } else {
        queryCache.current.clear();
      }
    },
    
    preload: async (queries: Array<{ key: string; fn: () => Promise<any> }>) => {
      await Promise.all(
        queries.map(({ key, fn }) => 
          batchQuery(key, fn, { batch: true })
        )
      );
    },

    invalidate: (key: string) => {
      queryCache.current.delete(key);
      pendingQueries.current.delete(key);
    }
  }), [batchQuery]);

  return {
    fetchDashboardDataOptimized,
    fetchEventsOptimized,
    batchQuery,
    cacheUtils
  };
};