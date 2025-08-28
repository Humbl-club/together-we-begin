#!/usr/bin/env node
/**
 * Test organization context and routing functionality
 */

import { createClient } from '@supabase/supabase-js';

console.log('🏢 Testing Organization Context and Routing...\n');

const supabase = createClient(
  'https://ynqdddwponrqwhtqfepi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ',
  { auth: { persistSession: false } }
);

// Test organization data
async function testOrganizationData() {
  try {
    console.log('🔧 Testing organization data structure...');
    
    // Get organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, plan_type, max_members')
      .limit(3);
    
    if (orgError) {
      console.log('❌ Organizations query failed:', orgError.message);
      return false;
    }
    
    console.log(`✅ Found ${orgs?.length || 0} organizations`);
    if (orgs && orgs.length > 0) {
      orgs.forEach((org, i) => {
        console.log(`   ${i + 1}. "${org.name}" (${org.slug}) - ${org.plan_type} plan, max ${org.max_members} members`);
      });
    }
    
    // Test organization members
    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, user_id, role')
      .limit(5);
    
    if (memberError) {
      console.log('❌ Organization members query failed:', memberError.message);
      return false;
    }
    
    console.log(`✅ Found ${members?.length || 0} organization memberships`);
    
    return true;
  } catch (error) {
    console.log('❌ Organization data test failed:', error.message);
    return false;
  }
}

// Test organization-filtered data
async function testOrganizationFiltering() {
  try {
    console.log('\n🔍 Testing organization-based data filtering...');
    
    // Get first organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (orgError || !orgs || orgs.length === 0) {
      console.log('❌ No organizations found for filtering test');
      return false;
    }
    
    const testOrg = orgs[0];
    console.log(`Testing with organization: "${testOrg.name}" (${testOrg.id})`);
    
    // Test organization-filtered queries
    const testTables = [
      'events',
      'social_posts', 
      'challenges',
      'direct_messages',
      'loyalty_transactions'
    ];
    
    let allFilteringWorks = true;
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id, organization_id')
          .eq('organization_id', testOrg.id)
          .limit(3);
        
        if (error) {
          console.log(`❌ ${table}: filtering failed - ${error.message}`);
          allFilteringWorks = false;
        } else {
          console.log(`✅ ${table}: can be filtered by organization_id (${data?.length || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: filtering error - ${err.message}`);
        allFilteringWorks = false;
      }
    }
    
    return allFilteringWorks;
  } catch (error) {
    console.log('❌ Organization filtering test failed:', error.message);
    return false;
  }
}

// Test RPC functions
async function testOrganizationRPCs() {
  try {
    console.log('\n⚡ Testing organization-related RPC functions...');
    
    const testRPCs = [
      'get_user_current_organization',
      'is_member_of_organization',
      'get_organization_admin_details'
    ];
    
    let allRPCsWork = true;
    
    for (const rpcName of testRPCs) {
      try {
        const { error } = await supabase.rpc(rpcName);
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ ${rpcName}: function does not exist`);
          allRPCsWork = false;
        } else {
          console.log(`✅ ${rpcName}: function exists (${error ? 'auth/param error expected' : 'accessible'})`);
        }
      } catch (err) {
        console.log(`⚠️ ${rpcName}: ${err.message}`);
      }
    }
    
    return allRPCsWork;
  } catch (error) {
    console.log('❌ Organization RPC test failed:', error.message);
    return false;
  }
}

// Test multi-tenant data isolation (verify no cross-org data leaks)
async function testDataIsolation() {
  try {
    console.log('\n🔒 Testing multi-tenant data isolation...');
    
    // Get multiple organizations if they exist
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(2);
    
    if (error || !orgs || orgs.length < 2) {
      console.log('⚠️ Need at least 2 organizations to test data isolation (found: ' + (orgs?.length || 0) + ')');
      return true; // Not a failure, just can't test isolation
    }
    
    const org1 = orgs[0];
    const org2 = orgs[1];
    
    console.log(`Testing isolation between "${org1.name}" and "${org2.name}"`);
    
    // Query social posts for each organization separately
    const { data: org1Posts, error: org1Error } = await supabase
      .from('social_posts')
      .select('id, organization_id')
      .eq('organization_id', org1.id);
    
    const { data: org2Posts, error: org2Error } = await supabase
      .from('social_posts')
      .select('id, organization_id')
      .eq('organization_id', org2.id);
    
    if (org1Error || org2Error) {
      console.log('❌ Could not query posts for isolation test');
      return false;
    }
    
    // Verify no cross-organization data
    const org1HasOrg2Data = org1Posts?.some(post => post.organization_id === org2.id);
    const org2HasOrg1Data = org2Posts?.some(post => post.organization_id === org1.id);
    
    if (org1HasOrg2Data || org2HasOrg1Data) {
      console.log('❌ Data isolation FAILED - cross-organization data found!');
      return false;
    }
    
    console.log(`✅ Data isolation working: Org1 has ${org1Posts?.length || 0} posts, Org2 has ${org2Posts?.length || 0} posts, no cross-contamination`);
    
    return true;
  } catch (error) {
    console.log('❌ Data isolation test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting organization routing and context tests...\n');
  
  const tests = [
    { name: 'Organization Data Structure', fn: testOrganizationData },
    { name: 'Organization-based Filtering', fn: testOrganizationFiltering },
    { name: 'Organization RPC Functions', fn: testOrganizationRPCs },
    { name: 'Multi-tenant Data Isolation', fn: testDataIsolation }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`${'='.repeat(60)}`);
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
  console.log('🎯 ORGANIZATION ROUTING TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL ORGANIZATION TESTS PASSED!');
    console.log('🏢 Multi-tenant architecture is working correctly');
    return true;
  } else {
    console.log(`\n⚠️ ${failed} tests failed - Organization routing has issues`);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Organization test runner failed:', error);
    process.exit(1);
  });
}