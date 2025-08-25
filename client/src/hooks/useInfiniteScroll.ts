import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface InfiniteScrollOptions<T> {
  fetchFunction: (page: number, limit: number) => Promise<T[]>;
  pageSize?: number;
  enabled?: boolean;
}

export const useInfiniteScroll = <T>({
  fetchFunction,
  pageSize = 10,
  enabled = true
}: InfiniteScrollOptions<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchFunction(page, pageSize);
      
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
        
        if (newData.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, pageSize, loading, hasMore, enabled]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  const refresh = useCallback(() => {
    reset();
    loadMore();
  }, [reset, loadMore]);

  useEffect(() => {
    if (inView && enabled) {
      loadMore();
    }
  }, [inView, loadMore, enabled]);

  useEffect(() => {
    if (enabled && data.length === 0) {
      loadMore();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
    ref
  };
};