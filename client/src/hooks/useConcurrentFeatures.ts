import { useCallback, useDeferredValue, useTransition, useState, useEffect } from 'react';

// React 18 Concurrent Features Hook
export const useConcurrentFeatures = () => {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Non-urgent state updates with startTransition
  const updateWithTransition = useCallback((updateFn: () => void) => {
    startTransition(() => {
      updateFn();
    });
  }, [startTransition]);

  // Deferred value for heavy computations
  const deferValue = useCallback(<T>(value: T): T => {
    return useDeferredValue(value);
  }, []);

  // Time-slicing for smooth interactions
  const scheduleWork = useCallback((work: () => void, priority: 'urgent' | 'normal' = 'normal') => {
    if (priority === 'urgent') {
      work();
    } else {
      startTransition(work);
    }
  }, [startTransition]);

  return {
    isPending,
    updateWithTransition,
    deferValue,
    scheduleWork,
    searchQuery,
    setSearchQuery,
    deferredSearchQuery
  };
};

// Smart loading states for Suspense boundaries
export const useSmartLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  return { setLoading, isLoading, loadingStates };
};