#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Simple Database Check');

async function checkWithSql() {
  console.log('\n📊 Checking tables using SQL query...');
  
  try {
    // Check what tables exist in public schema
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
    if (error) {
      console.log('❌ exec_sql failed:', error.message);
      
      // Try a simple select on auth.users to test connection
      const { data: authTest, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.log('❌ Auth test failed:', authError.message);
      } else {
        console.log('✅ Supabase connection works, but no exec_sql function');
      }
      
      return;
    }
    
    console.log('✅ Tables found:');
    if (data && data.length > 0) {
      data.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('  No tables found in public schema');
    }
    
  } catch (error) {
    console.log('❌ SQL check failed:', error.message);
  }
}

async function checkRpcFunctions() {
  console.log('\n🔧 Testing RPC functions...');
  
  const functions = [
    'is_member_of_organization',
    'is_admin_of_organization', 
    'get_user_role_in_organization',
    'get_user_current_organization'
  ];
  
  for (const func of functions) {
    try {
      const result = await supabase.rpc(func, { 
        org_id: '123e4567-e89b-12d3-a456-426614174000' 
      });
      console.log(`✅ ${func} exists`);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ ${func} missing`);
      } else {
        console.log(`✅ ${func} exists (failed with test data)`);
      }
    }
  }
}

async function main() {
  await checkWithSql();
  await checkRpcFunctions();
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('- RPC functions exist but tables are missing');
  console.log('- This suggests partial migration was applied');
  console.log('- Need to run the table creation scripts manually');
  console.log('\n📝 TO FIX:');
  console.log('1. Open Supabase Dashboard > SQL Editor');
  console.log('2. Execute MANUAL_MIGRATION_SCRIPT.sql');
  console.log('3. Execute CREATE_CORE_TABLES.sql');  
  console.log('4. Run this script again to verify');
}

main().catch(console.error);
