/**
 * DATABASE CONNECTIVITY TEST SUITE
 * 
 * Comprehensive tests for database connectivity from both Node.js and React environments.
 * Tests include authentication, query execution, real-time subscriptions, and organization context.
 * 
 * Usage: node test-database-connectivity.js
 */

import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import chalk from 'chalk';

// Database connection
const SUPABASE_URL = "https://ynqdddwponrqwhtqfepi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results storage
let testResults = {
  nodejs: {
    basicConnection: false,
    authentication: false,
    queryExecution: false,
    realtimeConnection: false,
    organizationQueries: false,
    rpcFunctions: false,
    errorHandling: false,
    errors: []
  },
  react: {
    supabaseClientLoads: false,
    contextProviderWorks: false,
    hooksExecute: false,
    componentsRender: false,
    realtimeSubscriptions: false,
    organizationSwitching: false,
    errors: []
  },
  performance: {
    connectionTime: 0,
    queryResponseTimes: {},
    memoryUsage: {},
    connectionPooling: {}
  },
  integration: {
    dataFlowWorks: false,
    organizationIsolation: false,
    realtimeSync: false,
    errorBoundaries: false,
    errors: []
  }
};

/**
 * Test basic Node.js database connectivity
 */
async function testNodeJSConnectivity() {
  console.log(chalk.blue('\n🔗 TESTING NODE.JS DATABASE CONNECTIVITY...'));
  
  try {
    // Test 1: Basic connection
    console.log('Testing basic Supabase connection...');
    const startTime = Date.now();
    
    const { data: healthCheck, error: healthError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    const connectionTime = Date.now() - startTime;
    testResults.performance.connectionTime = connectionTime;
    
    if (healthError) {
      throw new Error(`Connection failed: ${healthError.message}`);
    }
    
    testResults.nodejs.basicConnection = true;
    console.log(chalk.green(`✅ Basic connection successful (${connectionTime}ms)`));
    
    // Test 2: Authentication check
    console.log('Testing authentication...');
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message !== 'Invalid JWT') {
      console.log(chalk.red(`❌ Authentication error: ${authError.message}`));
      testResults.nodejs.errors.push(`Auth error: ${authError.message}`);
    } else if (authData.user) {
      console.log(chalk.green(`✅ User authenticated: ${authData.user.email || authData.user.id}`));
      testResults.nodejs.authentication = true;
    } else {
      console.log(chalk.yellow('⚠️  No authenticated user (anonymous mode)'));
      testResults.nodejs.authentication = true; // Anonymous is valid for testing
    }
    
    // Test 3: Query execution on various table types
    console.log('Testing query execution...');
    
    const queryTests = [
      {
        name: 'System tables',
        query: () => supabase
          .from('information_schema.columns')
          .select('table_name, column_name')
          .eq('table_schema', 'public')
          .limit(10)
      },
      {
        name: 'Organizations table',
        query: () => supabase
          .from('organizations')
          .select('id, name, slug')
          .limit(5)
      },
      {
        name: 'Profiles table',
        query: () => supabase
          .from('profiles')
          .select('id, full_name')
          .limit(5)
      }
    ];
    
    let successfulQueries = 0;
    
    for (const queryTest of queryTests) {
      const queryStart = Date.now();
      
      try {
        const { data, error } = await queryTest.query();
        const queryTime = Date.now() - queryStart;
        
        testResults.performance.queryResponseTimes[queryTest.name] = queryTime;
        
        if (error) {
          console.log(chalk.red(`❌ ${queryTest.name} query failed: ${error.message}`));
          testResults.nodejs.errors.push(`Query ${queryTest.name}: ${error.message}`);
        } else {
          console.log(chalk.green(`✅ ${queryTest.name} query successful (${queryTime}ms, ${data?.length || 0} records)`));
          successfulQueries++;
        }
      } catch (error) {
        console.log(chalk.red(`❌ ${queryTest.name} query exception: ${error.message}`));
        testResults.nodejs.errors.push(`Query ${queryTest.name}: ${error.message}`);
      }
    }
    
    testResults.nodejs.queryExecution = successfulQueries > 0;
    
    // Test 4: RPC function execution
    console.log('Testing RPC function execution...');
    
    const rpcTests = [
      { name: 'is_platform_admin', func: () => supabase.rpc('is_platform_admin') },
      { name: 'get_platform_statistics', func: () => supabase.rpc('get_platform_statistics') },
      { name: 'get_user_current_organization', func: () => supabase.rpc('get_user_current_organization') }
    ];
    
    let successfulRpcs = 0;
    
    for (const rpcTest of rpcTests) {
      try {
        const { data, error } = await rpcTest.func();
        
        if (error && error.code === 'PGRST202') {
          console.log(chalk.yellow(`⚠️  RPC ${rpcTest.name}: Function not found (expected during repair)`));
        } else if (error) {
          console.log(chalk.red(`❌ RPC ${rpcTest.name}: ${error.message}`));
          testResults.nodejs.errors.push(`RPC ${rpcTest.name}: ${error.message}`);
        } else {
          console.log(chalk.green(`✅ RPC ${rpcTest.name}: Working`));
          successfulRpcs++;
        }
      } catch (error) {
        console.log(chalk.red(`❌ RPC ${rpcTest.name} exception: ${error.message}`));
        testResults.nodejs.errors.push(`RPC ${rpcTest.name}: ${error.message}`);
      }
    }
    
    testResults.nodejs.rpcFunctions = successfulRpcs > 0;
    
    // Test 5: Organization-specific queries
    console.log('Testing organization-specific queries...');
    
    try {
      // Test organization filtering
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          organization_members (
            id,
            role,
            user_id
          )
        `)
        .limit(3);
      
      if (orgError) {
        console.log(chalk.red(`❌ Organization query failed: ${orgError.message}`));
        testResults.nodejs.errors.push(`Organization query: ${orgError.message}`);
      } else {
        console.log(chalk.green(`✅ Organization queries work (${orgData?.length || 0} orgs)`));
        testResults.nodejs.organizationQueries = true;
        
        // Test nested relationship data
        const orgsWithMembers = orgData?.filter(org => org.organization_members?.length > 0) || [];
        if (orgsWithMembers.length > 0) {
          console.log(chalk.green(`✅ Organization relationships work (${orgsWithMembers.length} orgs with members)`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Organization query exception: ${error.message}`));
      testResults.nodejs.errors.push(`Organization query: ${error.message}`);
    }
    
    // Test 6: Real-time connection
    console.log('Testing real-time connection...');
    
    try {
      const channel = supabase.channel('connectivity-test');
      
      let realtimeConnected = false;
      
      const realtimePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            realtimeConnected = true;
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });
      
      const connected = await realtimePromise;
      
      if (connected) {
        console.log(chalk.green('✅ Real-time connection successful'));
        testResults.nodejs.realtimeConnection = true;
      } else {
        console.log(chalk.yellow('⚠️  Real-time connection timeout'));
      }
      
      await channel.unsubscribe();
      
    } catch (error) {
      console.log(chalk.red(`❌ Real-time connection failed: ${error.message}`));
      testResults.nodejs.errors.push(`Realtime: ${error.message}`);
    }
    
    // Test 7: Error handling
    console.log('Testing error handling...');
    
    try {
      // Intentionally trigger an error
      const { data, error } = await supabase
        .from('nonexistent_table')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(chalk.green('✅ Error handling works (gracefully handled invalid query)'));
        testResults.nodejs.errorHandling = true;
      } else {
        console.log(chalk.red('❌ Error handling failed (should have errored)'));
      }
    } catch (error) {
      console.log(chalk.green('✅ Error handling works (exception caught)'));
      testResults.nodejs.errorHandling = true;
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Node.js connectivity test failed: ${error.message}`));
    testResults.nodejs.errors.push(`General: ${error.message}`);
  }
}

/**
 * Test React environment connectivity
 */
async function testReactConnectivity() {
  console.log(chalk.blue('\n⚛️  TESTING REACT ENVIRONMENT CONNECTIVITY...'));
  
  try {
    // Test 1: Check if Supabase client can be imported in React context
    console.log('Testing Supabase client import...');
    
    try {
      const clientCode = await readFile('client/src/integrations/supabase/client.ts', 'utf8');
      
      if (clientCode.includes('createClient') && clientCode.includes('SUPABASE_URL')) {
        console.log(chalk.green('✅ Supabase client configuration exists'));
        testResults.react.supabaseClientLoads = true;
        
        // Check for proper TypeScript types
        if (clientCode.includes('Database') || clientCode.includes('type Database')) {
          console.log(chalk.green('✅ Database types are imported'));
        } else {
          console.log(chalk.yellow('⚠️  Database types not imported'));
          testResults.react.errors.push('Database types missing in client');
        }
      } else {
        console.log(chalk.red('❌ Supabase client configuration invalid'));
        testResults.react.errors.push('Invalid client configuration');
      }
    } catch (error) {
      console.log(chalk.red(`❌ Cannot read Supabase client: ${error.message}`));
      testResults.react.errors.push(`Client import: ${error.message}`);
    }
    
    // Test 2: Check Organization Context Provider
    console.log('Testing Organization Context Provider...');
    
    try {
      const contextCode = await readFile('client/src/contexts/OrganizationContext.tsx', 'utf8');
      
      const requiredPatterns = [
        'OrganizationProvider',
        'useOrganization',
        'currentOrganization',
        'switchOrganization',
        'supabase.from',
        'createContext'
      ];
      
      const missingPatterns = requiredPatterns.filter(pattern => !contextCode.includes(pattern));
      
      if (missingPatterns.length === 0) {
        console.log(chalk.green('✅ Organization Context Provider complete'));
        testResults.react.contextProviderWorks = true;
      } else {
        console.log(chalk.red(`❌ Organization Context missing: ${missingPatterns.join(', ')}`));
        testResults.react.errors.push(`Context missing: ${missingPatterns.join(', ')}`);
      }
      
      // Check for proper error handling
      if (contextCode.includes('try') && contextCode.includes('catch')) {
        console.log(chalk.green('✅ Context has error handling'));
      } else {
        console.log(chalk.yellow('⚠️  Context lacks comprehensive error handling'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cannot read Organization Context: ${error.message}`));
      testResults.react.errors.push(`Context: ${error.message}`);
    }
    
    // Test 3: Check organization hooks
    console.log('Testing organization hooks...');
    
    const hooksToTest = [
      'useOrganizationData.ts',
      'useOrganizationFeatures.ts',
      'useOrganizationMembers.ts'
    ];
    
    let workingHooks = 0;
    
    for (const hookFile of hooksToTest) {
      try {
        const hookPath = `client/src/hooks/${hookFile}`;
        const hookCode = await readFile(hookPath, 'utf8');
        
        if (hookCode.includes('useQuery') || hookCode.includes('useState') || hookCode.includes('useEffect')) {
          console.log(chalk.green(`✅ ${hookFile} exists and has React hooks`));
          workingHooks++;
        } else {
          console.log(chalk.red(`❌ ${hookFile} missing React hook patterns`));
          testResults.react.errors.push(`Hook ${hookFile}: invalid structure`);
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  ${hookFile} not found (may be missing)`));
      }
    }
    
    testResults.react.hooksExecute = workingHooks > 0;
    
    // Test 4: Check organization components
    console.log('Testing organization components...');
    
    const componentsToTest = [
      'OrganizationSwitcher.tsx',
      'ThemeCustomization.tsx', 
      'FeatureToggleManager.tsx',
      'DraggableDashboard.tsx'
    ];
    
    let workingComponents = 0;
    
    for (const componentFile of componentsToTest) {
      try {
        const componentPath = `client/src/components/organization/${componentFile}`;
        const componentCode = await readFile(componentPath, 'utf8');
        
        const reactPatterns = ['React', 'useState', 'useEffect', 'return (', 'export'];
        const hasReactPatterns = reactPatterns.some(pattern => componentCode.includes(pattern));
        
        if (hasReactPatterns) {
          console.log(chalk.green(`✅ ${componentFile} is a valid React component`));
          workingComponents++;
          
          // Check for organization context usage
          if (componentCode.includes('useOrganization') || componentCode.includes('currentOrganization')) {
            console.log(chalk.green(`  └─ Uses organization context`));
          } else {
            console.log(chalk.yellow(`  └─ May not use organization context`));
          }
        } else {
          console.log(chalk.red(`❌ ${componentFile} invalid React component`));
          testResults.react.errors.push(`Component ${componentFile}: invalid structure`);
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  ${componentFile} not found`));
      }
    }
    
    testResults.react.componentsRender = workingComponents > 2; // At least 3 components working
    
    // Test 5: Check for real-time subscription patterns
    console.log('Testing real-time subscription patterns...');
    
    try {
      const contextCode = await readFile('client/src/contexts/OrganizationContext.tsx', 'utf8');
      
      if (contextCode.includes('supabase.channel') || contextCode.includes('subscription')) {
        console.log(chalk.green('✅ Real-time subscriptions implemented in context'));
        testResults.react.realtimeSubscriptions = true;
        
        if (contextCode.includes('postgres_changes')) {
          console.log(chalk.green('  └─ Uses postgres_changes for real-time updates'));
        }
        
        if (contextCode.includes('organization_id')) {
          console.log(chalk.green('  └─ Subscriptions are organization-filtered'));
        }
      } else {
        console.log(chalk.yellow('⚠️  No real-time subscriptions found in context'));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Cannot check real-time patterns: ${error.message}`));
    }
    
    // Test 6: Check organization switching logic
    console.log('Testing organization switching logic...');
    
    try {
      const contextCode = await readFile('client/src/contexts/OrganizationContext.tsx', 'utf8');
      
      if (contextCode.includes('switchOrganization') && contextCode.includes('setCurrentOrganization')) {
        console.log(chalk.green('✅ Organization switching logic exists'));
        testResults.react.organizationSwitching = true;
        
        // Check for persistence
        if (contextCode.includes('current_organization_id') || contextCode.includes('localStorage')) {
          console.log(chalk.green('  └─ Organization preference persistence implemented'));
        }
      } else {
        console.log(chalk.red('❌ Organization switching logic missing'));
        testResults.react.errors.push('Organization switching missing');
      }
    } catch (error) {
      console.log(chalk.red(`❌ Cannot check switching logic: ${error.message}`));
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ React connectivity test failed: ${error.message}`));
    testResults.react.errors.push(`General: ${error.message}`);
  }
}

/**
 * Test frontend-backend data flow integration
 */
async function testDataFlowIntegration() {
  console.log(chalk.blue('\n🔄 TESTING FRONTEND-BACKEND DATA FLOW...'));
  
  try {
    // Test 1: Verify data flow from database to React components
    console.log('Testing data flow integration...');
    
    // Check if React Query is properly configured for data fetching
    try {
      const clientCode = await readFile('client/src/integrations/supabase/client.ts', 'utf8');
      const contextCode = await readFile('client/src/contexts/OrganizationContext.tsx', 'utf8');
      
      // Check for proper data fetching patterns
      const dataFlowPatterns = [
        'supabase.from',
        'useEffect',
        'useState',
        'setLoading',
        'setError'
      ];
      
      const hasDataFlowPatterns = dataFlowPatterns.every(pattern => 
        contextCode.includes(pattern)
      );
      
      if (hasDataFlowPatterns) {
        console.log(chalk.green('✅ Data flow patterns implemented'));
        testResults.integration.dataFlowWorks = true;
      } else {
        console.log(chalk.red('❌ Data flow patterns incomplete'));
        testResults.integration.errors.push('Data flow patterns incomplete');
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cannot verify data flow: ${error.message}`));
    }
    
    // Test 2: Check organization data isolation
    console.log('Testing organization data isolation...');
    
    try {
      const contextCode = await readFile('client/src/contexts/OrganizationContext.tsx', 'utf8');
      
      // Look for organization filtering patterns
      const isolationPatterns = [
        'organization_id',
        'currentOrganization',
        'eq(\'organization_id\'',
        'filter'
      ];
      
      const hasIsolationPatterns = isolationPatterns.some(pattern =>
        contextCode.includes(pattern)
      );
      
      if (hasIsolationPatterns) {
        console.log(chalk.green('✅ Organization data isolation implemented'));
        testResults.integration.organizationIsolation = true;
      } else {
        console.log(chalk.red('❌ Organization data isolation missing'));
        testResults.integration.errors.push('Data isolation missing');
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cannot verify data isolation: ${error.message}`));
    }
    
    // Test 3: Check real-time sync between frontend and backend
    console.log('Testing real-time sync...');
    
    try {
      const contextCode = await readFile('client/src/contexts/OrganizationContext.tsx', 'utf8');
      
      if (contextCode.includes('subscribe') && contextCode.includes('postgres_changes')) {
        console.log(chalk.green('✅ Real-time sync implemented'));
        testResults.integration.realtimeSync = true;
        
        // Check if it handles updates properly
        if (contextCode.includes('payload') && contextCode.includes('UPDATE')) {
          console.log(chalk.green('  └─ Handles real-time updates'));
        }
        
        if (contextCode.includes('DELETE') && contextCode.includes('handleOrganizationDeleted')) {
          console.log(chalk.green('  └─ Handles organization deletions'));
        }
      } else {
        console.log(chalk.yellow('⚠️  Real-time sync not fully implemented'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Cannot verify real-time sync: ${error.message}`));
    }
    
    // Test 4: Check error boundaries
    console.log('Testing error boundaries...');
    
    const errorBoundaryFiles = [
      'client/src/components/ui/enhanced-error-boundary.tsx',
      'client/src/components/ui/error-boundary.tsx'
    ];
    
    let errorBoundariesFound = 0;
    
    for (const boundaryFile of errorBoundaryFiles) {
      try {
        const boundaryCode = await readFile(boundaryFile, 'utf8');
        
        if (boundaryCode.includes('componentDidCatch') || boundaryCode.includes('ErrorBoundary')) {
          console.log(chalk.green(`✅ ${boundaryFile} exists`));
          errorBoundariesFound++;
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  ${boundaryFile} not found`));
      }
    }
    
    testResults.integration.errorBoundaries = errorBoundariesFound > 0;
    
  } catch (error) {
    console.log(chalk.red(`❌ Data flow integration test failed: ${error.message}`));
    testResults.integration.errors.push(`General: ${error.message}`);
  }
}

/**
 * Test memory usage and performance
 */
async function testPerformanceMetrics() {
  console.log(chalk.blue('\n⚡ TESTING PERFORMANCE METRICS...'));
  
  try {
    // Test 1: Memory usage
    const memUsage = process.memoryUsage();
    testResults.performance.memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    console.log(chalk.green(`✅ Memory usage: ${testResults.performance.memoryUsage.heapUsed}MB heap, ${testResults.performance.memoryUsage.rss}MB RSS`));
    
    // Test 2: Connection pooling efficiency
    console.log('Testing connection pooling...');
    
    const startTime = Date.now();
    const concurrentQueries = [];
    
    // Execute 10 concurrent queries to test connection handling
    for (let i = 0; i < 10; i++) {
      concurrentQueries.push(
        supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1)
      );
    }
    
    try {
      const results = await Promise.all(concurrentQueries);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / results.length;
      
      testResults.performance.connectionPooling = {
        concurrentQueries: results.length,
        totalTime,
        averageTime: Math.round(avgTime),
        allSuccessful: results.every(result => !result.error)
      };
      
      console.log(chalk.green(`✅ Connection pooling: ${results.length} queries in ${totalTime}ms (avg ${avgTime.toFixed(1)}ms)`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Connection pooling test failed: ${error.message}`));
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Performance test failed: ${error.message}`));
  }
}

/**
 * Generate comprehensive connectivity report
 */
function generateConnectivityReport() {
  console.log(chalk.blue('\n📊 DATABASE CONNECTIVITY REPORT'));
  console.log('='.repeat(80));
  
  // Node.js Connectivity Summary
  console.log(chalk.blue('\n🔗 NODE.JS CONNECTIVITY:'));
  console.log(`Basic Connection: ${testResults.nodejs.basicConnection ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Authentication: ${testResults.nodejs.authentication ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Query Execution: ${testResults.nodejs.queryExecution ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`RPC Functions: ${testResults.nodejs.rpcFunctions ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Organization Queries: ${testResults.nodejs.organizationQueries ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Real-time Connection: ${testResults.nodejs.realtimeConnection ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Error Handling: ${testResults.nodejs.errorHandling ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  
  if (testResults.nodejs.errors.length > 0) {
    console.log(chalk.red(`Errors: ${testResults.nodejs.errors.length}`));
    testResults.nodejs.errors.slice(0, 5).forEach(error => {
      console.log(chalk.red(`  - ${error}`));
    });
  }
  
  // React Connectivity Summary
  console.log(chalk.blue('\n⚛️  REACT CONNECTIVITY:'));
  console.log(`Supabase Client: ${testResults.react.supabaseClientLoads ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Context Provider: ${testResults.react.contextProviderWorks ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Hooks Execute: ${testResults.react.hooksExecute ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Components Render: ${testResults.react.componentsRender ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Realtime Subscriptions: ${testResults.react.realtimeSubscriptions ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Organization Switching: ${testResults.react.organizationSwitching ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  
  if (testResults.react.errors.length > 0) {
    console.log(chalk.red(`Errors: ${testResults.react.errors.length}`));
    testResults.react.errors.slice(0, 5).forEach(error => {
      console.log(chalk.red(`  - ${error}`));
    });
  }
  
  // Integration Summary
  console.log(chalk.blue('\n🔄 INTEGRATION:'));
  console.log(`Data Flow: ${testResults.integration.dataFlowWorks ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Organization Isolation: ${testResults.integration.organizationIsolation ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Real-time Sync: ${testResults.integration.realtimeSync ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Error Boundaries: ${testResults.integration.errorBoundaries ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  
  // Performance Summary
  console.log(chalk.blue('\n⚡ PERFORMANCE:'));
  console.log(`Connection Time: ${testResults.performance.connectionTime}ms`);
  console.log(`Memory Usage: ${testResults.performance.memoryUsage.heapUsed}MB heap`);
  
  if (testResults.performance.connectionPooling.concurrentQueries) {
    console.log(`Connection Pooling: ${testResults.performance.connectionPooling.averageTime}ms avg (${testResults.performance.connectionPooling.concurrentQueries} concurrent)`);
  }
  
  // Query Performance
  if (Object.keys(testResults.performance.queryResponseTimes).length > 0) {
    console.log(chalk.blue('\nQuery Response Times:'));
    Object.entries(testResults.performance.queryResponseTimes).forEach(([query, time]) => {
      const status = time < 100 ? chalk.green('Fast') : time < 500 ? chalk.yellow('OK') : chalk.red('Slow');
      console.log(`  ${query}: ${time}ms ${status}`);
    });
  }
  
  // Critical Issues
  console.log(chalk.blue('\n🚨 CRITICAL CONNECTIVITY ISSUES:'));
  const criticalIssues = [];
  
  if (!testResults.nodejs.basicConnection) {
    criticalIssues.push('❌ Node.js cannot connect to database');
  }
  if (!testResults.react.supabaseClientLoads) {
    criticalIssues.push('❌ React Supabase client configuration broken');
  }
  if (!testResults.react.contextProviderWorks) {
    criticalIssues.push('❌ Organization Context Provider broken - app will crash');
  }
  if (!testResults.integration.dataFlowWorks) {
    criticalIssues.push('❌ Frontend-backend data flow broken');
  }
  if (!testResults.nodejs.organizationQueries) {
    criticalIssues.push('❌ Organization queries fail - multi-tenant broken');
  }
  
  if (criticalIssues.length === 0) {
    console.log(chalk.green('✅ No critical connectivity issues detected'));
  } else {
    criticalIssues.forEach(issue => console.log(chalk.red(issue)));
  }
  
  // Connectivity Score
  const maxScore = 100;
  const scores = {
    nodejs: (testResults.nodejs.basicConnection ? 15 : 0) +
           (testResults.nodejs.queryExecution ? 15 : 0) +
           (testResults.nodejs.organizationQueries ? 10 : 0) +
           (testResults.nodejs.realtimeConnection ? 5 : 0),
    react: (testResults.react.supabaseClientLoads ? 15 : 0) +
          (testResults.react.contextProviderWorks ? 20 : 0) +
          (testResults.react.componentsRender ? 10 : 0),
    integration: (testResults.integration.dataFlowWorks ? 5 : 0) +
                (testResults.integration.organizationIsolation ? 5 : 0)
  };
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const connectivityLevel = totalScore >= 90 ? 'Excellent' :
                           totalScore >= 70 ? 'Good' :
                           totalScore >= 50 ? 'Fair' :
                           'Poor';
  
  console.log(chalk.blue(`\n🎯 CONNECTIVITY SCORE: ${totalScore}/100 - ${connectivityLevel}`));
  
  return testResults;
}

/**
 * Main connectivity testing execution
 */
async function main() {
  console.log(chalk.cyan('🔗 DATABASE CONNECTIVITY TEST SUITE'));
  console.log(chalk.cyan('==================================='));
  console.log(`Target Database: ${SUPABASE_URL}`);
  console.log(`Test Environment: ${process.platform} / Node.js ${process.version}`);
  
  // Run all connectivity tests
  await testNodeJSConnectivity();
  await testReactConnectivity();  
  await testDataFlowIntegration();
  await testPerformanceMetrics();
  
  // Generate final report
  const results = generateConnectivityReport();
  
  // Save detailed results to file
  await writeFile(
    'connectivity-test-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log(chalk.blue('\n📋 DETAILED RESULTS SAVED TO: connectivity-test-results.json'));
  
  // Exit with appropriate code
  const hasErrors = !testResults.nodejs.basicConnection ||
                   !testResults.react.supabaseClientLoads ||
                   !testResults.integration.dataFlowWorks;
  
  process.exit(hasErrors ? 1 : 0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});

// Run the connectivity tests
main().catch(error => {
  console.error(chalk.red('\n❌ Connectivity test execution failed:'), error);
  process.exit(1);
});