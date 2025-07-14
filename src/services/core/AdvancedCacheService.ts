// Enterprise-grade caching with multiple strategies
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class AdvancedCacheService {
  private static instance: AdvancedCacheService;
  private caches = new Map<string, Map<string, CacheEntry<any>>>();
  private maxSize: number;
  private defaultTTL: number;

  private constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanupInterval();
  }

  static getInstance(): AdvancedCacheService {
    if (!AdvancedCacheService.instance) {
      AdvancedCacheService.instance = new AdvancedCacheService();
    }
    return AdvancedCacheService.instance;
  }

  private getCache(namespace: string): Map<string, CacheEntry<any>> {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }
    return this.caches.get(namespace)!;
  }

  set<T>(namespace: string, key: string, data: T, ttl?: number): void {
    const cache = this.getCache(namespace);
    const now = Date.now();
    
    // Evict if cache is full using LRU strategy
    if (cache.size >= this.maxSize) {
      this.evictLRU(namespace);
    }

    cache.set(key, {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get<T>(namespace: string, key: string): T | null {
    const cache = this.getCache(namespace);
    const entry = cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  invalidate(namespace: string, pattern?: string): void {
    const cache = this.getCache(namespace);
    
    if (!pattern) {
      cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of cache) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  }

  private evictLRU(namespace: string): void {
    const cache = this.getCache(namespace);
    let oldestKey = '';
    let oldestAccess = Date.now();

    for (const [key, entry] of cache) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [namespace, cache] of this.caches) {
        for (const [key, entry] of cache) {
          if (now - entry.timestamp > entry.ttl) {
            cache.delete(key);
          }
        }
      }
    }, 60000); // Cleanup every minute
  }

  getStats(namespace: string): { size: number; hitRate: number } {
    const cache = this.getCache(namespace);
    let totalAccess = 0;
    
    for (const entry of cache.values()) {
      totalAccess += entry.accessCount;
    }

    return {
      size: cache.size,
      hitRate: totalAccess / Math.max(cache.size, 1)
    };
  }
}