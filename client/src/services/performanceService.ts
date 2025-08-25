import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  user_id?: string;
  page_url: string;
  load_time_ms: number;
  user_agent?: string;
}

class PerformanceService {
  private static instance: PerformanceService;
  private metricsQueue: PerformanceMetric[] = [];
  private isFlushingQueue = false;

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private constructor() {
    // Automatically flush queue every 30 seconds
    setInterval(() => this.flushQueue(), 30000);
    
    // Flush queue when the page is about to unload
    window.addEventListener('beforeunload', () => this.flushQueue());
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metricsQueue.push({
      ...metric,
      user_agent: metric.user_agent || navigator.userAgent,
      page_url: metric.page_url || window.location.href,
    });

    // Auto-flush if queue gets too large
    if (this.metricsQueue.length >= 10) {
      this.flushQueue();
    }
  }

  /**
   * Record page load time automatically
   */
  recordPageLoad(pageUrl?: string): void {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      if (loadTime > 0) {
        this.recordMetric({
          page_url: pageUrl || window.location.href,
          load_time_ms: loadTime,
        });
      }
    }
  }

  /**
   * Record a custom performance measurement
   */
  recordCustomMetric(name: string, startTime: number, endTime?: number): void {
    const duration = endTime ? endTime - startTime : performance.now() - startTime;
    
    this.recordMetric({
      page_url: `${window.location.pathname}#${name}`,
      load_time_ms: Math.round(duration),
    });
  }

  /**
   * Flush all queued metrics to the database
   */
  private async flushQueue(): Promise<void> {
    if (this.isFlushingQueue || this.metricsQueue.length === 0) {
      return;
    }

    this.isFlushingQueue = true;
    const metricsToFlush = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metricsToFlush);

      if (error) {
        console.error('Failed to record performance metrics:', error);
        // Re-add metrics to queue if they failed to insert
        this.metricsQueue.unshift(...metricsToFlush);
      }
    } catch (error) {
      console.error('Error flushing performance metrics:', error);
      // Re-add metrics to queue if they failed to insert
      this.metricsQueue.unshift(...metricsToFlush);
    } finally {
      this.isFlushingQueue = false;
    }
  }

  /**
   * Manually flush the queue
   */
  async flush(): Promise<void> {
    await this.flushQueue();
  }

  /**
   * Start monitoring Web Vitals (Core Web Vitals)
   */
  startWebVitalsMonitoring(): void {
    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.recordMetric({
            page_url: `${window.location.pathname}#lcp`,
            load_time_ms: Math.round(lastEntry.startTime),
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric({
              page_url: `${window.location.pathname}#fid`,
              load_time_ms: Math.round(entry.processingStart - entry.startTime),
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Monitor Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          this.recordMetric({
            page_url: `${window.location.pathname}#cls`,
            load_time_ms: Math.round(clsValue * 1000), // Convert to ms-like scale
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.error('Error setting up Web Vitals monitoring:', error);
      }
    }
  }
}

export default PerformanceService;