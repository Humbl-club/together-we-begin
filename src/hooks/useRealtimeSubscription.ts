import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeSubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onUpdate?: (payload: any) => void;
}

export const useRealtimeSubscription = (
  userId: string | undefined,
  configs: RealtimeSubscriptionConfig[]
) => {
  const setupSubscriptions = useCallback(() => {
    if (!userId) return () => {};

    const channels = configs.map(config => {
      const channel = supabase
        .channel(`${config.table}-${config.event}-${userId}`)
        .on('postgres_changes' as any, {
          event: config.event,
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${userId}`
        }, (payload: any) => {
          config.onUpdate?.(payload);
        })
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, configs]);

  useEffect(() => {
    const cleanup = setupSubscriptions();
    return cleanup;
  }, [setupSubscriptions]);
};