import { useState, useEffect, useCallback, useRef } from 'react';

// Performance monitoring hook
export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    loadTime: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    // Monitor performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      }
    });

    if ('observe' in observer) {
      observer.observe({ entryTypes: ['measure'] });
    }

    return () => observer.disconnect();
  }, []);

  const measureRender = useCallback((name: string, fn: () => void) => {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }, []);

  return { metrics, measureRender };
};

// Lazy image loading hook
export const useLazyLoading = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.onload = () => {
                setLoadedImages(prev => new Set([...prev, src]));
              };
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const observe = useCallback((element: HTMLImageElement) => {
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return { observe, loadedImages };
};

// Bundle size optimization hook
export const useBundleOptimization = () => {
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());

  const loadModule = useCallback(async (moduleName: string, importFn: () => Promise<any>) => {
    if (loadedModules.has(moduleName)) {
      return;
    }

    try {
      await importFn();
      setLoadedModules(prev => new Set([...prev, moduleName]));
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
    }
  }, [loadedModules]);

  return { loadModule, loadedModules };
};

// Network optimization hook
export const useNetworkOptimization = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    saveData: false
  });

  useEffect(() => {
    // @ts-ignore - Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const updateConnectionInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          saveData: connection.saveData || false
        });
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
      
      return () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  const shouldOptimize = networkInfo.effectiveType === 'slow-2g' || 
                        networkInfo.effectiveType === '2g' || 
                        networkInfo.saveData;

  return { networkInfo, shouldOptimize };
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleItems, setVisibleItems] = useState<any[]>([]);

  useEffect(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    setVisibleItems(items.slice(startIndex, endIndex));
  }, [scrollTop, items, itemHeight, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: Math.floor(scrollTop / itemHeight) * itemHeight
  };
};

// Database query optimization hook
export const useOptimizedQuery = () => {
  const queryCache = useRef<Map<string, any>>(new Map());
  const requestCache = useRef<Map<string, Promise<any>>>(new Map());

  const executeQuery = useCallback(async (
    queryKey: string, 
    queryFn: () => Promise<any>,
    options: { 
      cacheTime?: number;
      staleTime?: number;
      refetchOnMount?: boolean;
    } = {}
  ) => {
    const { cacheTime = 5 * 60 * 1000, staleTime = 60 * 1000 } = options;
    
    // Check cache first
    const cached = queryCache.current.get(queryKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }

    // Check if request is in flight
    if (requestCache.current.has(queryKey)) {
      return requestCache.current.get(queryKey);
    }

    // Execute new request
    const request = queryFn().then(data => {
      queryCache.current.set(queryKey, {
        data,
        timestamp: Date.now()
      });
      requestCache.current.delete(queryKey);
      
      // Set cache expiration
      setTimeout(() => {
        queryCache.current.delete(queryKey);
      }, cacheTime);
      
      return data;
    }).catch(error => {
      requestCache.current.delete(queryKey);
      throw error;
    });

    requestCache.current.set(queryKey, request);
    return request;
  }, []);

  const invalidateQuery = useCallback((queryKey: string) => {
    queryCache.current.delete(queryKey);
    requestCache.current.delete(queryKey);
  }, []);

  const clearCache = useCallback(() => {
    queryCache.current.clear();
    requestCache.current.clear();
  }, []);

  return { executeQuery, invalidateQuery, clearCache };
};