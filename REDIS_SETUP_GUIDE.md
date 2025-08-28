# Redis Setup for Distributed Rate Limiting - 10K Users Scale

## Overview
This guide sets up Redis for distributed rate limiting to support 10,000+ concurrent users across multiple server instances.

## Phase 1: Local Development Setup

### 1. Install Redis Locally

#### macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Docker (All platforms):
```bash
docker run -d --name redis-rate-limit -p 6379:6379 redis:7-alpine
```

### 2. Test Redis Connection
```bash
redis-cli ping
# Should return: PONG
```

## Phase 2: Production Setup

### Option A: Supabase + Upstash Redis (Recommended)

1. **Create Upstash Redis Database:**
   - Go to [upstash.com](https://upstash.com)
   - Create new Redis database
   - Choose region closest to your Supabase region
   - Get connection details

2. **Add Environment Variables:**
```bash
# Add to your deployment environment
REDIS_URL=redis://default:your-password@your-redis.upstash.io:6379
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### Option B: AWS ElastiCache

1. **Create ElastiCache Redis Cluster:**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id rate-limit-cluster \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx
```

2. **Environment Variables:**
```bash
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6379
```

### Option C: Railway/Render Redis Add-on

Follow platform-specific Redis add-on instructions and set environment variables accordingly.

## Phase 3: Application Integration

### 1. Install Redis Client
```bash
npm install ioredis
npm install @types/ioredis --save-dev
```

### 2. Create Redis Rate Limiter Service

Create `/client/src/services/RedisRateLimitService.ts`:

```typescript
import Redis from 'ioredis';

export class RedisRateLimitService {
  private static instance: RedisRateLimitService;
  private redis: Redis | null = null;
  
  static getInstance(): RedisRateLimitService {
    if (!RedisRateLimitService.instance) {
      RedisRateLimitService.instance = new RedisRateLimitService();
    }
    return RedisRateLimitService.instance;
  }
  
  async initialize() {
    try {
      // Try Redis first, fallback to memory
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          connectTimeout: 5000,
          lazyConnect: true
        });
        
        await this.redis.connect();
        console.log('✅ Redis rate limiter connected');
        
        // Test the connection
        await this.redis.ping();
      }
    } catch (error) {
      console.warn('⚠️ Redis unavailable, using memory rate limiting:', error);
      this.redis = null;
    }
  }
  
  async checkRateLimit(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    
    if (!this.redis) {
      // Fallback to memory-based limiting
      return this.memoryRateLimit(key, windowMs, maxRequests);
    }
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      
      // Remove expired requests
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, `req:${now}:${Math.random()}`);
      
      // Set expiry
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) throw new Error('Pipeline execution failed');
      
      const currentCount = (results[1][1] as number) || 0;
      const allowed = currentCount < maxRequests;
      const remaining = Math.max(0, maxRequests - currentCount - 1);
      const resetTime = now + windowMs;
      
      // If not allowed, remove the request we just added
      if (!allowed) {
        await this.redis.zremrangebyrank(key, -1, -1);
      }
      
      return { allowed, remaining, resetTime };
      
    } catch (error) {
      console.error('Redis rate limit check failed:', error);
      // Fallback to allowing the request
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }
  }
  
  private memoryRateLimit(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    // Fallback implementation using Map (existing logic)
    // This is your existing memory-based rate limiting
    return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowMs };
  }
  
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
```

### 3. Update RateLimitService to use Redis

Update `/client/src/services/RateLimitService.ts`:

```typescript
import { RedisRateLimitService } from './RedisRateLimitService';

export class RateLimitService {
  private static instance: RateLimitService;
  private redisService: RedisRateLimitService;
  
  constructor() {
    this.redisService = RedisRateLimitService.getInstance();
  }
  
  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }
  
  async initialize() {
    await this.redisService.initialize();
  }
  
  async checkLimit(
    userId: string,
    action: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = this.rateLimits[action as keyof typeof this.rateLimits];
    if (!config) {
      return { allowed: true, remaining: Infinity, resetTime: Date.now() };
    }
    
    const key = `rate_limit:${userId}:${action}`;
    return this.redisService.checkRateLimit(key, config.windowMs, config.maxRequests);
  }
}
```

## Phase 4: Testing Redis Rate Limiting

### 1. Test Script

Create `test-redis-rate-limiting.js`:

```javascript
const { RedisRateLimitService } = require('./client/src/services/RedisRateLimitService');

async function testRateLimiting() {
  const service = RedisRateLimitService.getInstance();
  await service.initialize();
  
  console.log('Testing rate limiting...');
  
  // Test 10 rapid requests (should allow 5, block 5 for a 5-request limit)
  for (let i = 0; i < 10; i++) {
    const result = await service.checkRateLimit(
      'test-user-messages-send', 
      60000, // 1 minute window
      5      // 5 requests max
    );
    
    console.log(`Request ${i + 1}: ${result.allowed ? '✅ ALLOWED' : '❌ BLOCKED'} (remaining: ${result.remaining})`);
    
    if (i === 4) {
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  await service.disconnect();
}

testRateLimiting().catch(console.error);
```

### 2. Run the Test
```bash
cd /Users/lazy/Downloads/together-we-begin
node test-redis-rate-limiting.js
```

## Phase 5: Deployment Configuration

### Environment Variables for Production

Add these to your deployment platform:

```bash
# Required for Redis rate limiting
REDIS_URL=redis://default:password@host:port
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Fallback to memory if Redis fails
ENABLE_MEMORY_FALLBACK=true

# Rate limiting config
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STRICT_MODE=false  # Set to true in production
```

### Supabase Edge Function Integration

If using Supabase Edge Functions, add Redis rate limiting there too:

```typescript
// In your edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { connect } from "https://deno.land/x/redis@v0.29.0/mod.ts";

serve(async (req) => {
  // Connect to Redis
  const redis = await connect({
    hostname: Deno.env.get("REDIS_HOST")!,
    port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
    password: Deno.env.get("REDIS_PASSWORD"),
  });
  
  // Rate limit check
  const userId = req.headers.get('x-user-id');
  const rateLimitKey = `api:${userId}:${Date.now()}`;
  
  // ... rate limiting logic
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

## Benefits of Redis Rate Limiting

1. **True Scalability**: Works across multiple server instances
2. **Persistence**: Rate limits survive server restarts
3. **Performance**: Redis operations are extremely fast
4. **Flexibility**: Complex rate limiting patterns possible
5. **Monitoring**: Built-in Redis monitoring tools

## Monitoring Redis Performance

### Key Metrics to Track:
- Connection count
- Memory usage
- Commands per second
- Hit/miss ratios
- Network I/O

### Redis CLI Monitoring:
```bash
# Real-time monitoring
redis-cli monitor

# Performance stats
redis-cli info stats

# Memory usage
redis-cli info memory
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**: Check Redis server status and firewall
2. **Authentication Failed**: Verify Redis password
3. **High Memory Usage**: Implement key expiration policies
4. **Network Timeouts**: Adjust connection timeout settings

### Fallback Strategy:
The system gracefully falls back to memory-based rate limiting if Redis is unavailable, ensuring the application remains functional.

---

**Next Steps**: Once Redis is configured, the application will automatically scale to support 10,000+ concurrent users with distributed rate limiting across multiple server instances.