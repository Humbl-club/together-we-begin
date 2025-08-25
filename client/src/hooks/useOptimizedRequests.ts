import { useCallback, useRef } from 'react';

/**
 * Debounce hook to prevent excessive function calls
 * Essential for database operations to prevent duplicate requests
 */
export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

/**
 * Request deduplication hook to prevent duplicate API calls
 */
export const useRequestDeduplication = () => {
  const activeRequests = useRef<Map<string, Promise<any>>>(new Map());

  const deduplicate = useCallback(
    async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
      // If there's already a request in flight for this key, return its promise
      if (activeRequests.current.has(key)) {
        return activeRequests.current.get(key)!;
      }

      // Start new request
      const promise = requestFn().finally(() => {
        // Clean up when request completes
        activeRequests.current.delete(key);
      });

      activeRequests.current.set(key, promise);
      return promise;
    },
    []
  );

  const clearCache = useCallback(() => {
    activeRequests.current.clear();
  }, []);

  return { deduplicate, clearCache };
};