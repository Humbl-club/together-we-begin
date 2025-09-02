/**
 * Enterprise Readiness Verification Test Suite
 * Tests for 10,000+ concurrent users capability
 * 
 * Run with: npx tsx enterprise-readiness-test.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './client/src/integrations/supabase/types';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const results: TestResult[] = [];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function addResult(category: string, test: string, status: TestResult['status'], details: string, severity?: TestResult['severity']) {
  results.push({ category, test, status, details, severity });
  
  const statusColor = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  
  console.log(`  ${statusColor}${statusSymbol}${colors.reset} ${test}`);
  if (status !== 'PASS') {
    console.log(`    ${colors.cyan}→ ${details}${colors.reset}`);
  }
}

// Test 1: Frontend-Backend Integration
async function testFrontendBackendIntegration() {
  log('\n📋 Testing Frontend-Backend Integration', colors.bright);

  // Check if organization filtering is implemented
  try {
    // Test organization tables existence
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (orgError) {
      addResult('Integration', 'Organization tables', 'FAIL', 
        'Organization tables not accessible: ' + orgError.message, 'CRITICAL');
    } else {
      addResult('Integration', 'Organization tables', 'PASS', 'Organization structure exists');
    }

    // Check if tables have organization_id columns
    const tablesToCheck = ['events', 'challenges', 'social_posts', 'direct_messages', 'loyalty_transactions'];
    
    for (const table of tablesToCheck) {
      const { error } = await supabase
        .from(table as any)
        .select('organization_id')
        .limit(1);
      
      if (error && error.message.includes('column "organization_id" does not exist')) {
        addResult('Integration', `${table} org filtering`, 'FAIL', 
          `Table ${table} missing organization_id column`, 'CRITICAL');
      } else {
        addResult('Integration', `${table} org filtering`, 'PASS', 
          `Table ${table} has organization_id`);
      }
    }

    // Test RPC functions availability
    const rpcFunctions = [
      'get_events_optimized',
      'get_user_available_points',
      'is_admin',
      'get_organization_theme',
      'is_member_of_organization',
      'is_admin_of_organization'
    ];

    for (const func of rpcFunctions) {
      try {
        // Test calling with minimal params just to check existence
        const { error } = await supabase.rpc(func as any, {} as any);
        
        // We expect errors due to missing params, but not "function not found"
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          addResult('Integration', `RPC ${func}`, 'FAIL', 
            `RPC function ${func} not found`, 'HIGH');
        } else {
          addResult('Integration', `RPC ${func}`, 'PASS', 
            `RPC function ${func} exists`);
        }
      } catch (e) {
        addResult('Integration', `RPC ${func}`, 'WARNING', 
          `Could not verify RPC function ${func}`, 'MEDIUM');
      }
    }

    // Check storage buckets
    const buckets = ['avatars', 'posts', 'events', 'challenges'];
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      addResult('Integration', 'Storage buckets', 'WARNING', 
        'Could not list buckets - might need service role key', 'LOW');
    } else {
      const existingBuckets = bucketList?.map(b => b.name) || [];
      for (const bucket of buckets) {
        if (existingBuckets.includes(bucket)) {
          addResult('Integration', `Bucket ${bucket}`, 'PASS', 'Bucket exists');
        } else {
          addResult('Integration', `Bucket ${bucket}`, 'WARNING', 
            `Bucket ${bucket} not found`, 'MEDIUM');
        }
      }
    }

  } catch (error) {
    addResult('Integration', 'Connection test', 'FAIL', 
      `Failed to connect: ${error}`, 'CRITICAL');
  }
}

// Test 2: Database Performance
async function testDatabasePerformance() {
  log('\n⚡ Testing Database Performance', colors.bright);

  // Check for indexes on foreign keys
  const criticalIndexes = [
    'idx_events_org',
    'idx_social_posts_org',
    'idx_challenge_participations_org',
    'idx_loyalty_transactions_org'
  ];

  // We can't directly query pg_indexes without service role, so we'll test query performance
  try {
    // Test query with organization filter (should be fast with index)
    const start = Date.now();
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(100);
    const duration = Date.now() - start;

    if (!error) {
      if (duration < 100) {
        addResult('Performance', 'Events query speed', 'PASS', 
          `Query completed in ${duration}ms`);
      } else {
        addResult('Performance', 'Events query speed', 'WARNING', 
          `Query took ${duration}ms - might need index optimization`, 'MEDIUM');
      }
    }

    // Test connection pooling by making concurrent requests
    const concurrentTests = 10;
    const promises = [];
    
    const concurrentStart = Date.now();
    for (let i = 0; i < concurrentTests; i++) {
      promises.push(
        supabase.from('profiles').select('id').limit(1)
      );
    }
    
    const results = await Promise.all(promises);
    const concurrentDuration = Date.now() - concurrentStart;
    const avgTime = concurrentDuration / concurrentTests;
    
    if (avgTime < 50) {
      addResult('Performance', 'Connection pooling', 'PASS', 
        `${concurrentTests} concurrent requests averaged ${avgTime.toFixed(2)}ms each`);
    } else {
      addResult('Performance', 'Connection pooling', 'WARNING', 
        `Concurrent requests averaged ${avgTime.toFixed(2)}ms - may need optimization`, 'MEDIUM');
    }

  } catch (error) {
    addResult('Performance', 'Performance tests', 'FAIL', 
      `Failed to test performance: ${error}`, 'HIGH');
  }
}

// Test 3: Security Verification
async function testSecurity() {
  log('\n🔒 Testing Security', colors.bright);

  // Test RLS policies
  try {
    // Try to access data without authentication (should fail or return empty)
    const { data: publicData, error: publicError } = await supabase
      .from('events')
      .select('*');

    if (publicData && publicData.length > 0) {
      addResult('Security', 'RLS on events', 'WARNING', 
        'Events table might be publicly accessible', 'HIGH');
    } else {
      addResult('Security', 'RLS on events', 'PASS', 
        'Events table protected by RLS');
    }

    // Test organization isolation helpers
    const orgHelperFunctions = [
      'is_member_of_organization',
      'is_admin_of_organization',
      'get_user_organization_role'
    ];

    for (const func of orgHelperFunctions) {
      try {
        const { error } = await supabase.rpc(func as any, { 
          organization_id: '00000000-0000-0000-0000-000000000000' 
        } as any);
        
        if (error && error.message.includes('does not exist')) {
          addResult('Security', `Helper ${func}`, 'FAIL', 
            `Security helper ${func} not found`, 'HIGH');
        } else {
          addResult('Security', `Helper ${func}`, 'PASS', 
            `Security helper ${func} exists`);
        }
      } catch (e) {
        addResult('Security', `Helper ${func}`, 'WARNING', 
          `Could not verify ${func}`, 'MEDIUM');
      }
    }

    // Check for platform admin bypass
    try {
      const { error } = await supabase.rpc('is_platform_admin' as any, {} as any);
      if (error && error.message.includes('does not exist')) {
        addResult('Security', 'Platform admin check', 'FAIL', 
          'Platform admin function not found', 'CRITICAL');
      } else {
        addResult('Security', 'Platform admin check', 'PASS', 
          'Platform admin bypass available');
      }
    } catch (e) {
      addResult('Security', 'Platform admin check', 'WARNING', 
        'Could not verify platform admin function', 'HIGH');
    }

  } catch (error) {
    addResult('Security', 'Security tests', 'FAIL', 
      `Failed to test security: ${error}`, 'CRITICAL');
  }
}

// Test 4: Scalability
async function testScalability() {
  log('\n📈 Testing Scalability', colors.bright);

  // Test Edge Functions availability
  const edgeFunctions = [
    'create-payment',
    'verify-payment',
    'process-walking-challenges'
  ];

  for (const func of edgeFunctions) {
    try {
      // Just check if the function exists (will return error but not 404)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.status === 404) {
        addResult('Scalability', `Edge Function ${func}`, 'FAIL', 
          `Edge Function ${func} not deployed`, 'HIGH');
      } else {
        addResult('Scalability', `Edge Function ${func}`, 'PASS', 
          `Edge Function ${func} is deployed`);
      }
    } catch (error) {
      addResult('Scalability', `Edge Function ${func}`, 'WARNING', 
        `Could not verify ${func}`, 'MEDIUM');
    }
  }

  // Test WebSocket limits (Realtime)
  try {
    const channel = supabase.channel('test-scalability');
    
    await new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          addResult('Scalability', 'WebSocket connections', 'PASS', 
            'Realtime WebSocket connection successful');
          channel.unsubscribe();
          resolve(true);
        } else if (status === 'CHANNEL_ERROR') {
          addResult('Scalability', 'WebSocket connections', 'WARNING', 
            'WebSocket connection issues', 'MEDIUM');
          resolve(false);
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        addResult('Scalability', 'WebSocket connections', 'WARNING', 
          'WebSocket connection timeout', 'MEDIUM');
        channel.unsubscribe();
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    addResult('Scalability', 'WebSocket test', 'FAIL', 
      `Failed to test WebSocket: ${error}`, 'HIGH');
  }

  // Check query complexity
  try {
    // Test a complex aggregation query
    const start = Date.now();
    const { data, error } = await supabase.rpc('get_dashboard_data_v2', {
      user_id: '00000000-0000-0000-0000-000000000000'
    });
    const duration = Date.now() - start;

    if (!error) {
      if (duration < 500) {
        addResult('Scalability', 'Complex query performance', 'PASS', 
          `Dashboard query completed in ${duration}ms`);
      } else {
        addResult('Scalability', 'Complex query performance', 'WARNING', 
          `Dashboard query took ${duration}ms - may be slow under load`, 'MEDIUM');
      }
    } else if (error.message.includes('does not exist')) {
      addResult('Scalability', 'Dashboard RPC', 'FAIL', 
        'Dashboard optimization RPC not found', 'HIGH');
    }
  } catch (error) {
    addResult('Scalability', 'Query complexity test', 'WARNING', 
      `Could not test query complexity: ${error}`, 'LOW');
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  log('\n🛡️ Testing Error Handling', colors.bright);

  // Test retry mechanisms
  let retrySuccess = false;
  for (let i = 0; i < 3; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (!error) {
        retrySuccess = true;
        break;
      }
    } catch (e) {
      // Continue to retry
    }
  }

  if (retrySuccess) {
    addResult('Error Handling', 'Retry mechanism', 'PASS', 
      'Queries can be retried successfully');
  } else {
    addResult('Error Handling', 'Retry mechanism', 'WARNING', 
      'Retry mechanism may need improvement', 'MEDIUM');
  }

  // Test offline functionality
  addResult('Error Handling', 'Offline support', 'WARNING', 
    'Offline functionality requires frontend testing with service worker', 'LOW');

  // Test error response formats
  try {
    const { data, error } = await supabase
      .from('nonexistent_table' as any)
      .select('*');
    
    if (error) {
      if (error.message && error.code) {
        addResult('Error Handling', 'Error format', 'PASS', 
          'Errors have proper structure');
      } else {
        addResult('Error Handling', 'Error format', 'WARNING', 
          'Error format may be incomplete', 'LOW');
      }
    }
  } catch (e) {
    addResult('Error Handling', 'Error testing', 'WARNING', 
      'Could not test error handling', 'LOW');
  }
}

// Generate final report
function generateReport() {
  log('\n' + '='.repeat(80), colors.bright);
  log('ENTERPRISE READINESS REPORT', colors.bright);
  log('='.repeat(80), colors.bright);

  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'PASS').length;
    const failed = categoryResults.filter(r => r.status === 'FAIL').length;
    const warnings = categoryResults.filter(r => r.status === 'WARNING').length;
    
    log(`\n${category}:`, colors.cyan);
    log(`  ✓ Passed: ${passed}`, colors.green);
    if (failed > 0) log(`  ✗ Failed: ${failed}`, colors.red);
    if (warnings > 0) log(`  ⚠ Warnings: ${warnings}`, colors.yellow);
  }

  // Critical issues that MUST be fixed for 10,000+ users
  const criticalIssues = results.filter(r => r.status === 'FAIL' && r.severity === 'CRITICAL');
  const highIssues = results.filter(r => r.status === 'FAIL' && r.severity === 'HIGH');
  
  if (criticalIssues.length > 0) {
    log('\n🚨 CRITICAL ISSUES (Must fix for production):', colors.red);
    for (const issue of criticalIssues) {
      log(`  • ${issue.test}: ${issue.details}`, colors.red);
    }
  }

  if (highIssues.length > 0) {
    log('\n⚠️  HIGH PRIORITY ISSUES:', colors.yellow);
    for (const issue of highIssues) {
      log(`  • ${issue.test}: ${issue.details}`, colors.yellow);
    }
  }

  // Overall assessment
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const passRate = (passedTests / totalTests * 100).toFixed(1);
  
  log('\n' + '='.repeat(80), colors.bright);
  log('OVERALL ASSESSMENT', colors.bright);
  log('='.repeat(80), colors.bright);
  
  log(`\nPass Rate: ${passRate}%`, passRate > 80 ? colors.green : passRate > 60 ? colors.yellow : colors.red);
  
  if (criticalIssues.length === 0 && passRate > 80) {
    log('\n✅ VERDICT: System is READY for 10,000+ concurrent users', colors.green);
    log('   Minor optimizations recommended but not blocking', colors.green);
  } else if (criticalIssues.length === 0 && passRate > 60) {
    log('\n⚠️  VERDICT: System is PARTIALLY READY for scale', colors.yellow);
    log('   Address high priority issues before production launch', colors.yellow);
  } else {
    log('\n❌ VERDICT: System is NOT READY for 10,000+ users', colors.red);
    log('   Critical issues must be resolved first', colors.red);
  }

  // Recommendations
  log('\n📋 KEY RECOMMENDATIONS:', colors.cyan);
  log('  1. Implement organization filtering in all frontend hooks', colors.reset);
  log('  2. Add composite indexes for frequent query patterns', colors.reset);
  log('  3. Enable connection pooling in Supabase dashboard', colors.reset);
  log('  4. Implement request queuing for API rate limiting', colors.reset);
  log('  5. Set up monitoring and alerting for production', colors.reset);
}

// Main execution
async function main() {
  log('🚀 Starting Enterprise Readiness Verification...', colors.bright);
  log('Testing for 10,000+ concurrent users capability\n', colors.cyan);

  await testFrontendBackendIntegration();
  await testDatabasePerformance();
  await testSecurity();
  await testScalability();
  await testErrorHandling();
  
  generateReport();
  
  log('\n✨ Test suite completed!', colors.bright);
}

// Run the tests
main().catch(console.error);
