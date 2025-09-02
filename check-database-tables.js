#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function checkTables() {
  const tablesToCheck = [
    'profiles',
    'organizations',
    'organization_members',
    'events',
    'social_posts',
    'direct_messages',
    'challenges',
    'loyalty_transactions',
    'invite_codes'
  ];

  console.log('🔍 Checking database tables...\n');

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check if we have any data at all
  console.log('\n📊 Sample data check:');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(3);
      
    if (error) {
      console.log(`❌ Profiles sample: ${error.message}`);
    } else {
      console.log(`✅ Profiles sample: ${profiles?.length || 0} records`);
      if (profiles && profiles.length > 0) {
        console.log('   First profile:', profiles[0]);
      }
    }
  } catch (err) {
    console.log(`❌ Profiles sample: ${err.message}`);
  }
}

checkTables().catch(console.error);
