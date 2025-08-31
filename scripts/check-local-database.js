#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// LOCAL Supabase connection
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLocalDatabase() {
  console.log('🔍 Checking LOCAL Supabase Database Status...\n');
  
  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      // Try a different approach - query a known table
      const { data: profiles } = await supabase.from('profiles').select('count').limit(1);
      const { data: events } = await supabase.from('events').select('count').limit(1);
      const { data: organizations } = await supabase.from('organizations').select('count').limit(1);
      
      console.log('✅ Tables accessible via direct queries:');
      console.log('  - profiles:', profiles ? 'YES' : 'NO');
      console.log('  - events:', events ? 'YES' : 'NO');
      console.log('  - organizations:', organizations ? 'YES' : 'NO');
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables in local database`);
      if (tables && tables.length > 0) {
        console.log('\nTables found:');
        tables.forEach(t => console.log(`  - ${t.table_name}`));
      }
    }
    
    // Test some critical functions
    console.log('\n🔧 Testing Critical RPC Functions...');
    const criticalFunctions = [
      'get_organization_by_slug',
      'create_default_signup_page', 
      'get_dashboard_data_v2',
      'get_events_optimized'
    ];
    
    for (const func of criticalFunctions) {
      try {
        const { error } = await supabase.rpc(func, {});
        if (!error || error.message.includes('argument')) {
          console.log(`✅ ${func}: EXISTS`);
        } else {
          console.log(`❌ ${func}: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${func}: ERROR - ${e.message}`);
      }
    }
    
    // Check storage buckets
    console.log('\n📦 Checking Storage Buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (!bucketsError && buckets) {
      console.log(`Found ${buckets.length} storage buckets:`);
      buckets.forEach(b => console.log(`  - ${b.name} (${b.public ? 'public' : 'private'})`));
    } else {
      console.log('❌ Could not list storage buckets:', bucketsError?.message);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkLocalDatabase().catch(console.error);