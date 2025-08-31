#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Use the same connection as the app
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔍 Verifying Local Supabase Connection...');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyConnection() {
  console.log('\n📊 Testing Critical Tables...');
  
  const criticalTables = [
    'profiles',
    'organizations', 
    'organization_members',
    'events',
    'challenges',
    'social_posts',
    'loyalty_transactions'
  ];
  
  let foundTables = 0;
  let missingTables = [];
  
  for (const table of criticalTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        console.log(`✅ ${table}: EXISTS (${data ? data.length : 0} rows)`);
        foundTables++;
      } else {
        console.log(`❌ ${table}: ${error.message}`);
        missingTables.push(table);
      }
    } catch (e) {
      console.log(`❌ ${table}: ERROR - ${e.message}`);
      missingTables.push(table);
    }
  }
  
  console.log(`\n📈 Summary: ${foundTables}/${criticalTables.length} critical tables found`);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing Critical Tables:');
    missingTables.forEach(t => console.log(`  - ${t}`));
    console.log('\nThese tables need to be created for the app to function properly.');
  } else {
    console.log('\n✅ All critical tables are present!');
  }
  
  // Test auth
  console.log('\n🔐 Testing Authentication...');
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (!authError) {
    console.log('✅ Auth service is accessible');
    console.log('  Session:', session ? 'Active' : 'None');
  } else {
    console.log('❌ Auth service error:', authError.message);
  }
  
  // Test storage
  console.log('\n📦 Testing Storage...');
  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
  if (!storageError) {
    console.log(`✅ Storage service is accessible (${buckets?.length || 0} buckets)`);
    if (buckets && buckets.length > 0) {
      buckets.forEach(b => console.log(`  - ${b.name}`));
    }
  } else {
    console.log('❌ Storage service error:', storageError.message);
  }
  
  console.log('\n🎉 Connection verification complete!');
}

verifyConnection().catch(console.error);