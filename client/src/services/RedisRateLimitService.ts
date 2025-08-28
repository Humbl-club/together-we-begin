// Redis-based distributed rate limiting for 10K+ users
// Falls back to memory-based limiting if Redis is unavailable

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  isRedis: boolean;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RedisRateLimitService {
  private static instance: RedisRateLimitService;
  private redis: any = null;
  private isRedisAvailable = false;
  
  // Memory fallback store
  private memoryStore = new Map<string, { requests: number[]; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  static getInstance(): RedisRateLimitService {
    if (!RedisRateLimitService.instance) {
      RedisRateLimitService.instance = new RedisRateLimitService();
    }
    return RedisRateLimitService.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      // Only attempt Redis in Node.js server environment
      if (this.isServerEnvironment()) {
        console.log('🔄 Attempting Redis connection for distributed rate limiting...');
        
        // Try to initialize Redis connection
        await this.initializeRedis();
        
        console.log('✅ Redis rate limiter connected successfully');
      } else {
        console.log('📝 Using memory-based rate limiting (client-side or no Redis URL)');
      }
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, using memory fallback:', error);
      this.isRedisAvailable = false;
    }
    
    // Start cleanup for memory store
    this.startMemoryCleanup();
  }
  
  private isServerEnvironment(): boolean {
    return (
      typeof window === 'undefined' &&
      typeof process !== 'undefined' &&
      process.versions?.node &&
      !!process.env.REDIS_URL &&
      // Avoid bundling in client builds
      process.env.VITE_BUILD !== 'true'
    );
  }
  
  private async initializeRedis(): Promise<void> {
    // Only import Redis when we're definitely in server environment
    if (!this.isServerEnvironment()) {
      throw new Error('Not in server environment');
    }
    
    // Dynamic import to avoid bundling in client
    const { default: Redis } = await import('ioredis');
    
    this.redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      enableAutoPipelining: true
    });
    
    // Test connection
    await this.redis.ping();
    this.isRedisAvailable = true;
    
    // Setup Redis error handling
    this.redis.on('error', (err: any) => {
      console.warn('⚠️ Redis connection error, falling back to memory:', err.message);
      this.isRedisAvailable = false;
    });
    
    this.redis.on('connect', () => {
      console.log('🔄 Redis reconnected');
      this.isRedisAvailable = true;
    });
  }
  
  async checkRateLimit(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): Promise<RateLimitResult> {
    
    // Try Redis first if available
    if (this.isRedisAvailable && this.redis) {
      try {
        const result = await this.redisRateLimit(key, windowMs, maxRequests);
        return { ...result, isRedis: true };
      } catch (error) {
        console.warn('Redis rate limit check failed, falling back to memory:', error);
        this.isRedisAvailable = false;
      }
    }
    
    // Fallback to memory-based rate limiting
    const result = this.memoryRateLimit(key, windowMs, maxRequests);
    return { ...result, isRedis: false };
  }
  
  private async redisRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<Omit<RateLimitResult, 'isRedis'>> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    
    // Remove expired requests from sorted set
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add current request with timestamp as score and unique value
    const requestId = `${now}:${Math.random().toString(36).substr(2, 9)}`;
    pipeline.zadd(key, now, requestId);
    
    // Set key expiration (cleanup after window + buffer)
    pipeline.expire(key, Math.ceil((windowMs + 60000) / 1000));
    
    const results = await pipeline.exec();
    
    if (!results || results.some(([err]: any) => err)) {
      throw new Error('Redis pipeline execution failed');
    }
    
    // Get count before adding current request
    const currentCount = (results[1][1] as number) || 0;
    const allowed = currentCount < maxRequests;
    
    // If request not allowed, remove the request we just added
    if (!allowed) {
      await this.redis.zrem(key, requestId);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs
      };
    }
    
    const remaining = Math.max(0, maxRequests - currentCount - 1);
    const resetTime = now + windowMs;
    
    return { allowed, remaining, resetTime };
  }
  
  private memoryRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): Omit<RateLimitResult, 'isRedis'> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let bucket = this.memoryStore.get(key);
    
    if (!bucket) {
      bucket = { requests: [], resetTime: now + windowMs };
      this.memoryStore.set(key, bucket);
    }
    
    // Remove expired requests
    bucket.requests = bucket.requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (bucket.requests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.resetTime
      };
    }
    
    // Add current request
    bucket.requests.push(now);
    
    // Update reset time if needed
    if (bucket.resetTime <= now) {
      bucket.resetTime = now + windowMs;
    }
    
    const remaining = Math.max(0, maxRequests - bucket.requests.length);
    
    return {
      allowed: true,
      remaining,
      resetTime: bucket.resetTime
    };
  }
  
  private startMemoryCleanup(): void {
    // Clean up expired memory entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, bucket] of Array.from(this.memoryStore.entries())) {
        // Remove buckets that are completely expired
        if (bucket.resetTime < now - 300000) { // 5 minutes buffer
          this.memoryStore.delete(key);
          cleanedCount++;
        } else {
          // Clean up old requests within active buckets
          const originalLength = bucket.requests.length;
          bucket.requests = bucket.requests.filter(timestamp => timestamp > now - 3600000); // Keep 1 hour
          
          if (bucket.requests.length !== originalLength) {
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  async getStats(): Promise<{
    isRedisConnected: boolean;
    memoryStoreSize: number;
    redisInfo?: any;
  }> {
    const stats = {
      isRedisConnected: this.isRedisAvailable,
      memoryStoreSize: this.memoryStore.size
    };
    
    if (this.isRedisAvailable && this.redis) {
      try {
        const redisInfo = await this.redis.info('stats');
        return { ...stats, redisInfo };
      } catch (error) {
        console.warn('Failed to get Redis stats:', error);
      }
    }
    
    return stats;
  }
  
  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.redis) {
      try {
        await this.redis.quit();
        console.log('🔌 Redis connection closed');
      } catch (error) {
        console.warn('Error closing Redis connection:', error);
      }
      this.redis = null;
    }
    
    this.isRedisAvailable = false;
    this.memoryStore.clear();
  }
  
  // Health check method
  async healthCheck(): Promise<boolean> {
    if (!this.isRedisAvailable || !this.redis) {
      return false;
    }
    
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.warn('Redis health check failed:', error);
      this.isRedisAvailable = false;
      return false;
    }
  }
}

// Export singleton instance
export const redisRateLimitService = RedisRateLimitService.getInstance();