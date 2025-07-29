import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface UserPresence {
  user_id: string;
  online_at: string;
  status: 'online' | 'away' | 'offline';
  activity?: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'offline'>('offline');
  const [currentActivity, setCurrentActivity] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create presence channel
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track user presence
    const userPresence = {
      user_id: user.id,
      online_at: new Date().toISOString(),
      status: 'online' as const,
      activity: currentActivity || 'browsing'
    };

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        updateOnlineUsers(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track(userPresence);
          setUserStatus('online');
        }
      });

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserStatus('away');
        presenceChannel.track({
          ...userPresence,
          status: 'away',
          online_at: new Date().toISOString()
        });
      } else {
        setUserStatus('online');
        presenceChannel.track({
          ...userPresence,
          status: 'online',
          online_at: new Date().toISOString()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      setUserStatus('offline');
    };
  }, [user, currentActivity]);

  const updateOnlineUsers = async (presenceState: any) => {
    const users: UserPresence[] = [];
    
    for (const userId in presenceState) {
      const presences = presenceState[userId];
      if (presences && presences.length > 0) {
        const presence = presences[0];
        
        // Fetch user profile if not already included
        if (!presence.profile) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', userId)
              .single();
            
            presence.profile = profile;
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
        
        users.push({
          user_id: userId,
          online_at: presence.online_at,
          status: presence.status || 'online',
          activity: presence.activity,
          profile: presence.profile
        });
      }
    }
    
    setOnlineUsers(users);
  };

  const updateActivity = async (activity: string) => {
    setCurrentActivity(activity);
    
    if (user) {
      const presenceChannel = supabase.channel('online-users');
      await presenceChannel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
        status: userStatus,
        activity: activity
      });
    }
  };

  const setStatus = async (status: 'online' | 'away' | 'offline') => {
    setUserStatus(status);
    
    if (user) {
      const presenceChannel = supabase.channel('online-users');
      if (status === 'offline') {
        await presenceChannel.untrack();
      } else {
        await presenceChannel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          status: status,
          activity: currentActivity
        });
      }
    }
  };

  const getOnlineCount = () => onlineUsers.length;
  
  const isUserOnline = (userId: string) => {
    return onlineUsers.some(user => user.user_id === userId && user.status === 'online');
  };

  const getUserActivity = (userId: string) => {
    const user = onlineUsers.find(u => u.user_id === userId);
    return user?.activity || null;
  };

  return {
    onlineUsers,
    userStatus,
    currentActivity,
    updateActivity,
    setStatus,
    getOnlineCount,
    isUserOnline,
    getUserActivity
  };
};