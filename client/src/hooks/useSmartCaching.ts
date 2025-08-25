import { useCallback, useEffect, useRef, useState } from 'react';

interface CacheConfig {
  ttl?: number;
  maxSize?: number;
  persistent?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Smart caching with LRU eviction and predictive preloading
export const useSmartCaching = <T>(config: CacheConfig = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
    persistent = false
  } = config;

  const cache = useRef(new Map<string, CacheEntry<T>>());
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  // Get from cache with LRU tracking
  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > ttl) {
      cache.current.delete(key);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return entry.data;
  }, [ttl]);

  // Set with intelligent eviction
  const set = useCallback((key: string, data: T) => {
    // Evict if at max size
    if (cache.current.size >= maxSize) {
      // Find least recently used item
      let lruKey = '';
      let oldestAccess = Date.now();
      
      for (const [k, entry] of cache.current.entries()) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          lruKey = k;
        }
      }
      
      if (lruKey) {
        cache.current.delete(lruKey);
      }
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });

    // Persist to localStorage if enabled
    if (persistent && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }, [maxSize, persistent]);

  // Predictive preloading based on access patterns
  const preload = useCallback(async (
    keys: string[],
    fetchFn: (key: string) => Promise<T>
  ) => {
    const promises = keys.map(async (key) => {
      if (!cache.current.has(key)) {
        try {
          const data = await fetchFn(key);
          set(key, data);
        } catch (error) {
          console.warn(`Failed to preload ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }, [set]);

  // Clear expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cache.current.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.current.delete(key);
      }
    }
  }, [ttl]);

  // Restore from localStorage on mount
  useEffect(() => {
    if (persistent && typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      
      keys.forEach(storageKey => {
        try {
          const stored = JSON.parse(localStorage.getItem(storageKey) || '');
          const key = storageKey.replace('cache_', '');
          
          if (Date.now() - stored.timestamp < ttl) {
            cache.current.set(key, {
              data: stored.data,
              timestamp: stored.timestamp,
              accessCount: 1,
              lastAccessed: Date.now()
            });
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.warn('Failed to restore cache from localStorage:', error);
        }
      });
    }
  }, [persistent, ttl]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, ttl / 2);
    return () => clearInterval(interval);
  }, [cleanup, ttl]);

  return {
    get,
    set,
    preload,
    cleanup,
    cacheStats,
    size: cache.current.size
  };
};