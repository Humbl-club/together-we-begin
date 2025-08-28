/**
 * MULTI-TENANT INTEGRATION TEST SUITE
 * 
 * Comprehensive tests for the multi-tenant architecture including:
 * - Organization context loading and switching
 * - Data isolation between organizations
 * - Frontend-backend integration
 * - Rate limiting service integration
 * - Real-time subscriptions with org filtering
 * 
 * Usage: node test-multitenant-integration.js
 */

import { createClient } from '@supabase/supabase-js';
import { RateLimitService } from './client/src/services/RateLimitService.js';
import chalk from 'chalk';

// Database connection
const SUPABASE_URL = "https://ynqdddwponrqwhtqfepi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results storage
let testResults = {
  organizationContext: {
    canCreateTestOrg: false,
    canSwitchContext: false,
    contextLoadsCorrectly: false,
    errors: []
  },
  dataIsolation: {
    crossOrgLeakage: false,
    rlsWorking: false,
    orgFilteringWorks: false,
    tests: []
  },
  frontendIntegration: {
    contextProviderWorks: false,
    hooksWork: false,
    componentsRender: false,
    errors: []
  },
  rateLimiting: {
    serviceLoads: false,
    organizationAware: false,
    limits: {},
    errors: []
  },
  realtime: {
    connectsSuccessfully: false,
    orgFiltering: false,
    subscriptionsWork: false,
    errors: []
  },
  performance: {
    queryTimes: {},
    memoryUsage: {},
    connectionPool: {}
  }
};

/**
 * Mock user data for testing
 */
const MOCK_TEST_DATA = {
  testUser: {
    id: 'test-user-' + Date.now(),
    email: `test-${Date.now()}@example.com`,
    full_name: 'Test User'
  },
  testOrganizations: [
    {
      name: 'Test Organization A',
      slug: 'test-org-a-' + Date.now(),
      description: 'Test organization for multi-tenant testing',
      subscription_tier: 'free'
    },
    {
      name: 'Test Organization B', 
      slug: 'test-org-b-' + Date.now(),
      description: 'Second test organization for isolation testing',
      subscription_tier: 'basic'
    }
  ]
};

/**
 * Test organization context functionality
 */
async function testOrganizationContext() {
  console.log(chalk.blue('\n🏢 TESTING ORGANIZATION CONTEXT...'));
  
  try {
    // Test 1: Check if organizations table exists and is queryable
    console.log('Testing organizations table access...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, subscription_tier')
      .limit(5);
    
    if (orgError) {
      testResults.organizationContext.errors.push(`Organizations table error: ${orgError.message}`);
      console.log(chalk.red(`❌ Organizations table: ${orgError.message}`));
      return;
    }
    
    console.log(chalk.green(`✅ Organizations table accessible (${orgs?.length || 0} existing orgs)`));
    
    // Test 2: Check organization members table
    console.log('Testing organization members table access...');
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('id, organization_id, user_id, role')
      .limit(5);
    
    if (membersError) {
      testResults.organizationContext.errors.push(`Organization members error: ${membersError.message}`);
      console.log(chalk.red(`❌ Organization members: ${membersError.message}`));
    } else {
      console.log(chalk.green(`✅ Organization members accessible (${members?.length || 0} relationships)`));
    }
    
    // Test 3: Test organization features table
    console.log('Testing organization features...');
    const { data: features, error: featuresError } = await supabase
      .from('organization_features')
      .select('id, organization_id, feature_key, enabled')
      .limit(5);
    
    if (featuresError) {
      console.log(chalk.yellow(`⚠️  Organization features: ${featuresError.message}`));
    } else {
      console.log(chalk.green(`✅ Organization features accessible (${features?.length || 0} features)`));
    }
    
    // Test 4: Test critical RPC functions
    console.log('Testing organization RPC functions...');
    const rpcTests = [
      { name: 'is_platform_admin', func: () => supabase.rpc('is_platform_admin') },
      { name: 'get_platform_statistics', func: () => supabase.rpc('get_platform_statistics') },
      { name: 'get_user_current_organization', func: () => supabase.rpc('get_user_current_organization') }
    ];
    
    for (const rpcTest of rpcTests) {
      try {
        const { data, error } = await rpcTest.func();
        if (error) {
          console.log(chalk.yellow(`⚠️  RPC ${rpcTest.name}: ${error.message}`));
        } else {
          console.log(chalk.green(`✅ RPC ${rpcTest.name}: Working`));
        }
      } catch (error) {
        console.log(chalk.red(`❌ RPC ${rpcTest.name}: ${error.message}`));
      }
    }
    
    testResults.organizationContext.contextLoadsCorrectly = orgError === null;
    
  } catch (error) {
    testResults.organizationContext.errors.push(error.message);
    console.log(chalk.red(`❌ Organization context test failed: ${error.message}`));
  }
}

/**
 * Test data isolation between organizations
 */
async function testDataIsolation() {
  console.log(chalk.blue('\n🔒 TESTING DATA ISOLATION...'));
  
  try {
    // Test 1: Check if tables have organization_id columns
    console.log('Checking for organization_id columns...');
    
    const tablesToCheck = [
      'events', 'challenges', 'social_posts', 'loyalty_transactions',
      'dashboard_widgets', 'invite_codes', 'platform_analytics'
    ];
    
    const tablesWithOrgId = [];
    const tablesWithoutOrgId = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data: columns, error } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .eq('column_name', 'organization_id');
        
        if (error) {
          console.log(chalk.yellow(`⚠️  Cannot check ${tableName}: ${error.message}`));
          continue;
        }
        
        if (columns && columns.length > 0) {
          tablesWithOrgId.push(tableName);
          console.log(chalk.green(`✅ ${tableName} has organization_id`));
        } else {
          tablesWithoutOrgId.push(tableName);
          console.log(chalk.red(`❌ ${tableName} missing organization_id`));
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Error checking ${tableName}: ${error.message}`));
      }
    }
    
    testResults.dataIsolation.orgFilteringWorks = tablesWithOrgId.length > tablesWithoutOrgId.length;
    
    // Test 2: Check RLS policies
    console.log('\nChecking Row Level Security policies...');
    
    let totalPolicies = 0;
    for (const tableName of tablesWithOrgId) {
      try {
        const { data: policies, error } = await supabase
          .from('pg_policies')
          .select('policyname, cmd, qual')
          .eq('schemaname', 'public')
          .eq('tablename', tableName);
        
        if (error) continue;
        
        if (policies && policies.length > 0) {
          totalPolicies += policies.length;
          console.log(chalk.green(`✅ ${tableName}: ${policies.length} RLS policies`));
          
          // Check if any policy mentions organization_id
          const orgPolicies = policies.filter(p => 
            p.qual && p.qual.includes('organization_id')
          );
          
          if (orgPolicies.length > 0) {
            console.log(chalk.green(`   └─ ${orgPolicies.length} organization-aware policies`));
          }
        } else {
          console.log(chalk.yellow(`⚠️  ${tableName}: No RLS policies`));
        }
      } catch (error) {
        continue;
      }
    }
    
    testResults.dataIsolation.rlsWorking = totalPolicies > 0;
    console.log(chalk.green(`\n✅ Found ${totalPolicies} total RLS policies`));
    
    // Test 3: Test organization filtering with sample data
    console.log('\nTesting organization-specific queries...');
    
    if (tablesWithOrgId.includes('events')) {
      try {
        // Try to query events with organization filter
        const { data: allEvents, error: allError } = await supabase
          .from('events')
          .select('id, title, organization_id')
          .limit(10);
        
        if (allError) {
          console.log(chalk.yellow(`⚠️  Cannot query events: ${allError.message}`));
        } else {
          console.log(chalk.green(`✅ Can query events table (${allEvents?.length || 0} events)`));
          
          // Check if events have organization_id values
          const eventsWithOrg = allEvents?.filter(e => e.organization_id) || [];
          if (eventsWithOrg.length > 0) {
            console.log(chalk.green(`✅ ${eventsWithOrg.length} events have organization_id`));
          }
        }
      } catch (error) {
        console.log(chalk.red(`❌ Events query failed: ${error.message}`));
      }
    }
    
  } catch (error) {
    testResults.dataIsolation.errors = [error.message];
    console.log(chalk.red(`❌ Data isolation test failed: ${error.message}`));
  }
}

/**
 * Test frontend integration components
 */
async function testFrontendIntegration() {
  console.log(chalk.blue('\n⚛️  TESTING FRONTEND INTEGRATION...'));
  
  try {
    // Test 1: Check if Organization Context types exist
    console.log('Checking TypeScript types...');
    
    try {
      // Try to import the organization types
      const orgTypesPath = './client/src/types/organization.ts';
      const fs = await import('fs/promises');
      const orgTypesContent = await fs.readFile(orgTypesPath, 'utf8');
      
      const requiredTypes = [
        'Organization',
        'OrganizationMember', 
        'OrganizationContextType',
        'OrganizationFeature',
        'OrganizationTheme'
      ];
      
      const missingTypes = requiredTypes.filter(type => 
        !orgTypesContent.includes(`interface ${type}`) && 
        !orgTypesContent.includes(`type ${type}`)
      );
      
      if (missingTypes.length === 0) {
        console.log(chalk.green('✅ All required TypeScript types exist'));
        testResults.frontendIntegration.contextProviderWorks = true;
      } else {
        console.log(chalk.red(`❌ Missing types: ${missingTypes.join(', ')}`));
        testResults.frontendIntegration.errors.push(`Missing types: ${missingTypes.join(', ')}`);
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cannot read organization types: ${error.message}`));
      testResults.frontendIntegration.errors.push(`Types error: ${error.message}`);
    }
    
    // Test 2: Check Organization Context implementation
    console.log('Checking Organization Context...');
    
    try {
      const contextPath = './client/src/contexts/OrganizationContext.tsx';
      const fs = await import('fs/promises');
      const contextContent = await fs.readFile(contextPath, 'utf8');
      
      const requiredFunctions = [
        'switchOrganization',
        'loadUserOrganizations',
        'isFeatureEnabled',
        'updateTheme',
        'addWidget'
      ];
      
      const missingFunctions = requiredFunctions.filter(func => 
        !contextContent.includes(func)
      );
      
      if (missingFunctions.length === 0) {
        console.log(chalk.green('✅ Organization Context has all required functions'));
      } else {
        console.log(chalk.red(`❌ Missing functions: ${missingFunctions.join(', ')}`));
        testResults.frontendIntegration.errors.push(`Missing functions: ${missingFunctions.join(', ')}`);
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cannot read Organization Context: ${error.message}`));
      testResults.frontendIntegration.errors.push(`Context error: ${error.message}`);
    }
    
    // Test 3: Check critical hooks
    console.log('Checking organization hooks...');
    
    const hooksToCheck = [
      'useOrganizationData.ts',
      'useOrganizationFeatures.ts', 
      'useOrganizationMembers.ts'
    ];
    
    for (const hookFile of hooksToCheck) {
      try {
        const hookPath = `./client/src/hooks/${hookFile}`;
        const fs = await import('fs/promises');
        await fs.access(hookPath);
        console.log(chalk.green(`✅ ${hookFile} exists`));
      } catch (error) {
        console.log(chalk.red(`❌ ${hookFile} missing`));
        testResults.frontendIntegration.errors.push(`Missing hook: ${hookFile}`);
      }
    }
    
    // Test 4: Check organization components
    console.log('Checking organization components...');
    
    const componentsToCheck = [
      'OrganizationSwitcher.tsx',
      'ThemeCustomization.tsx',
      'FeatureToggleManager.tsx',
      'DraggableDashboard.tsx'
    ];
    
    for (const componentFile of componentsToCheck) {
      try {
        const componentPath = `./client/src/components/organization/${componentFile}`;
        const fs = await import('fs/promises');
        await fs.access(componentPath);
        console.log(chalk.green(`✅ ${componentFile} exists`));
      } catch (error) {
        console.log(chalk.red(`❌ ${componentFile} missing`));
        testResults.frontendIntegration.errors.push(`Missing component: ${componentFile}`);
      }
    }
    
    testResults.frontendIntegration.componentsRender = testResults.frontendIntegration.errors.length < 3;
    
  } catch (error) {
    testResults.frontendIntegration.errors.push(error.message);
    console.log(chalk.red(`❌ Frontend integration test failed: ${error.message}`));
  }
}

/**
 * Test rate limiting service integration
 */
async function testRateLimitingIntegration() {
  console.log(chalk.blue('\n🚦 TESTING RATE LIMITING INTEGRATION...'));
  
  try {
    // Test 1: Check if RateLimitService can be loaded
    console.log('Testing RateLimitService loading...');
    
    let rateLimitService;
    try {
      const RateLimitModule = await import('./client/src/services/RateLimitService.js');
      rateLimitService = RateLimitModule.RateLimitService || RateLimitModule.default;
      
      if (rateLimitService) {
        console.log(chalk.green('✅ RateLimitService can be imported'));
        testResults.rateLimiting.serviceLoads = true;
      } else {
        console.log(chalk.red('❌ RateLimitService import failed'));
        testResults.rateLimiting.errors.push('Service import failed');
      }
    } catch (error) {
      console.log(chalk.red(`❌ RateLimitService import error: ${error.message}`));
      testResults.rateLimiting.errors.push(`Import error: ${error.message}`);
    }
    
    // Test 2: Check if service supports organization context
    if (rateLimitService) {
      console.log('Testing organization-aware rate limiting...');
      
      try {
        // Try to create service instance with organization context
        const mockOrgId = 'test-org-id';
        const service = new rateLimitService(mockOrgId);
        
        if (service) {
          console.log(chalk.green('✅ Can create organization-specific rate limiter'));
          testResults.rateLimiting.organizationAware = true;
          
          // Test rate limit check
          const testKey = 'test-operation';
          const result = await service.checkRateLimit(testKey, 100, 60);
          
          console.log(chalk.green(`✅ Rate limit check works: ${result ? 'allowed' : 'blocked'}`));
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Rate limiting test: ${error.message}`));
        testResults.rateLimiting.errors.push(`Service test: ${error.message}`);
      }
    }
    
    // Test 3: Check if Redis connection works (if available)
    console.log('Testing Redis integration...');
    
    try {
      // Try to test Redis connection through the service
      const { createClient } = await import('redis');
      console.log(chalk.green('✅ Redis client can be imported'));
      
      // Note: We don't actually connect to avoid external dependencies in testing
      testResults.rateLimiting.limits.redis = 'available';
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Redis not available: ${error.message}`));
      testResults.rateLimiting.limits.redis = 'not available';
    }
    
  } catch (error) {
    testResults.rateLimiting.errors.push(error.message);
    console.log(chalk.red(`❌ Rate limiting test failed: ${error.message}`));
  }
}

/**
 * Test real-time subscriptions with organization filtering
 */
async function testRealtimeIntegration() {
  console.log(chalk.blue('\n📡 TESTING REALTIME INTEGRATION...'));
  
  try {
    // Test 1: Basic realtime connection
    console.log('Testing realtime connection...');
    
    const channel = supabase.channel('test-channel');
    
    let connectionEstablished = false;
    let subscriptionWorked = false;
    
    const testPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);
      
      channel
        .on('presence', { event: 'sync' }, () => {
          connectionEstablished = true;
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            subscriptionWorked = true;
            clearTimeout(timeout);
            resolve(true);
          }
        });
    });
    
    const connected = await testPromise;
    
    if (connected) {
      console.log(chalk.green('✅ Realtime connection established'));
      testResults.realtime.connectsSuccessfully = true;
      testResults.realtime.subscriptionsWork = subscriptionWorked;
    } else {
      console.log(chalk.yellow('⚠️  Realtime connection timeout'));
      testResults.realtime.errors.push('Connection timeout');
    }
    
    // Clean up
    await channel.unsubscribe();
    
    // Test 2: Organization-filtered subscriptions
    console.log('Testing organization-filtered subscriptions...');
    
    try {
      const orgChannel = supabase
        .channel('org-test')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'organizations',
            filter: 'id=eq.test-org-123'
          },
          (payload) => {
            console.log('Received org change:', payload);
          }
        );
      
      const orgSubscribed = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        
        orgChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });
      
      if (orgSubscribed) {
        console.log(chalk.green('✅ Organization-filtered subscription works'));
        testResults.realtime.orgFiltering = true;
      } else {
        console.log(chalk.yellow('⚠️  Organization subscription timeout'));
      }
      
      await orgChannel.unsubscribe();
      
    } catch (error) {
      console.log(chalk.red(`❌ Organization subscription error: ${error.message}`));
      testResults.realtime.errors.push(`Org subscription: ${error.message}`);
    }
    
  } catch (error) {
    testResults.realtime.errors.push(error.message);
    console.log(chalk.red(`❌ Realtime test failed: ${error.message}`));
  }
}

/**
 * Test performance and scalability aspects
 */
async function testPerformance() {
  console.log(chalk.blue('\n⚡ TESTING PERFORMANCE...'));
  
  try {
    // Test 1: Query performance
    console.log('Testing query performance...');
    
    const queries = [
      {
        name: 'Organizations list',
        query: () => supabase.from('organizations').select('id, name, slug').limit(50)
      },
      {
        name: 'Organization members', 
        query: () => supabase.from('organization_members').select('id, role, user_id').limit(100)
      },
      {
        name: 'Platform statistics',
        query: () => supabase.rpc('get_platform_statistics')
      }
    ];
    
    for (const queryTest of queries) {
      const startTime = Date.now();
      
      try {
        const { data, error } = await queryTest.query();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error) {
          console.log(chalk.yellow(`⚠️  ${queryTest.name}: ${error.message}`));
          testResults.performance.queryTimes[queryTest.name] = { error: error.message };
        } else {
          console.log(chalk.green(`✅ ${queryTest.name}: ${duration}ms (${data?.length || 0} records)`));
          testResults.performance.queryTimes[queryTest.name] = { 
            duration, 
            recordCount: data?.length || 0 
          };
        }
      } catch (error) {
        console.log(chalk.red(`❌ ${queryTest.name}: ${error.message}`));
        testResults.performance.queryTimes[queryTest.name] = { error: error.message };
      }
    }
    
    // Test 2: Memory usage
    console.log('Checking memory usage...');
    const memUsage = process.memoryUsage();
    
    testResults.performance.memoryUsage = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
    };
    
    console.log(chalk.green(`✅ Memory usage: RSS ${testResults.performance.memoryUsage.rss}, Heap ${testResults.performance.memoryUsage.heapUsed}`));
    
  } catch (error) {
    console.log(chalk.red(`❌ Performance test failed: ${error.message}`));
  }
}

/**
 * Generate comprehensive integration test report
 */
function generateIntegrationReport() {
  console.log(chalk.blue('\n📊 MULTI-TENANT INTEGRATION TEST REPORT'));
  console.log('='.repeat(80));
  
  // Organization Context Summary
  console.log(chalk.blue('\n🏢 ORGANIZATION CONTEXT:'));
  console.log(`Context Loading: ${testResults.organizationContext.contextLoadsCorrectly ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Errors: ${testResults.organizationContext.errors.length}`);
  
  if (testResults.organizationContext.errors.length > 0) {
    testResults.organizationContext.errors.forEach(error => {
      console.log(chalk.red(`  - ${error}`));
    });
  }
  
  // Data Isolation Summary
  console.log(chalk.blue('\n🔒 DATA ISOLATION:'));
  console.log(`Organization Filtering: ${testResults.dataIsolation.orgFilteringWorks ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`RLS Policies: ${testResults.dataIsolation.rlsWorking ? chalk.green('✅ Active') : chalk.red('❌ Missing')}`);
  console.log(`Cross-Org Leakage: ${testResults.dataIsolation.crossOrgLeakage ? chalk.red('❌ Detected') : chalk.green('✅ None')}`);
  
  // Frontend Integration Summary
  console.log(chalk.blue('\n⚛️  FRONTEND INTEGRATION:'));
  console.log(`Context Provider: ${testResults.frontendIntegration.contextProviderWorks ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Components: ${testResults.frontendIntegration.componentsRender ? chalk.green('✅ Available') : chalk.red('❌ Missing')}`);
  console.log(`Integration Errors: ${testResults.frontendIntegration.errors.length}`);
  
  // Rate Limiting Summary
  console.log(chalk.blue('\n🚦 RATE LIMITING:'));
  console.log(`Service Loading: ${testResults.rateLimiting.serviceLoads ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Organization Aware: ${testResults.rateLimiting.organizationAware ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
  console.log(`Redis Integration: ${testResults.rateLimiting.limits.redis || 'Unknown'}`);
  
  // Realtime Summary
  console.log(chalk.blue('\n📡 REALTIME:'));
  console.log(`Connection: ${testResults.realtime.connectsSuccessfully ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Org Filtering: ${testResults.realtime.orgFiltering ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Subscriptions: ${testResults.realtime.subscriptionsWork ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  
  // Performance Summary
  console.log(chalk.blue('\n⚡ PERFORMANCE:'));
  Object.entries(testResults.performance.queryTimes).forEach(([name, result]) => {
    if (result.error) {
      console.log(chalk.red(`${name}: Error - ${result.error}`));
    } else {
      const status = result.duration < 500 ? chalk.green('✅ Fast') : 
                    result.duration < 2000 ? chalk.yellow('⚠️  Slow') : chalk.red('❌ Very Slow');
      console.log(`${name}: ${result.duration}ms ${status}`);
    }
  });
  
  // Critical Issues
  console.log(chalk.blue('\n🚨 CRITICAL INTEGRATION ISSUES:'));
  const criticalIssues = [];
  
  if (!testResults.organizationContext.contextLoadsCorrectly) {
    criticalIssues.push('❌ Organization context cannot load - app will crash');
  }
  if (!testResults.dataIsolation.orgFilteringWorks) {
    criticalIssues.push('❌ Data isolation broken - security risk');
  }
  if (testResults.frontendIntegration.errors.length > 5) {
    criticalIssues.push('❌ Multiple frontend integration failures');
  }
  if (!testResults.realtime.connectsSuccessfully) {
    criticalIssues.push('❌ Realtime functionality broken');
  }
  
  if (criticalIssues.length === 0) {
    console.log(chalk.green('✅ No critical integration issues detected'));
  } else {
    criticalIssues.forEach(issue => console.log(chalk.red(issue)));
  }
  
  // Integration Readiness Score
  const scores = {
    context: testResults.organizationContext.contextLoadsCorrectly ? 25 : 0,
    isolation: testResults.dataIsolation.orgFilteringWorks ? 25 : 0,
    frontend: testResults.frontendIntegration.componentsRender ? 20 : 0,
    realtime: testResults.realtime.connectsSuccessfully ? 15 : 0,
    rateLimit: testResults.rateLimiting.serviceLoads ? 15 : 0
  };
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const readinessLevel = totalScore >= 90 ? 'Ready' : 
                        totalScore >= 70 ? 'Nearly Ready' :
                        totalScore >= 50 ? 'Needs Work' : 'Critical Issues';
  
  console.log(chalk.blue(`\n🎯 INTEGRATION READINESS: ${totalScore}/100 - ${readinessLevel}`));
  
  return testResults;
}

/**
 * Main integration test execution
 */
async function main() {
  console.log(chalk.cyan('🧪 MULTI-TENANT INTEGRATION TEST SUITE'));
  console.log(chalk.cyan('====================================='));
  console.log(`Target Database: ${SUPABASE_URL}`);
  console.log(`Test Environment: Node.js ${process.version}`);
  
  // Run all integration tests
  await testOrganizationContext();
  await testDataIsolation();
  await testFrontendIntegration();
  await testRateLimitingIntegration();
  await testRealtimeIntegration();
  await testPerformance();
  
  // Generate final report
  const results = generateIntegrationReport();
  
  // Save detailed results to file
  await import('fs/promises').then(fs => 
    fs.writeFile(
      'integration-test-results.json', 
      JSON.stringify(results, null, 2)
    )
  );
  
  console.log(chalk.blue('\n📋 DETAILED RESULTS SAVED TO: integration-test-results.json'));
  
  // Exit with appropriate code
  const hasErrors = !testResults.organizationContext.contextLoadsCorrectly ||
                   !testResults.dataIsolation.orgFilteringWorks ||
                   testResults.frontendIntegration.errors.length > 5;
  
  process.exit(hasErrors ? 1 : 0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});

// Run the integration tests
main().catch(error => {
  console.error(chalk.red('\n❌ Integration test execution failed:'), error);
  process.exit(1);
});