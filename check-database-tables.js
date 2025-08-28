#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ynqdddwponrqwhtqfepi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ',
  { auth: { persistSession: false } }
);

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