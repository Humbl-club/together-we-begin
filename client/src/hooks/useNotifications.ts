import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationService from '@/services/notificationService';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import { useRateLimited } from '@/hooks/useRateLimited';

export interface Notification {
  id: string;
  type: string;
  title: string;
  content?: string;
  data?: any;
  read_at?: string;
  created_at: string;
  user_id?: string;
  organization_id?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number | null;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 20,
    hasMore: true,
    total: null
  });

  const notificationService = NotificationService.getInstance();
  const { executeWithRateLimit } = useRateLimited();
  const { fetchWithCache } = useOptimizedData<Notification[]>('notifications', 2 * 60 * 1000); // 2 minute cache

  useEffect(() => {
    if (!user || !currentOrganization) return;

    // Initialize notification service
    notificationService.initialize();

    // Align push subscription with saved preference
    notificationService.ensurePushSubscription(user.id);

    // Fetch existing notifications
    loadNotifications();

    // Subscribe to real-time notifications with organization filtering
    const channel = supabase
      .channel(`notifications-${currentOrganization.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        
        // Only add if it belongs to current organization or is system-wide
        if (!newNotification.organization_id || newNotification.organization_id === currentOrganization.id) {
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
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
  }, [user?.id, currentOrganization?.id]);

  // Load notifications with pagination
  const loadNotifications = useCallback(async (append = false) => {
    if (!user || !currentOrganization) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const isLoadingMore = append;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPagination(prev => ({ ...prev, page: 0, hasMore: true }));
    }

    try {
      const page = append ? pagination.page + 1 : 0;
      const cacheKey = `notifications-${user.id}-${currentOrganization.id}-page-${page}`;
      
      const notificationData = await fetchWithCache(cacheKey, async () => {
        const from = page * pagination.pageSize;
        const to = from + pagination.pageSize - 1;
        
        const { data, error, count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        return {
          notifications: data || [],
          count: count || 0
        };
      });

      const hasMore = notificationData.notifications.length === pagination.pageSize;
      
      setPagination(prev => ({
        ...prev,
        page,
        hasMore,
        total: notificationData.count
      }));

      if (append) {
        setNotifications(prev => [...prev, ...notificationData.notifications]);
      } else {
        setNotifications(notificationData.notifications);
        // Count unread for first page only to avoid double-counting
        setUnreadCount(notificationData.notifications.filter(n => !n.read_at).length);
      }
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, currentOrganization, pagination.page, pagination.pageSize, fetchWithCache]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (!pagination.hasMore || loadingMore) return;
    await loadNotifications(true);
  }, [pagination.hasMore, loadingMore, loadNotifications]);

  // Fallback for backward compatibility
  const fetchNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    return executeWithRateLimit(
      async () => {
        await notificationService.markAsRead(notificationId);
      },
      { configKey: 'notifications:read', showToast: false }
    );
  }, [notificationService, executeWithRateLimit]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    return executeWithRateLimit(
      async () => {
        const unreadIds = notifications
          .filter(n => !n.read_at)
          .map(n => n.id);

        // Batch mark as read for better performance
        await Promise.all(unreadIds.map(id => notificationService.markAsRead(id)));
      },
      { configKey: 'notifications:batch_read', showToast: false }
    );
  }, [user, notifications, notificationService, executeWithRateLimit]);

  const requestPermission = async () => {
    if (!user) return false;

    const hasPermission = await notificationService.requestPermission();
    if (hasPermission) {
      await notificationService.subscribeToPush(user.id);
    }
    return hasPermission;
  };

  return {
    // Data
    notifications,
    unreadCount,
    
    // Loading states
    loading,
    loadingMore,
    
    // Pagination info
    hasMoreNotifications: pagination.hasMore,
    totalNotifications: pagination.total,
    
    // Actions
    markAsRead,
    markAllAsRead,
    requestPermission,
    loadMoreNotifications,
    
    // Refresh
    refetch: fetchNotifications
  };
};