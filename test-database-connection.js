#!/usr/bin/env node
/**
 * Test database connection and core functionality
 */

console.log('🔗 Testing Database Connection...\n');

// Helper to create Node.js compatible Supabase client
async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    "https://ynqdddwponrqwhtqfepi.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ",
    { auth: { persistSession: false } }
  );
}

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🔧 Testing Supabase connection...');
    
    const supabase = await createSupabaseClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log(`✅ Supabase connected successfully`);
    console.log(`📊 Profiles table accessible: ${data !== null ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Supabase connection test failed:', error.message);
    return false;
  }
}

// Test organization tables
async function testOrganizationTables() {
  try {
    console.log('\n🏢 Testing organization tables...');
    
    const supabase = await createSupabaseClient();
    
    // Test organizations table
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(5);
    
    if (orgError) {
      console.log('❌ Organizations table error:', orgError.message);
      return false;
    }
    
    console.log(`✅ Organizations table: ${orgs?.length || 0} organizations found`);
    if (orgs && orgs.length > 0) {
      console.log(`   - First org: "${orgs[0].name}" (${orgs[0].slug})`);
    }
    
    // Test organization_members table
    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, user_id, role')
      .limit(5);
    
    if (memberError) {
      console.log('❌ Organization members table error:', memberError.message);
      return false;
    }
    
    console.log(`✅ Organization members table: ${members?.length || 0} members found`);
    
    return true;
  } catch (error) {
    console.log('❌ Organization tables test failed:', error.message);
    return false;
  }
}

// Test critical tables exist
async function testCriticalTables() {
  try {
    console.log('\n📋 Testing critical tables exist...');
    
    const supabase = await createSupabaseClient();
    
    const criticalTables = [
      'events',
      'social_posts', 
      'direct_messages',
      'challenges',
      'loyalty_transactions',
      'notifications'
    ];
    
    let allTablesExist = true;
    
    for (const table of criticalTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
          allTablesExist = false;
        } else {
          console.log(`✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
        allTablesExist = false;
      }
    }
    
    return allTablesExist;
  } catch (error) {
    console.log('❌ Critical tables test failed:', error.message);
    return false;
  }
}

// Test RPC functions
async function testRPCFunctions() {
  try {
    console.log('\n⚡ Testing RPC functions...');
    
    const supabase = await createSupabaseClient();
    
    const testRPCs = [
      'get_platform_statistics',
      'is_platform_admin',
      'get_user_current_organization'
    ];
    
    let allRPCsWork = true;
    
    for (const rpcName of testRPCs) {
      try {
        // Just test if RPC exists by calling it (might fail due to auth but shouldn't give "function not found")
        const { error } = await supabase.rpc(rpcName);
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ ${rpcName}: function does not exist`);
          allRPCsWork = false;
        } else {
          console.log(`✅ ${rpcName}: function exists`);
        }
      } catch (err) {
        console.log(`⚠️ ${rpcName}: ${err.message}`);
      }
    }
    
    return allRPCsWork;
  } catch (error) {
    console.log('❌ RPC functions test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting database connection tests...\n');
  
  const tests = [
    { name: 'Supabase Connection', fn: testSupabaseConnection },
    { name: 'Organization Tables', fn: testOrganizationTables },
    { name: 'Critical Tables', fn: testCriticalTables },
    { name: 'RPC Functions', fn: testRPCFunctions }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 ${test.name}`);
    console.log(`${'='.repeat(50)}`);
    
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
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 DATABASE CONNECTION TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL DATABASE TESTS PASSED!');
    console.log('🔗 Database is fully connected and functional');
    return true;
  } else {
    console.log(`\n⚠️ ${failed} tests failed - Database has issues`);
    return false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Database tests interrupted');
  process.exit(0);
});

// Run if called directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Database test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests };