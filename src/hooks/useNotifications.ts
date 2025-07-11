import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationService from '@/services/notificationService';
import { useAuth } from '@/components/auth/AuthProvider';

export interface Notification {
  id: string;
  type: string;
  title: string;
  content?: string;
  data?: any;
  read_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (!user) return;

    // Initialize notification service
    notificationService.initialize();

    // Fetch existing notifications
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const updatedNotification = payload.new as Notification;
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        if (updatedNotification.read_at) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    const data = await notificationService.getNotifications(user.id);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read_at).length);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id);

    for (const id of unreadIds) {
      await markAsRead(id);
    }
  };

  const requestPermission = async () => {
    if (!user) return false;

    const hasPermission = await notificationService.requestPermission();
    if (hasPermission) {
      await notificationService.subscribeToPush(user.id);
    }
    return hasPermission;
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    requestPermission,
    refetch: fetchNotifications
  };
};