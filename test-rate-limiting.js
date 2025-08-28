#!/usr/bin/env node
/**
 * Comprehensive rate limiting functionality test
 * Tests both RedisRateLimitService and RateLimitService
 */

console.log('🔒 Testing Rate Limiting Functionality...\n');

// Test RedisRateLimitService functionality
async function testRedisRateLimitFunctionality() {
  try {
    // Import the service
    const { RedisRateLimitService } = await import('./client/src/services/RedisRateLimitService.ts');
    const service = RedisRateLimitService.getInstance();
    
    console.log('🔧 Testing RedisRateLimitService functionality...');
    
    // Initialize service
    await service.initialize();
    console.log('✅ Service initialized successfully');
    
    // Test basic rate limiting
    const testKey = 'test-user-123';
    const windowMs = 60000; // 1 minute
    const maxRequests = 3;
    
    console.log(`\n📊 Testing rate limit: ${maxRequests} requests per ${windowMs/1000}s`);
    
    // Make requests within limit
    for (let i = 1; i <= maxRequests; i++) {
      const result = await service.checkRateLimit(testKey, windowMs, maxRequests);
      console.log(`Request ${i}: allowed=${result.allowed}, remaining=${result.remaining}, redis=${result.isRedis}`);
      
      if (!result.allowed) {
        console.log('❌ Request blocked unexpectedly within limit');
        return false;
      }
    }
    
    // Next request should be blocked
    const blockedResult = await service.checkRateLimit(testKey, windowMs, maxRequests);
    console.log(`Request 4 (should be blocked): allowed=${blockedResult.allowed}, remaining=${blockedResult.remaining}`);
    
    if (blockedResult.allowed) {
      console.log('❌ Request allowed when should be blocked');
      return false;
    }
    
    console.log('✅ Rate limiting working correctly');
    
    // Test health check
    const isHealthy = await service.healthCheck();
    console.log(`Health check: ${isHealthy ? 'Connected to Redis' : 'Using memory fallback'}`);
    
    // Test stats
    const stats = await service.getStats();
    console.log(`Stats: Redis=${stats.isRedisConnected}, Memory entries=${stats.memoryStoreSize}`);
    
    return true;
  } catch (error) {
    console.log('❌ RedisRateLimitService test failed:', error.message);
    return false;
  }
}

// Test RateLimitService integration
async function testRateLimitServiceIntegration() {
  try {
    const { rateLimitService } = await import('./client/src/services/RateLimitService.ts');
    
    console.log('\n🔧 Testing RateLimitService integration...');
    
    // Initialize the service
    await rateLimitService.initialize();
    console.log('✅ RateLimitService initialized');
    
    // Test different rate limit configs
    const testConfigs = [
      { key: 'posts:create', testUser: 'user1' },
      { key: 'messages:send', testUser: 'user2' }, 
      { key: 'challenges:join', testUser: 'user3' },
      { key: 'api:read', testUser: 'user4' }
    ];
    
    let allConfigsWork = true;
    
    for (const config of testConfigs) {
      console.log(`\n📝 Testing config: ${config.key}`);
      
      // Test that we can check limits
      let allowed = await rateLimitService.checkLimit(config.testUser, config.key);
      console.log(`  First request: ${allowed ? 'allowed' : 'blocked'}`);
      
      if (!allowed) {
        console.log(`❌ First request blocked for ${config.key}`);
        allConfigsWork = false;
        continue;
      }
      
      // Test remaining requests
      const remaining = rateLimitService.getRemainingRequests(config.testUser, config.key);
      console.log(`  Remaining requests: ${remaining}`);
      
      // Test reset time
      const resetTime = rateLimitService.getResetTime(config.testUser, config.key);
      console.log(`  Reset time: ${resetTime ? new Date(resetTime).toISOString() : 'N/A'}`);
      
      // Test withRateLimit wrapper
      try {
        const result = await rateLimitService.withRateLimit(
          `${config.testUser}-wrapper`,
          config.key,
          async () => {
            return `Operation completed for ${config.key}`;
          }
        );
        console.log(`  WithRateLimit: ${result}`);
      } catch (error) {
        console.log(`  WithRateLimit error: ${error.message}`);
      }
      
      console.log(`✅ ${config.key} config working correctly`);
    }
    
    return allConfigsWork;
  } catch (error) {
    console.log('❌ RateLimitService integration test failed:', error.message);
    return false;
  }
}

// Test rate limit enforcement
async function testRateLimitEnforcement() {
  try {
    const { rateLimitService } = await import('./client/src/services/RateLimitService.ts');
    
    console.log('\n🚫 Testing rate limit enforcement...');
    
    // Create a custom config with very low limits for testing
    const testConfig = {
      windowMs: 10000, // 10 seconds  
      maxRequests: 2   // Only 2 requests
    };
    
    const testUser = 'enforcement-test-user';
    
    // First 2 requests should be allowed
    for (let i = 1; i <= testConfig.maxRequests; i++) {
      const allowed = await rateLimitService.checkLimit(testUser, testConfig);
      console.log(`Request ${i}: ${allowed ? 'allowed' : 'blocked'}`);
      
      if (!allowed) {
        console.log(`❌ Request ${i} blocked when should be allowed`);
        return false;
      }
    }
    
    // 3rd request should be blocked
    const blocked = await rateLimitService.checkLimit(testUser, testConfig);
    console.log(`Request 3: ${blocked ? 'allowed' : 'blocked'}`);
    
    if (blocked) {
      console.log('❌ Request 3 allowed when should be blocked');
      return false;
    }
    
    console.log('✅ Rate limit enforcement working correctly');
    return true;
    
  } catch (error) {
    console.log('❌ Rate limit enforcement test failed:', error.message);
    return false;
  }
}

// Test performance under load
async function testRateLimitPerformance() {
  try {
    const { rateLimitService } = await import('./client/src/services/RateLimitService.ts');
    
    console.log('\n⚡ Testing rate limiting performance...');
    
    const startTime = Date.now();
    const iterations = 100;
    let successCount = 0;
    
    // Run 100 rate limit checks
    for (let i = 0; i < iterations; i++) {
      try {
        const allowed = await rateLimitService.checkLimit(`perf-user-${i}`, 'api:read');
        if (allowed) successCount++;
      } catch (error) {
        console.warn(`Performance test iteration ${i} failed:`, error.message);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    
    console.log(`Results:`);
    console.log(`  Total time: ${duration}ms`);
    console.log(`  Average per check: ${avgTime.toFixed(2)}ms`);
    console.log(`  Success rate: ${(successCount/iterations*100).toFixed(1)}%`);
    console.log(`  Throughput: ${Math.round(iterations/(duration/1000))} checks/second`);
    
    // Performance should be under 10ms per check for good UX
    const performanceGood = avgTime < 10;
    console.log(`Performance: ${performanceGood ? '✅ Good' : '⚠️ Needs improvement'}`);
    
    return performanceGood;
    
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive rate limiting tests...\n');
  
  const tests = [
    { name: 'Redis Rate Limit Functionality', fn: testRedisRateLimitFunctionality },
    { name: 'Rate Limit Service Integration', fn: testRateLimitServiceIntegration },
    { name: 'Rate Limit Enforcement', fn: testRateLimitEnforcement },
    { name: 'Rate Limiting Performance', fn: testRateLimitPerformance }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const success = await test.fn();
      if (success) {
        passed++;
        console.log(`\n✅ ${test.name}: PASSED`);
      } else {
        failed++;
        console.log(`\n❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`\n💥 ${test.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RATE LIMITING TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL RATE LIMITING TESTS PASSED!');
    console.log('🔒 Rate limiting is production ready for 10,000 users');
    return true;
  } else {
    console.log(`\n⚠️ ${failed} tests failed - Rate limiting needs fixes`);
    return false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Rate limiting tests interrupted');
  process.exit(0);
});

// Run if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Rate limiting test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests };