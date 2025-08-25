// Real-time performance monitoring and optimization
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: PerformanceMetric[] = [];
  private observers = new Set<(metric: PerformanceMetric) => void>();
  private isMonitoring = false;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor vital web metrics
    this.observeWebVitals();
    this.observeResourceTiming();
    this.observeUserTiming();
  }

  measure(name: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now();
    
    return fn().then(
      (result) => {
        this.recordMetric({
          name: `${name}_duration`,
          value: performance.now() - start,
          timestamp: Date.now(),
          metadata: { status: 'success' }
        });
        return result;
      },
      (error) => {
        this.recordMetric({
          name: `${name}_duration`,
          value: performance.now() - start,
          timestamp: Date.now(),
          metadata: { status: 'error', error: error.message }
        });
        throw error;
      }
    );
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Notify observers
    this.observers.forEach(observer => observer(metric));
  }

  onMetric(callback: (metric: PerformanceMetric) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  getMetrics(filter?: {
    name?: string;
    since?: number;
    limit?: number;
  }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter?.name) {
      filtered = filtered.filter(m => m.name.includes(filter.name!));
    }

    if (filter?.since) {
      filtered = filtered.filter(m => m.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  getAverageMetric(name: string, timeWindow = 60000): number {
    const now = Date.now();
    const relevantMetrics = this.metrics.filter(
      m => m.name === name && (now - m.timestamp) <= timeWindow
    );

    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  private observeWebVitals(): void {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: 'lcp',
          value: entry.startTime,
          timestamp: Date.now()
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: 'fid',
          value: (entry as any).processingStart - entry.startTime,
          timestamp: Date.now()
        });
      }
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          this.recordMetric({
            name: 'cls',
            value: (entry as any).value,
            timestamp: Date.now()
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }

  private observeResourceTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        this.recordMetric({
          name: 'resource_load',
          value: resource.responseEnd - resource.requestStart,
          timestamp: Date.now(),
          metadata: {
            url: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize
          }
        });
      }
    }).observe({ type: 'resource', buffered: true });
  }

  private observeUserTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: `user_timing_${entry.name}`,
          value: entry.duration || 0,
          timestamp: Date.now()
        });
      }
    }).observe({ type: 'measure', buffered: true });
  }
}
