import { useEffect, useCallback, useRef, useState } from 'react';

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

interface PerformanceBudget {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

// Real-time performance monitoring with Web Vitals
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [budgetViolations, setBudgetViolations] = useState<string[]>([]);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Performance budget thresholds (in milliseconds)
  const budget: PerformanceBudget = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 800
  };

  // Track Core Web Vitals
  const trackWebVitals = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      if (lastEntry) {
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        setMetrics(prev => ({ ...prev, lcp }));
        
        if (lcp > budget.lcp) {
          setBudgetViolations(prev => [...prev, `LCP: ${lcp}ms > ${budget.lcp}ms`]);
        }
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        setMetrics(prev => ({ ...prev, fid }));
        
        if (fid > budget.fid) {
          setBudgetViolations(prev => [...prev, `FID: ${fid}ms > ${budget.fid}ms`]);
        }
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      setMetrics(prev => ({ ...prev, cls: clsValue }));
      
      if (clsValue > budget.cls) {
        setBudgetViolations(prev => [...prev, `CLS: ${clsValue} > ${budget.cls}`]);
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }

    observerRef.current = lcpObserver;
  }, [budget]);

  // Measure custom performance metrics
  const measureCustomMetric = useCallback((name: string, startTime?: number) => {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : endTime;
    
    // Send to analytics or logging service
    console.log(`Custom metric ${name}: ${duration}ms`);
    
    return duration;
  }, []);

  // Track page load performance
  const trackPageLoad = useCallback(() => {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as any;
    
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
      
      setMetrics(prev => ({ 
        ...prev, 
        ttfb,
        fcp: fcp || prev.fcp
      }));

      if (ttfb > budget.ttfb) {
        setBudgetViolations(prev => [...prev, `TTFB: ${ttfb}ms > ${budget.ttfb}ms`]);
      }
      
      if (fcp && fcp > budget.fcp) {
        setBudgetViolations(prev => [...prev, `FCP: ${fcp}ms > ${budget.fcp}ms`]);
      }
    }
  }, [budget]);

  // Performance regression detection
  const detectRegression = useCallback((newMetric: number, baseline: number, threshold = 0.1) => {
    const regression = (newMetric - baseline) / baseline;
    return regression > threshold;
  }, []);

  // Mobile-specific performance tracking
  const trackMobileMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Network information
    const connection = (navigator as any).connection;
    if (connection) {
      console.log('Network info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
    }

    // Memory information
    const memory = (performance as any).memory;
    if (memory) {
      console.log('Memory info:', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }
  }, []);

  useEffect(() => {
    trackWebVitals();
    trackPageLoad();
    trackMobileMetrics();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [trackWebVitals, trackPageLoad, trackMobileMetrics]);

  return {
    metrics,
    budgetViolations,
    measureCustomMetric,
    detectRegression,
    budget
  };
};