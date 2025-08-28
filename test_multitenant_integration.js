#!/usr/bin/env node

/**
 * Multi-tenant integration test script
 * This tests that the frontend can properly connect to the backend
 * and that organization-aware queries work
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ynqdddwponrqwhtqfepi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Multi-tenant Integration Test');

async function testDatabaseConnection() {
  console.log('\n🔌 Testing database connection...');
  
  try {
    // Try to fetch from organizations table
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(1);
    
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Database connection successful');
    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} organization(s)`);
      data.forEach(org => console.log(`   - ${org.name} (${org.slug})`));
    } else {
      console.log('⚠️  No organizations found');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
    return false;
  }
}

async function testCoreTablesExist() {
  console.log('\n📊 Testing core tables...');
  
  const tables = [
    'organizations',
    'organization_members',
    'organization_features',
    'feature_catalog',
    'profiles',
    'events',
    'social_posts',
    'challenges',
    'loyalty_transactions'
  ];
  
  const results = {
    working: [],
    missing: []
  };
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count(*)')
        .limit(0);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results.missing.push(table);
      } else {
        console.log(`✅ ${table}`);
        results.working.push(table);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      results.missing.push(table);
    }
  }
  
  return results;
}

async function testRpcFunctions() {
  console.log('\n🔧 Testing RPC functions...');
  
  const functions = [
    { name: 'is_member_of_organization', param: 'org_id' },
    { name: 'is_admin_of_organization', param: 'org_id' },
    { name: 'get_user_role_in_organization', param: 'org_id' },
    { name: 'get_user_current_organization', param: null }
  ];
  
  const results = {
    working: [],
    missing: []
  };
  
  for (const func of functions) {
    try {
      const params = func.param ? { [func.param]: '123e4567-e89b-12d3-a456-426614174000' } : {};
      
      await supabase.rpc(func.name, params);
      console.log(`✅ ${func.name}`);
      results.working.push(func.name);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ ${func.name}: Function missing`);
        results.missing.push(func.name);
      } else {
        console.log(`✅ ${func.name} (exists, failed with test params)`);
        results.working.push(func.name);
      }
    }
  }
  
  return results;
}

async function testOrganizationWorkflow() {
  console.log('\n🏢 Testing organization workflow...');
  
  try {
    // 1. Check if default organization exists
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'humbl-girls-club')
      .maybeSingle();
    
    if (orgError) {
      console.log(`❌ Failed to check organizations: ${orgError.message}`);
      return false;
    }
    
    if (!orgs) {
      console.log('⚠️  Default organization not found');
      console.log('💡 Create it with this SQL:');
      console.log(`
INSERT INTO organizations (name, slug, subscription_tier, max_members, settings)
VALUES (
  'Humbl Girls Club',
  'humbl-girls-club',
  'enterprise', 
  10000,
  '{"theme": "default", "features": ["events", "challenges", "social", "loyalty"]}'::jsonb
);`);
      return false;
    }
    
    console.log(`✅ Default organization found: ${orgs.name}`);
    
    // 2. Check organization features
    const { data: features, error: featuresError } = await supabase
      .from('organization_features')
      .select('feature_key, enabled')
      .eq('organization_id', orgs.id);
    
    if (featuresError) {
      console.log(`⚠️  Could not check features: ${featuresError.message}`);
    } else {
      console.log(`✅ Organization has ${features?.length || 0} feature configurations`);
    }
    
    // 3. Check feature catalog
    const { data: catalog, error: catalogError } = await supabase
      .from('feature_catalog')
      .select('key, name, category')
      .limit(5);
    
    if (catalogError) {
      console.log(`⚠️  Could not check feature catalog: ${catalogError.message}`);
    } else {
      console.log(`✅ Feature catalog has ${catalog?.length || 0} available features`);
      if (catalog && catalog.length > 0) {
        catalog.forEach(feature => console.log(`   - ${feature.name} (${feature.key})`));
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Organization workflow test failed: ${error.message}`);
    return false;
  }
}

function generateSummaryReport(connectionTest, tablesTest, functionsTest, workflowTest) {
  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('==========================================');
  
  console.log(`Database Connection: ${connectionTest ? '✅' : '❌'}`);
  console.log(`Tables Working: ${tablesTest.working.length}/${tablesTest.working.length + tablesTest.missing.length}`);
  console.log(`RPC Functions Working: ${functionsTest.working.length}/${functionsTest.working.length + functionsTest.missing.length}`);
  console.log(`Organization Workflow: ${workflowTest ? '✅' : '❌'}`);
  
  if (tablesTest.missing.length > 0) {
    console.log('\n❌ Missing Tables:');
    tablesTest.missing.forEach(table => console.log(`   - ${table}`));
  }
  
  if (functionsTest.missing.length > 0) {
    console.log('\n❌ Missing Functions:');
    functionsTest.missing.forEach(func => console.log(`   - ${func}`));
  }
  
  const allWorking = connectionTest && 
                     tablesTest.missing.length === 0 && 
                     functionsTest.missing.length === 0 && 
                     workflowTest;
  
  console.log('\n==========================================');
  if (allWorking) {
    console.log('🎉 ALL TESTS PASSED - Multi-tenant system ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Test organization context loading');
    console.log('3. Create test user and organization');
  } else {
    console.log('❌ TESTS FAILED - Database repair needed');
    console.log('\n📋 Required fixes:');
    console.log('1. Execute MANUAL_MIGRATION_SCRIPT.sql');
    console.log('2. Execute CREATE_CORE_TABLES.sql');
    console.log('3. Create default organization');
    console.log('4. Regenerate TypeScript types');
  }
}

async function main() {
  try {
    const connectionTest = await testDatabaseConnection();
    const tablesTest = await testCoreTablesExist();
    const functionsTest = await testRpcFunctions();
    const workflowTest = await testOrganizationWorkflow();
    
    generateSummaryReport(connectionTest, tablesTest, functionsTest, workflowTest);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

main().catch(console.error);