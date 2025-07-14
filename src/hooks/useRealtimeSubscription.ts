import { useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeSubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onUpdate?: (payload: any) => void;
}

// Optimized realtime subscription with connection pooling and debouncing
export const useRealtimeSubscription = (
  userId: string | undefined,
  configs: RealtimeSubscriptionConfig[]
) => {
  const channelRef = useRef<any>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoize config hash to prevent unnecessary re-subscriptions
  const configHash = useMemo(() => {
    return JSON.stringify(
      configs.map(c => ({ table: c.table, event: c.event, filter: c.filter }))
    );
  }, [configs]);

  const setupSubscriptions = useCallback(() => {
    if (!userId || configs.length === 0) return () => {};

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create single optimized channel for all subscriptions
    const channelName = `user-realtime-${userId}`;
    const channel = supabase.channel(channelName);

    // Add all postgres_changes listeners to single channel
    configs.forEach(config => {
      channel.on('postgres_changes' as any, {
        event: config.event,
        schema: 'public',
        table: config.table,
        filter: config.filter || `user_id=eq.${userId}`
      }, (payload: any) => {
        // Debounce rapid updates to prevent excessive re-renders
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          config.onUpdate?.(payload);
        }, 100); // 100ms debounce
      });
    });

    // Subscribe once for all listeners
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Optimized realtime connected for user:', userId);
      }
    });

    channelRef.current = channel;

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, configHash, configs]);

  useEffect(() => {
    const cleanup = setupSubscriptions();
    return cleanup;
  }, [setupSubscriptions]);
};