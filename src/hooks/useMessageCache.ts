import { useState, useCallback, useMemo } from 'react';
import { DirectMessage, MessageThread } from '@/services/messaging/MessagingService';

interface MessageCache {
  [threadId: string]: DirectMessage[];
}

interface ThreadCache {
  threads: MessageThread[];
  lastFetch: number;
}

export const useMessageCache = () => {
  const [messageCache, setMessageCache] = useState<MessageCache>({});
  const [threadCache, setThreadCache] = useState<ThreadCache>({ threads: [], lastFetch: 0 });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Cache messages for a thread
  const cacheMessages = useCallback((threadId: string, messages: DirectMessage[]) => {
    setMessageCache(prev => ({
      ...prev,
      [threadId]: messages
    }));
  }, []);
  
  // Get cached messages for a thread
  const getCachedMessages = useCallback((threadId: string): DirectMessage[] | null => {
    return messageCache[threadId] || null;
  }, [messageCache]);
  
  // Add a new message to cache
  const addMessageToCache = useCallback((threadId: string, message: DirectMessage) => {
    setMessageCache(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), message]
    }));
  }, []);
  
  // Cache threads
  const cacheThreads = useCallback((threads: MessageThread[]) => {
    setThreadCache({
      threads,
      lastFetch: Date.now()
    });
  }, []);
  
  // Get cached threads if still valid
  const getCachedThreads = useCallback((): MessageThread[] | null => {
    const now = Date.now();
    if (now - threadCache.lastFetch < CACHE_DURATION) {
      return threadCache.threads;
    }
    return null;
  }, [threadCache, CACHE_DURATION]);
  
  // Update unread count for a thread
  const updateUnreadCount = useCallback((threadId: string, count: number) => {
    setUnreadCounts(prev => ({
      ...prev,
      [threadId]: count
    }));
  }, []);
  
  // Get unread count for a thread
  const getUnreadCount = useCallback((threadId: string): number => {
    return unreadCounts[threadId] || 0;
  }, [unreadCounts]);
  
  // Mark messages as read in cache
  const markThreadAsRead = useCallback((threadId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [threadId]: 0
    }));
    
    // Update messages in cache to mark as read
    setMessageCache(prev => {
      const messages = prev[threadId];
      if (!messages) return prev;
      
      const updatedMessages = messages.map(msg => ({
        ...msg,
        read_at: msg.read_at || new Date().toISOString()
      }));
      
      return {
        ...prev,
        [threadId]: updatedMessages
      };
    });
  }, []);
  
  // Clear cache (useful for logout)
  const clearCache = useCallback(() => {
    setMessageCache({});
    setThreadCache({ threads: [], lastFetch: 0 });
    setUnreadCounts({});
  }, []);
  
  // Get total unread count across all threads
  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);
  
  return {
    // Message cache
    cacheMessages,
    getCachedMessages,
    addMessageToCache,
    
    // Thread cache
    cacheThreads,
    getCachedThreads,
    
    // Unread counts
    updateUnreadCount,
    getUnreadCount,
    markThreadAsRead,
    totalUnreadCount,
    
    // Utilities
    clearCache
  };
};