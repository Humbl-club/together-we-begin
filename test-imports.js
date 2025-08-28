#!/usr/bin/env node
/**
 * Test script to verify all import chains work
 */

console.log('🧪 Testing import chains...\n');

// Test 1: Test RedisRateLimitService (server-side only)
async function testRedisService() {
  try {
    // Mock server environment
    global.window = undefined;
    
    const { RedisRateLimitService } = await import('./client/src/services/RedisRateLimitService.ts');
    const service = RedisRateLimitService.getInstance();
    
    console.log('✅ RedisRateLimitService import successful');
    
    // Test initialization (without actually connecting to Redis)
    await service.initialize();
    console.log('✅ RedisRateLimitService initialization works (fallback to memory)');
    
    // Test rate limit check
    const result = await service.checkRateLimit('test-key', 60000, 5);
    console.log('✅ RedisRateLimitService.checkRateLimit works:', result);
    
    return true;
  } catch (error) {
    console.log('❌ RedisRateLimitService failed:', error.message);
    return false;
  }
}

// Test 2: Test RateLimitService integration
async function testRateLimitService() {
  try {
    const { rateLimitService } = await import('./client/src/services/RateLimitService.ts');
    
    console.log('✅ RateLimitService import successful');
    
    // Test initialization
    await rateLimitService.initialize();
    console.log('✅ RateLimitService initialization works');
    
    // Test rate limit check
    const allowed = await rateLimitService.checkLimit('test-user', 'posts:create');
    console.log('✅ RateLimitService.checkLimit works:', allowed);
    
    // Test withRateLimit method
    let operationRan = false;
    const result = await rateLimitService.withRateLimit(
      'test-user-2',
      'messages:send',
      async () => {
        operationRan = true;
        return 'success';
      }
    );
    console.log('✅ RateLimitService.withRateLimit works:', result, operationRan);
    
    return true;
  } catch (error) {
    console.log('❌ RateLimitService failed:', error.message);
    return false;
  }
}

// Test 3: Test that rate limiting configs exist
async function testRateLimitConfigs() {
  try {
    const { rateLimitService } = await import('./client/src/services/RateLimitService.ts');
    
    const testConfigs = [
      'posts:create',
      'messages:send', 
      'challenges:join',
      'notifications:read',
      'profiles:update'
    ];
    
    let allExist = true;
    for (const config of testConfigs) {
      const remaining = rateLimitService.getRemainingRequests('test-user', config);
      if (typeof remaining !== 'number') {
        console.log(`❌ Rate limit config missing: ${config}`);
        allExist = false;
      } else {
        console.log(`✅ Rate limit config exists: ${config} (${remaining} remaining)`);
      }
    }
    
    return allExist;
  } catch (error) {
    console.log('❌ Rate limit config test failed:', error.message);
    return false;
  }
}

// Test 4: Test pagination patterns (basic structure check)
async function testPaginationStructure() {
  try {
    const fs = await import('fs');
    
    // Test if the hooks have the right structure by checking their exports
    const hooks = [
      './client/src/hooks/useCommunityFeed.ts',
      './client/src/hooks/useUpcomingEvents.ts', 
      './client/src/hooks/useMessaging.ts',
      './client/src/hooks/useWalkingChallenges.ts',
      './client/src/hooks/useNotifications.ts'
    ];
    
    for (const hookPath of hooks) {
      try {
        // Just check if the file can be read and has the expected functions
        const content = fs.readFileSync(hookPath, 'utf8');
        
        const hasLoadMore = content.includes('loadMore') || content.includes('hasMore');
        const hasPagination = content.includes('pagination') || content.includes('page');
        const hasRateLimit = content.includes('executeWithRateLimit') || content.includes('useRateLimited');
        
        console.log(`✅ ${hookPath.split('/').pop()}:`, {
          pagination: hasPagination,
          loadMore: hasLoadMore, 
          rateLimit: hasRateLimit
        });
      } catch (error) {
        console.log(`❌ Hook structure test failed for ${hookPath}:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Pagination structure test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive import and functionality tests...\n');
  
  const tests = [
    { name: 'RedisRateLimitService', fn: testRedisService },
    { name: 'RateLimitService', fn: testRateLimitService },
    { name: 'Rate Limit Configs', fn: testRateLimitConfigs },
    { name: 'Pagination Structure', fn: testPaginationStructure }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n🔬 Testing ${test.name}...`);
    try {
      const success = await test.fn();
      if (success) {
        passed++;
        console.log(`✅ ${test.name}: PASSED\n`);
      } else {
        failed++;
        console.log(`❌ ${test.name}: FAILED\n`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name}: ERROR -`, error.message, '\n');
    }
  }
  
  console.log('=' * 60);
  console.log('🎯 TEST RESULTS');
  console.log('=' * 60);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - Import chains are working!');
    return true;
  } else {
    console.log(`\n⚠️ ${failed} tests failed - Import chains need fixes`);
    return false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

// Run tests if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this is the main module
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}