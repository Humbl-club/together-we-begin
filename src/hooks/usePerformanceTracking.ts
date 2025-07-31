import { useEffect, useRef } from 'react';
import PerformanceService from '@/services/performanceService';

/**
 * Hook to automatically track page performance
 */
export const usePerformanceTracking = (pageName?: string) => {
  const performanceService = PerformanceService.getInstance();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    // Record page start time
    startTimeRef.current = performance.now();

    // Record page load time when component mounts
    const recordPageLoad = () => {
      performanceService.recordPageLoad(pageName || window.location.pathname);
    };

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      recordPageLoad();
    } else {
      window.addEventListener('load', recordPageLoad);
    }

    // Start Web Vitals monitoring
    performanceService.startWebVitalsMonitoring();

    return () => {
      // Record time spent on page when component unmounts
      if (startTimeRef.current) {
        const timeSpent = performance.now() - startTimeRef.current;
        performanceService.recordCustomMetric(
          `${pageName || window.location.pathname}_session`,
          startTimeRef.current,
          performance.now()
        );
      }
      
      window.removeEventListener('load', recordPageLoad);
    };
  }, [pageName, performanceService]);

  /**
   * Record a custom performance metric
   */
  const recordMetric = (name: string, startTime: number, endTime?: number) => {
    performanceService.recordCustomMetric(name, startTime, endTime);
  };

  /**
   * Start timing a custom operation
   */
  const startTiming = (name: string) => {
    const start = performance.now();
    return {
      end: () => recordMetric(name, start),
      startTime: start,
    };
  };

  return {
    recordMetric,
    startTiming,
  };
};