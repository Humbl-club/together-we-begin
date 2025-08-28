#!/usr/bin/env node

/**
 * Database setup verification script
 * This script verifies that all essential tables and functions exist
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ynqdddwponrqwhtqfepi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Database Setup Verification Started');

// Essential tables that must exist
const REQUIRED_TABLES = [
  // Multi-tenant foundation
  'organizations',
  'organization_members',
  'organization_features',
  'feature_catalog',
  
  // Core platform tables
  'profiles',
  'events',
  'event_registrations',
  'social_posts',
  'post_likes',
  'post_comments',
  'challenges',
  'challenge_participations',
  'loyalty_transactions',
  'user_roles',
  'direct_messages',
  'notifications'
];

// Essential RPC functions that must exist
const REQUIRED_FUNCTIONS = [
  'is_member_of_organization',
  'is_admin_of_organization',
  'get_user_role_in_organization',
  'get_user_current_organization'
];

async function checkTables() {
  console.log('\n📊 Checking required tables...');
  
  const results = {
    existing: [],
    missing: []
  };
  
  for (const tableName of REQUIRED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count(*)')
        .limit(0);
      
      if (error) {
        console.log(`❌ ${tableName} - ${error.message}`);
        results.missing.push(tableName);
      } else {
        console.log(`✅ ${tableName}`);
        results.existing.push(tableName);
      }
    } catch (err) {
      console.log(`❌ ${tableName} - ${err.message}`);
      results.missing.push(tableName);
    }
  }
  
  return results;
}

async function checkFunctions() {
  console.log('\n🔧 Checking required RPC functions...');
  
  const results = {
    existing: [],
    missing: []
  };
  
  for (const functionName of REQUIRED_FUNCTIONS) {
    try {
      // Test function by calling it with a dummy parameter
      await supabase.rpc(functionName, { 
        org_id: '00000000-0000-0000-0000-000000000000' 
      });
      console.log(`✅ ${functionName}`);
      results.existing.push(functionName);
    } catch (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log(`❌ ${functionName} - Function does not exist`);
        results.missing.push(functionName);
      } else {
        // Function exists but failed due to parameters/logic (expected)
        console.log(`✅ ${functionName} (exists but failed with test params)`);
        results.existing.push(functionName);
      }
    }
  }
  
  return results;
}

async function createDefaultOrganization() {
  console.log('\n🏢 Checking/Creating default organization...');
  
  try {
    // Check if default org exists
    const { data: existing, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'humbl-girls-club')
      .maybeSingle();
    
    if (existing) {
      console.log(`✅ Default organization exists: ${existing.name} (${existing.id})`);
      return existing.id;
    }
    
    if (error && !error.message.includes('No rows')) {
      console.log(`❌ Error checking organizations: ${error.message}`);
      return null;
    }
    
    // Create default organization (this will likely fail without auth, but we'll show what needs to be done)
    console.log('⚠️  Default organization needs to be created manually');
    console.log('📝 Execute this in Supabase Dashboard SQL Editor:');
    console.log(`
INSERT INTO organizations (name, slug, subscription_tier, max_members, settings)
VALUES (
  'Humbl Girls Club',
  'humbl-girls-club',
  'enterprise',
  10000,
  '{"theme": "default", "features": ["events", "challenges", "social", "loyalty", "messaging"]}'::jsonb
);
    `);
    
    return null;
    
  } catch (error) {
    console.log(`❌ Error with organizations table: ${error.message}`);
    return null;
  }
}

async function generateTypescriptTypes() {
  console.log('\n🔤 TypeScript types need regeneration...');
  console.log('📝 Run this command to regenerate types:');
  console.log('npx supabase gen types typescript --project-id=ynqdddwponrqwhtqfepi > client/src/integrations/supabase/types.ts');
}

async function showNextSteps(tableResults, functionResults) {
  console.log('\n📋 NEXT STEPS:');
  
  if (tableResults.missing.length > 0) {
    console.log('\n❌ Missing Tables - Execute these SQL scripts in Supabase Dashboard:');
    console.log('1. MANUAL_MIGRATION_SCRIPT.sql (multi-tenant foundation)');
    console.log('2. CREATE_CORE_TABLES.sql (core platform tables)');
  }
  
  if (functionResults.missing.length > 0) {
    console.log('\n❌ Missing Functions:');
    functionResults.missing.forEach(func => console.log(`   - ${func}`));
    console.log('   These should be created by MANUAL_MIGRATION_SCRIPT.sql');
  }
  
  if (tableResults.missing.length === 0 && functionResults.missing.length === 0) {
    console.log('\n✅ Database structure looks good!');
    console.log('📝 Next steps:');
    console.log('1. Create default organization (see SQL above)');
    console.log('2. Regenerate TypeScript types');
    console.log('3. Test organization context in frontend');
  }
}

async function main() {
  try {
    const tableResults = await checkTables();
    const functionResults = await checkFunctions();
    
    console.log('\n📊 SUMMARY:');
    console.log(`Tables: ${tableResults.existing.length}/${REQUIRED_TABLES.length} exist`);
    console.log(`Functions: ${functionResults.existing.length}/${REQUIRED_FUNCTIONS.length} exist`);
    
    await createDefaultOrganization();
    await generateTypescriptTypes();
    await showNextSteps(tableResults, functionResults);
    
    console.log('\n🎉 Verification completed');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

main().catch(console.error);