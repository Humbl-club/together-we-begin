import React, { createContext, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  subscribeToTable: (
    tableName: string,
    callback: (payload: any) => void,
    filter?: string
  ) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  const subscribeToTable = (tableName: string, callback: (payload: any) => void, filter?: string) => {
    const channelName = `${tableName}-${filter || 'all'}`;
    
    // Check if channel already exists
    if (channelsRef.current.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter
        },
        callback
      )
      .subscribe();

    channelsRef.current.set(channelName, channel);
  };

  useEffect(() => {
    return () => {
      // Cleanup all channels
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ subscribeToTable }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};