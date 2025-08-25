import { useState, useCallback, useMemo, useRef } from 'react';
import { DirectMessage, MessageThread } from '@/services/messaging/MessagingService';

interface MessageCache {
  [threadId: string]: {
    messages: DirectMessage[];
    timestamp: number;
    version: number;
  };
}

interface ThreadCache {
  threads: MessageThread[];
  lastFetch: number;
  version: number;
}

interface UnreadCache {
  [threadId: string]: {
    count: number;
    timestamp: number;
  };
}

export const useOptimizedMessageCache = () => {
  const [messageCache, setMessageCache] = useState<MessageCache>({});
  const [threadCache, setThreadCache] = useState<ThreadCache>({ threads: [], lastFetch: 0, version: 0 });
  const [unreadCache, setUnreadCache] = useState<UnreadCache>({});
  
  // Performance optimizations
  const cacheVersion = useRef(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MAX_CACHED_THREADS = 50; // Limit memory usage
  const MAX_CACHED_MESSAGES_PER_THREAD = 100;
  
  // Cache messages for a thread with version control
  const cacheMessages = useCallback((threadId: string, messages: DirectMessage[]) => {
    setMessageCache(prev => {
      const newCache = { ...prev };
      
      // Limit messages to prevent memory bloat
      const limitedMessages = messages.slice(-MAX_CACHED_MESSAGES_PER_THREAD);
      
      newCache[threadId] = {
        messages: limitedMessages,
        timestamp: Date.now(),
        version: ++cacheVersion.current
      };
      
      // Clean up old cache entries
      const now = Date.now();
      Object.keys(newCache).forEach(key => {
        if (now - newCache[key].timestamp > CACHE_DURATION * 2) {
          delete newCache[key];
        }
      });
      
      return newCache;
    });
  }, []);
  
  // Get cached messages with freshness check
  const getCachedMessages = useCallback((threadId: string): DirectMessage[] | null => {
    const cached = messageCache[threadId];
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) {
      // Cache expired, remove it
      setMessageCache(prev => {
        const newCache = { ...prev };
        delete newCache[threadId];
        return newCache;
      });
      return null;
    }
    
    return cached.messages;
  }, [messageCache, CACHE_DURATION]);
  
  // Add a new message to cache (optimistic updates)
  const addMessageToCache = useCallback((threadId: string, message: DirectMessage) => {
    setMessageCache(prev => {
      const cached = prev[threadId];
      if (!cached) return prev;
      
      // Check if message already exists to avoid duplicates
      const messageExists = cached.messages.some(m => m.id === message.id);
      if (messageExists) {
        // Update existing message
        return {
          ...prev,
          [threadId]: {
            ...cached,
            messages: cached.messages.map(m => m.id === message.id ? message : m),
            timestamp: Date.now(),
            version: ++cacheVersion.current
          }
        };
      }
      
      // Add new message
      const updatedMessages = [...cached.messages, message];
      
      // Keep only the most recent messages
      const limitedMessages = updatedMessages.slice(-MAX_CACHED_MESSAGES_PER_THREAD);
      
      return {
        ...prev,
        [threadId]: {
          messages: limitedMessages,
          timestamp: Date.now(),
          version: ++cacheVersion.current
        }
      };
    });
  }, []);
  
  // Cache threads with intelligent updates
  const cacheThreads = useCallback((threads: MessageThread[]) => {
    setThreadCache(prev => {
      // Only update if threads have actually changed
      const hasChanged = prev.threads.length !== threads.length ||
        prev.threads.some((thread, index) => {
          const newThread = threads[index];
          return !newThread || 
            thread.id !== newThread.id ||
            thread.last_message_at !== newThread.last_message_at ||
            thread.unread_count !== newThread.unread_count;
        });
      
      if (!hasChanged) {
        return prev;
      }
      
      // Limit cached threads to prevent memory issues
      const limitedThreads = threads.slice(0, MAX_CACHED_THREADS);
      
      return {
        threads: limitedThreads,
        lastFetch: Date.now(),
        version: prev.version + 1
      };
    });
  }, []);
  
  // Get cached threads with smart freshness logic
  const getCachedThreads = useCallback((): MessageThread[] | null => {
    const now = Date.now();
    
    // Use shorter cache duration for threads since they change more frequently
    const threadCacheDuration = CACHE_DURATION / 2;
    
    if (now - threadCache.lastFetch < threadCacheDuration && threadCache.threads.length > 0) {
      return threadCache.threads;
    }
    return null;
  }, [threadCache, CACHE_DURATION]);
  
  // Optimized unread count management
  const updateUnreadCount = useCallback((threadId: string, count: number) => {
    setUnreadCache(prev => ({
      ...prev,
      [threadId]: {
        count,
        timestamp: Date.now()
      }
    }));
  }, []);
  
  // Get unread count with fallback
  const getUnreadCount = useCallback((threadId: string): number => {
    const cached = unreadCache[threadId];
    if (!cached) return 0;
    
    // Check if cache is still fresh
    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) {
      return 0;
    }
    
    return cached.count;
  }, [unreadCache, CACHE_DURATION]);
  
  // Mark thread as read with cache updates
  const markThreadAsRead = useCallback((threadId: string) => {
    // Update unread count cache
    setUnreadCache(prev => ({
      ...prev,
      [threadId]: {
        count: 0,
        timestamp: Date.now()
      }
    }));
    
    // Update messages in cache to mark as read
    setMessageCache(prev => {
      const cached = prev[threadId];
      if (!cached) return prev;
      
      const hasUnreadMessages = cached.messages.some(msg => !msg.read_at);
      if (!hasUnreadMessages) return prev; // No changes needed
      
      const updatedMessages = cached.messages.map(msg => ({
        ...msg,
        read_at: msg.read_at || new Date().toISOString()
      }));
      
      return {
        ...prev,
        [threadId]: {
          ...cached,
          messages: updatedMessages,
          timestamp: Date.now(),
          version: ++cacheVersion.current
        }
      };
    });
    
    // Update thread cache to reflect read status
    setThreadCache(prev => {
      const updatedThreads = prev.threads.map(thread => 
        thread.id === threadId 
          ? { ...thread, unread_count: 0 }
          : thread
      );
      
      return {
        ...prev,
        threads: updatedThreads,
        version: prev.version + 1
      };
    });
  }, []);
  
  // Clear cache efficiently
  const clearCache = useCallback(() => {
    setMessageCache({});
    setThreadCache({ threads: [], lastFetch: 0, version: 0 });
    setUnreadCache({});
    cacheVersion.current = 0;
  }, []);
  
  // Get total unread count with memoization
  const totalUnreadCount = useMemo(() => {
    const now = Date.now();
    return Object.values(unreadCache)
      .filter(cache => now - cache.timestamp < CACHE_DURATION)
      .reduce((sum, cache) => sum + cache.count, 0);
  }, [unreadCache, CACHE_DURATION]);
  
  // Cache statistics for debugging
  const getCacheStats = useCallback(() => {
    const messageCount = Object.values(messageCache).reduce((sum, cache) => sum + cache.messages.length, 0);
    const now = Date.now();
    const freshCaches = Object.values(messageCache).filter(cache => now - cache.timestamp < CACHE_DURATION).length;
    
    return {
      totalThreads: threadCache.threads.length,
      totalMessages: messageCount,
      freshMessageCaches: freshCaches,
      totalUnreadThreads: Object.keys(unreadCache).length,
      cacheVersion: cacheVersion.current,
      memoryEstimate: {
        threads: JSON.stringify(threadCache).length,
        messages: JSON.stringify(messageCache).length,
        unread: JSON.stringify(unreadCache).length
      }
    };
  }, [messageCache, threadCache, unreadCache]);
  
  // Preload related data for better performance
  const preloadThreadData = useCallback((threadId: string) => {
    // This could be used to prefetch user profiles, etc.
    // For now, just mark the intent
    console.log(`Preloading data for thread: ${threadId}`);
  }, []);
  
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
    clearCache,
    getCacheStats,
    preloadThreadData
  };
};
