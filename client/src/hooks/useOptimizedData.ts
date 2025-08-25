import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export const useOptimizedData = <T>(cacheKey: string, cacheDuration = 5 * 60 * 1000) => {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCachedData = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (entry && Date.now() < entry.timestamp + entry.expiry) {
      return entry.data;
    }
    cache.current.delete(key);
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: T) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      expiry: cacheDuration
    });
  }, [cacheDuration]);

  const fetchWithCache = useCallback(async <U extends T>(
    key: string,
    fetchFn: () => Promise<U>
  ): Promise<U> => {
    // Check cache first
    const cachedData = getCachedData(key);
    if (cachedData) {
      return cachedData as U;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchFn();
      setCachedData(key, data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCachedData, setCachedData]);

  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  return {
    fetchWithCache,
    getCachedData,
    setCachedData,
    invalidateCache,
    loading,
    error
  };
};