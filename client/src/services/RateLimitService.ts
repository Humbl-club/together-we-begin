/**
 * Rate Limiting Service for API Protection
 * Prevents abuse and ensures fair resource usage for 10k users
 * Now supports Redis for distributed rate limiting across multiple servers
 */

import { redisRateLimitService } from './RedisRateLimitService';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix?: string;  // Storage key prefix
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  isDistributed?: boolean;
}

class RateLimitService {
  private static instance: RateLimitService;
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Default rate limits for different operations
  private readonly configs: Record<string, RateLimitConfig> = {
    // API calls
    'api:read': { windowMs: 60000, maxRequests: 100 },  // 100 reads per minute
    'api:write': { windowMs: 60000, maxRequests: 30 },  // 30 writes per minute
    'api:heavy': { windowMs: 60000, maxRequests: 10 },  // 10 heavy operations per minute
    
    // Feature-specific limits
    'posts:create': { windowMs: 300000, maxRequests: 10 },  // 10 posts per 5 minutes
    'posts:like': { windowMs: 60000, maxRequests: 60 },  // 60 likes per minute
    'messages:send': { windowMs: 60000, maxRequests: 30 },  // 30 messages per minute
    'events:register': { windowMs: 60000, maxRequests: 5 },  // 5 registrations per minute
    'challenges:join': { windowMs: 3600000, maxRequests: 10 },  // 10 challenges per hour
    'challenges:leave': { windowMs: 300000, maxRequests: 20 },  // 20 leaves per 5 minutes  
    'challenges:create': { windowMs: 3600000, maxRequests: 5 },  // 5 challenge creates per hour
    'notifications:read': { windowMs: 60000, maxRequests: 100 },  // 100 notifications read per minute
    'notifications:batch_read': { windowMs: 300000, maxRequests: 10 },  // 10 batch reads per 5 minutes
    'profiles:update': { windowMs: 300000, maxRequests: 5 },  // 5 profile updates per 5 minutes
    'auth:attempts': { windowMs: 900000, maxRequests: 5 },  // 5 login attempts per 15 min
    
    // File uploads
    'upload:image': { windowMs: 60000, maxRequests: 10 },  // 10 images per minute
    'upload:large': { windowMs: 3600000, maxRequests: 5 },  // 5 large files per hour
    
    // Search operations
    'search:query': { windowMs: 60000, maxRequests: 30 },  // 30 searches per minute
    
    // Admin operations
    'admin:action': { windowMs: 60000, maxRequests: 50 },  // 50 admin actions per minute
  };

  private constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Initialize the rate limiting service
   * Sets up Redis connection and memory cleanup
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize Redis service
      await redisRateLimitService.initialize();
      
      this.isInitialized = true;
      console.log('✅ Rate limiting service initialized');
    } catch (error) {
      console.warn('⚠️ Rate limiting service initialization failed:', error);
      this.isInitialized = true; // Continue with memory-only mode
    }
  }

  /**
   * Check if an action is rate limited
   * @param key Unique identifier (e.g., userId + action)
   * @param configKey Configuration key or custom config
   * @returns true if allowed, false if rate limited
   */
  public async checkLimit(
    key: string, 
    configKey: string | RateLimitConfig
  ): Promise<boolean> {
    // Initialize Redis service if not done yet
    if (!this.isInitialized) {
      await this.initialize();
    }

    const config = typeof configKey === 'string' 
      ? this.configs[configKey] 
      : configKey;
      
    if (!config) {
      console.warn(`No rate limit config found for: ${configKey}`);
      return true; // Allow if no config
    }

    const limitKey = `rate_limit:${config.keyPrefix || ''}${key}`;
    
    try {
      // Try Redis first for distributed rate limiting
      const result = await redisRateLimitService.checkRateLimit(
        limitKey,
        config.windowMs,
        config.maxRequests
      );
      
      return result.allowed;
    } catch (error) {
      console.warn('Redis rate limit check failed, using memory fallback:', error);
      
      // Fallback to memory-based rate limiting
      return this.memoryCheckLimit(key, config);
    }
  }

  private memoryCheckLimit(
    key: string,
    config: RateLimitConfig
  ): boolean {
    const limitKey = `${config.keyPrefix || ''}${key}`;
    const now = Date.now();
    const entry = this.limits.get(limitKey);

    // Check if we have an existing entry
    if (entry) {
      // Check if window has expired
      if (now > entry.resetTime) {
        // Reset the window
        this.limits.set(limitKey, {
          count: 1,
          resetTime: now + config.windowMs
        });
        return true;
      }

      // Check if limit exceeded
      if (entry.count >= config.maxRequests) {
        return false; // Rate limited
      }

      // Increment counter
      entry.count++;
      return true;
    }

    // First request in window
    this.limits.set(limitKey, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  public getRemainingRequests(
    key: string, 
    configKey: string | RateLimitConfig
  ): number {
    const config = typeof configKey === 'string' 
      ? this.configs[configKey] 
      : configKey;
      
    if (!config) return 0;

    const limitKey = `${config.keyPrefix || ''}${key}`;
    const entry = this.limits.get(limitKey);

    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  public getResetTime(key: string, configKey: string): number | null {
    const config = this.configs[configKey];
    if (!config) return null;

    const limitKey = `${config.keyPrefix || ''}${key}`;
    const entry = this.limits.get(limitKey);

    return entry ? entry.resetTime : null;
  }

  /**
   * Reset limits for a specific key
   */
  public resetLimit(key: string, configKey?: string): void {
    if (configKey) {
      const config = this.configs[configKey];
      if (config) {
        const limitKey = `${config.keyPrefix || ''}${key}`;
        this.limits.delete(limitKey);
      }
    } else {
      // Reset all limits for this key
      const keysToDelete: string[] = [];
      this.limits.forEach((_, limitKey) => {
        if (limitKey.includes(key)) {
          keysToDelete.push(limitKey);
        }
      });
      keysToDelete.forEach(k => this.limits.delete(k));
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.limits.delete(key));
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  public getRateLimitHeaders(
    key: string, 
    configKey: string
  ): Record<string, string> {
    const config = this.configs[configKey];
    if (!config) return {};

    const remaining = this.getRemainingRequests(key, configKey);
    const resetTime = this.getResetTime(key, configKey);

    return {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime ? new Date(resetTime).toISOString() : '',
      'X-RateLimit-Window': (config.windowMs / 1000).toString()
    };
  }

  /**
   * Middleware for React hooks
   */
  public async withRateLimit<T>(
    key: string,
    configKey: string,
    operation: () => Promise<T>,
    onRateLimited?: () => void
  ): Promise<T> {
    const allowed = await this.checkLimit(key, configKey);

    if (!allowed) {
      const resetTime = this.getResetTime(key, configKey);
      const waitTime = resetTime ? resetTime - Date.now() : 0;
      
      if (onRateLimited) {
        onRateLimited();
      } else {
        throw new Error(`Rate limited. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
      }
    }

    return operation();
  }

  /**
   * Destroy the service (cleanup)
   */
  public async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Cleanup Redis connection
    try {
      await redisRateLimitService.disconnect();
    } catch (error) {
      console.warn('Error disconnecting Redis:', error);
    }
    
    this.limits.clear();
    this.isInitialized = false;
  }

  /**
   * Get service statistics
   */
  public async getStats(): Promise<{
    memoryEntries: number;
    isRedisConnected: boolean;
    redisStats?: any;
  }> {
    const redisStats = await redisRateLimitService.getStats();
    
    return {
      memoryEntries: this.limits.size,
      isRedisConnected: redisStats.isRedisConnected,
      redisStats
    };
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance();

// Export types
export type { RateLimitConfig, RateLimitEntry };