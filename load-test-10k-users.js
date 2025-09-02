#!/usr/bin/env node
/**
 * Load Testing Script for 10,000 Concurrent Users
 * Tests all critical system components under high load
 * 
 * Run with: node load-test-10k-users.js
 * 
 * IMPORTANT: Only run this against your own test environment!
 * Do NOT run against production without proper authorization.
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  TARGET_USERS: 10000,
  CONCURRENT_BATCHES: 50,    // Process users in batches
  BATCH_SIZE: 200,           // Users per batch
  TEST_DURATION_MS: 300000,  // 5 minutes
  
  // Supabase configuration (replace with your test environment)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  
  // Test scenarios with realistic usage patterns
  SCENARIOS: [
    { name: 'dashboard_load', weight: 30, endpoint: '/rest/v1/social_posts', method: 'GET' },
    { name: 'create_post', weight: 15, endpoint: '/rest/v1/social_posts', method: 'POST' },
    { name: 'send_message', weight: 20, endpoint: '/rest/v1/direct_messages', method: 'POST' },
    { name: 'join_challenge', weight: 10, endpoint: '/rest/v1/challenge_participations', method: 'POST' },
    { name: 'view_events', weight: 15, endpoint: '/rest/v1/events', method: 'GET' },
    { name: 'update_profile', weight: 5, endpoint: '/rest/v1/profiles', method: 'PATCH' },
    { name: 'check_notifications', weight: 5, endpoint: '/rest/v1/notifications', method: 'GET' }
  ]
};

// Test results tracking
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitedRequests: 0,
  averageResponseTime: 0,
  errors: new Map(),
  responseTimes: [],
  startTime: Date.now(),
  endTime: null
};

// Simulated user class
class VirtualUser {
  constructor(userId, orgId) {
    this.userId = userId;
    this.orgId = orgId;
    this.sessionToken = this.generateSessionToken();
    this.requestCount = 0;
    this.errors = [];
  }
  
  generateSessionToken() {
    // Simulate JWT token
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({
      sub: this.userId,
      org_id: this.orgId,
      exp: Date.now() + 3600000 // 1 hour
    })).toString('base64')}.signature`;
  }
  
  async makeRequest(scenario) {
    const startTime = performance.now();
    
    try {
      const response = await this.httpRequest(scenario);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      results.totalRequests++;
      results.responseTimes.push(responseTime);
      this.requestCount++;
      
      if (response.statusCode === 429) {
        results.rateLimitedRequests++;
        console.log(`⚠️ User ${this.userId}: Rate limited on ${scenario.name}`);
      } else if (response.statusCode >= 200 && response.statusCode < 300) {
        results.successfulRequests++;
      } else {
        results.failedRequests++;
        this.errors.push(`${scenario.name}: ${response.statusCode}`);
      }
      
      return { success: true, responseTime, statusCode: response.statusCode };
    } catch (error) {
      results.failedRequests++;
      results.totalRequests++;
      this.errors.push(`${scenario.name}: ${error.message}`);
      
      const errorKey = error.code || 'UNKNOWN';
      results.errors.set(errorKey, (results.errors.get(errorKey) || 0) + 1);
      
      return { success: false, error: error.message };
    }
  }
  
  httpRequest(scenario) {
    return new Promise((resolve, reject) => {
      const url = new URL(scenario.endpoint, CONFIG.SUPABASE_URL);
      
      // Add realistic query parameters
      if (scenario.method === 'GET') {
        url.searchParams.set('organization_id', `eq.${this.orgId}`);
        url.searchParams.set('limit', '20');
        url.searchParams.set('offset', '0');
        url.searchParams.set('order', 'created_at.desc');
      }
      
      const options = {
        method: scenario.method,
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'User-Agent': `LoadTest/1.0 (User-${this.userId})`
        },
        timeout: 30000 // 30 second timeout
      };
      
      // Add realistic payload for POST requests
      let postData = null;
      if (scenario.method === 'POST') {
        const payload = this.generatePayload(scenario.name);
        postData = JSON.stringify(payload);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }
  
  generatePayload(scenarioName) {
    const basePayload = {
      organization_id: this.orgId,
      user_id: this.userId,
      created_at: new Date().toISOString()
    };
    
    switch (scenarioName) {
      case 'create_post':
        return {
          ...basePayload,
          content: `Load test post from user ${this.userId} at ${Date.now()}`,
          type: 'text',
          status: 'active'
        };
      case 'send_message':
        return {
          ...basePayload,
          content: `Test message ${Date.now()}`,
          recipient_id: `test-recipient-${Math.floor(Math.random() * 1000)}`,
          sender_id: this.userId,
          message_type: 'text'
        };
      case 'join_challenge':
        return {
          ...basePayload,
          challenge_id: `test-challenge-${Math.floor(Math.random() * 10)}`,
          joined_at: new Date().toISOString()
        };
      case 'update_profile':
        return {
          full_name: `Load Test User ${this.userId}`,
          bio: `Updated at ${Date.now()}`,
          location: `Test City ${Math.floor(Math.random() * 100)}`
        };
      default:
        return basePayload;
    }
  }
}

// Test orchestrator
class LoadTestOrchestrator {
  constructor() {
    this.users = [];
    this.running = false;
    this.intervals = [];
  }
  
  async initialize() {
    console.log('🚀 Initializing 10K user load test...');
    console.log(`Target: ${CONFIG.TARGET_USERS.toLocaleString()} concurrent users`);
    console.log(`Duration: ${CONFIG.TEST_DURATION_MS / 1000} seconds`);
    console.log(`Batches: ${CONFIG.CONCURRENT_BATCHES} x ${CONFIG.BATCH_SIZE} users\n`);
    
    // Create virtual users distributed across organizations
    for (let i = 0; i < CONFIG.TARGET_USERS; i++) {
      const userId = `load-test-user-${i + 1}`;
      const orgId = `org-${Math.floor(i / 100) + 1}`; // 100 users per org
      
      this.users.push(new VirtualUser(userId, orgId));
      
      if ((i + 1) % 1000 === 0) {
        console.log(`📝 Created ${i + 1} virtual users...`);
      }
    }
    
    console.log(`✅ ${this.users.length} virtual users ready\n`);
  }
  
  selectScenario() {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const scenario of CONFIG.SCENARIOS) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }
    
    return CONFIG.SCENARIOS[0]; // Fallback
  }
  
  async startLoadTest() {
    this.running = true;
    results.startTime = Date.now();
    
    console.log('🔥 STARTING LOAD TEST - 10K CONCURRENT USERS');
    console.log('=' * 60);
    
    // Start progress reporting
    this.startProgressReporting();
    
    // Create batches of concurrent users
    const promises = [];
    
    for (let batch = 0; batch < CONFIG.CONCURRENT_BATCHES; batch++) {
      const batchStart = batch * CONFIG.BATCH_SIZE;
      const batchEnd = Math.min(batchStart + CONFIG.BATCH_SIZE, CONFIG.TARGET_USERS);
      const batchUsers = this.users.slice(batchStart, batchEnd);
      
      // Start batch with slight delay to avoid thundering herd
      const batchPromise = new Promise(resolve => {
        setTimeout(() => {
          resolve(this.runUserBatch(batchUsers, batch));
        }, batch * 100); // 100ms delay between batches
      });
      
      promises.push(batchPromise);
    }
    
    // Wait for all batches to complete or timeout
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        this.running = false;
        resolve('TIMEOUT');
      }, CONFIG.TEST_DURATION_MS);
    });
    
    await Promise.race([Promise.all(promises), timeoutPromise]);
    
    this.running = false;
    results.endTime = Date.now();
    
    // Stop progress reporting
    this.intervals.forEach(interval => clearInterval(interval));
    
    this.generateReport();
  }
  
  async runUserBatch(users, batchId) {
    console.log(`🏃 Starting batch ${batchId + 1} with ${users.length} users`);
    
    const userPromises = users.map(user => this.simulateUserActivity(user));
    
    try {
      await Promise.allSettled(userPromises);
      console.log(`✅ Batch ${batchId + 1} completed`);
    } catch (error) {
      console.error(`❌ Batch ${batchId + 1} failed:`, error.message);
    }
  }
  
  async simulateUserActivity(user) {
    const activities = Math.floor(Math.random() * 10) + 5; // 5-15 activities per user
    
    for (let i = 0; i < activities && this.running; i++) {
      const scenario = this.selectScenario();
      await user.makeRequest(scenario);
      
      // Random delay between requests (0.5-3 seconds)
      const delay = Math.random() * 2500 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  startProgressReporting() {
    const reportInterval = setInterval(() => {
      if (!this.running) return;
      
      const elapsed = (Date.now() - results.startTime) / 1000;
      const rps = results.totalRequests / elapsed;
      const successRate = (results.successfulRequests / results.totalRequests * 100).toFixed(1);
      const avgResponseTime = results.responseTimes.length > 0 
        ? (results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length).toFixed(2)
        : 0;
      
      process.stdout.write(`\r📊 ${elapsed.toFixed(0)}s | RPS: ${rps.toFixed(1)} | Success: ${successRate}% | Avg: ${avgResponseTime}ms | Total: ${results.totalRequests}`);
    }, 2000);
    
    this.intervals.push(reportInterval);
  }
  
  generateReport() {
    console.log('\n\n' + '='.repeat(80));
    console.log('🎯 LOAD TEST RESULTS - 10,000 USER SIMULATION');
    console.log('='.repeat(80));
    
    const duration = (results.endTime - results.startTime) / 1000;
    const rps = results.totalRequests / duration;
    const successRate = (results.successfulRequests / results.totalRequests * 100).toFixed(1);
    
    // Calculate response time percentiles
    const sortedTimes = results.responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    const avgTime = sortedTimes.length > 0 ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length : 0;
    
    console.log(`\n📈 PERFORMANCE METRICS`);
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);
    console.log(`   Total Requests: ${results.totalRequests.toLocaleString()}`);
    console.log(`   Requests/Second: ${rps.toFixed(2)}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Rate Limited: ${results.rateLimitedRequests} (${(results.rateLimitedRequests/results.totalRequests*100).toFixed(1)}%)`);
    
    console.log(`\n⚡ RESPONSE TIMES`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   50th percentile: ${p50.toFixed(2)}ms`);
    console.log(`   95th percentile: ${p95.toFixed(2)}ms`);
    console.log(`   99th percentile: ${p99.toFixed(2)}ms`);
    
    console.log(`\n📊 REQUEST BREAKDOWN`);
    console.log(`   ✅ Successful: ${results.successfulRequests.toLocaleString()}`);
    console.log(`   ❌ Failed: ${results.failedRequests.toLocaleString()}`);
    console.log(`   🚫 Rate Limited: ${results.rateLimitedRequests.toLocaleString()}`);
    
    if (results.errors.size > 0) {
      console.log(`\n⚠️ ERROR BREAKDOWN`);
      for (const [error, count] of results.errors.entries()) {
        console.log(`   ${error}: ${count}`);
      }
    }
    
    // Performance assessment
    console.log(`\n🎯 SCALABILITY ASSESSMENT`);
    
    const assessments = [
      { metric: 'RPS', value: rps, target: 1000, unit: 'req/s' },
      { metric: 'Success Rate', value: parseFloat(successRate), target: 95, unit: '%' },
      { metric: 'Avg Response Time', value: avgTime, target: 200, unit: 'ms', reverse: true },
      { metric: 'P95 Response Time', value: p95, target: 500, unit: 'ms', reverse: true }
    ];
    
    assessments.forEach(({ metric, value, target, unit, reverse }) => {
      const passed = reverse ? value <= target : value >= target;
      const icon = passed ? '✅' : '❌';
      console.log(`   ${icon} ${metric}: ${value.toFixed(2)}${unit} (target: ${reverse ? '≤' : '≥'}${target}${unit})`);
    });
    
    const overallPassed = assessments.every(({ value, target, reverse }) => 
      reverse ? value <= target : value >= target
    );
    
    console.log(`\n${overallPassed ? '🎉' : '⚠️'} OVERALL RESULT: ${overallPassed ? 'SYSTEM CAN HANDLE 10K USERS' : 'OPTIMIZATION NEEDED'}`);
    
    if (!overallPassed) {
      console.log(`\n🔧 OPTIMIZATION RECOMMENDATIONS:`);
      console.log(`   • Apply database indexes (run APPLY_INDEXES_MANUAL.sql)`);
      console.log(`   • Set up Redis for distributed rate limiting`);
      console.log(`   • Enable connection pooling in Supabase`);
      console.log(`   • Consider horizontal scaling with load balancer`);
      console.log(`   • Monitor database query performance`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  console.log('🧪 10K User Load Test Starting...\n');
  
  // Check environment
  if (!CONFIG.SUPABASE_URL.includes('supabase.co')) {
    console.error('❌ Please set SUPABASE_URL environment variable');
    process.exit(1);
  }
  
  if (!CONFIG.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY.includes('your-')) {
    console.error('❌ Please set SUPABASE_ANON_KEY environment variable');
    process.exit(1);
  }
  
  const orchestrator = new LoadTestOrchestrator();
  
  try {
    await orchestrator.initialize();
    await orchestrator.startLoadTest();
  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down load test...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down load test...');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LoadTestOrchestrator, VirtualUser };
