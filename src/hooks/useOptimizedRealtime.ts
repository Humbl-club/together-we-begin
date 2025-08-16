// Ultra-optimized realtime hook with minimal subscriptions
import { useEffect, useRef } from 'react';
import { RealtimeOptimizationService } from '@/services/core/RealtimeOptimizationService';

interface OptimizedRealtimeConfig {
  table: string;
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  filter?: string;
  onUpdate: (payload: any) => void;
  debounceMs?: number;
}

export const useOptimizedRealtime = (
  userId: string | undefined,
  configs: OptimizedRealtimeConfig[]
) => {
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!userId || !configs.length) {
      return () => {};
    }

    const realtimeService = RealtimeOptimizationService.getInstance();
    const newUnsubscribers: Array<() => void> = [];

    configs.forEach(config => {
      config.events.forEach(event => {
        const unsubscribe = realtimeService.subscribe(
          userId,
          config.table,
          event,
          (payload) => {
            const key = `${config.table}-${event}`;
            const debounceMs = config.debounceMs || 500;

            // Clear existing timeout
            const existingTimeout = timeoutsRef.current.get(key);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            // Set new debounced timeout
            const newTimeout = setTimeout(() => {
              config.onUpdate(payload);
              timeoutsRef.current.delete(key);
            }, debounceMs);

            timeoutsRef.current.set(key, newTimeout);
          },
          config.filter
        );

        newUnsubscribers.push(unsubscribe);
      });
    });

    unsubscribersRef.current = newUnsubscribers;

    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();

      // Unsubscribe from all subscriptions
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
    };
  }, [userId, configs]);

  // Return subscription stats for monitoring
  const getStats = () => {
    return RealtimeOptimizationService.getInstance().getStats();
  };

  return { getStats };
};