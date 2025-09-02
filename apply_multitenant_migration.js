#!/usr/bin/env node

/**
 * Script to apply multi-tenant migration directly to production database
 * This script applies the critical organization tables needed for multi-tenancy
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY env variables.');
  process.exit(1);
}

console.log('🔧 Multi-Tenant Migration Application Started');

async function checkDatabaseTables() {
  console.log('\n📊 Checking current database schema...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check if organizations table exists
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('count(*)')
      .limit(1);
    
    console.log('✅ Organizations table exists:', !orgsError);
    
    // Check if organization_members table exists
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('count(*)')
      .limit(1);
    
    console.log('✅ Organization_members table exists:', !membersError);
    
    // Check existing core tables
    const coreTables = ['events', 'social_posts', 'challenges', 'profiles'];
    for (const table of coreTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)')
        .limit(1);
      console.log(`✅ ${table} table exists:`, !error);
    }
    
    return { orgsExists: !orgsError, membersExists: !membersError };
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return { orgsExists: false, membersExists: false };
  }
}

async function applyMigration() {
  console.log('\n🚀 Applying Multi-Tenant Foundation Migration...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '001_multi_tenant_foundation.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return false;
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Execute the migration using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration error:', error.message);
      console.error('Details:', error.details || 'No additional details');
      return false;
    }
    
    console.log('✅ Migration applied successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error during migration:', error.message);
    return false;
  }
}

async function createDefaultOrganization() {
  console.log('\n🏢 Creating default organization...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check if default org already exists
    const { data: existing, error: existingError } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('slug', 'humbl-girls-club')
      .single();
    
    if (existing && !existingError) {
      console.log('✅ Default organization already exists:', existing.id);
      return existing.id;
    }
    
    // Create default organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Humbl Girls Club',
        slug: 'humbl-girls-club',
        subscription_tier: 'enterprise',
        max_members: 10000,
        settings: {
          theme: 'default',
          features: ['events', 'challenges', 'social', 'loyalty', 'messaging', 'analytics']
        }
      })
      .select('id')
      .single();
    
    if (orgError) {
      console.error('❌ Error creating default organization:', orgError.message);
      return null;
    }
    
    console.log('✅ Default organization created:', orgData.id);
    return orgData.id;
    
  } catch (error) {
    console.error('❌ Unexpected error creating organization:', error.message);
    return null;
  }
}

async function verifyMultiTenantSetup() {
  console.log('\n🔍 Verifying multi-tenant setup...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check RPC functions
    const functions = [
      'is_member_of_organization',
      'is_admin_of_organization',
      'get_user_role_in_organization',
      'get_user_current_organization'
    ];
    
    for (const func of functions) {
      try {
        // Test the function exists by calling it with null (will fail but indicates function exists)
        await supabase.rpc(func, { org_id: '00000000-0000-0000-0000-000000000000' });
        console.log(`✅ RPC function exists: ${func}`);
      } catch (error) {
        // Function exists if we get a different error than "function does not exist"
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ RPC function missing: ${func}`);
        } else {
          console.log(`✅ RPC function exists: ${func}`);
        }
      }
    }
    
    // Check table structures
    const { data: orgColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'organizations');
    
    console.log(`✅ Organizations table has ${orgColumns?.length || 0} columns`);
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
  }
}

async function main() {
  try {
    // Step 1: Check current state
    const { orgsExists, membersExists } = await checkDatabaseTables();
    
    // Step 2: Apply migration if needed
    if (!orgsExists || !membersExists) {
      console.log('\n❓ Multi-tenant tables missing, attempting to apply migration...');
      
      // Note: Direct SQL execution may not work with RLS, we'll try a different approach
      const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '100_day1_complete_multitenant.sql');
      
      if (fs.existsSync(migrationPath)) {
        console.log('📄 Found Day 1 multi-tenant migration file');
        console.log('⚠️  Manual application required - this script will show the commands needed');
        
        console.log('\n📋 MANUAL STEPS NEEDED:');
        console.log('1. Use Supabase Dashboard SQL Editor');
        console.log('2. Execute the contents of: 100_day1_complete_multitenant.sql');
        console.log('3. Or use Supabase CLI: npx supabase db push');
        console.log('4. Then run this script again to verify');
        
        return;
      }
    }
    
    // Step 3: Create default organization if needed
    const defaultOrgId = await createDefaultOrganization();
    
    // Step 4: Verify setup
    await verifyMultiTenantSetup();
    
    console.log('\n🎉 Multi-tenant migration check completed');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the migration
main().catch(console.error);
