#!/usr/bin/env node

/**
 * Script to regenerate TypeScript types from Supabase schema
 * Run this after database repair is complete
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'ynqdddwponrqwhtqfepi';
const TYPES_FILE = 'client/src/integrations/supabase/types.ts';

console.log('🔤 TypeScript Types Regeneration');

function backupCurrentTypes() {
  console.log('\n📋 Backing up current types...');
  
  if (fs.existsSync(TYPES_FILE)) {
    const backup = `${TYPES_FILE}.backup.${Date.now()}`;
    fs.copyFileSync(TYPES_FILE, backup);
    console.log(`✅ Current types backed up to: ${backup}`);
  } else {
    console.log('⚠️  No existing types file to backup');
  }
}

function generateTypes() {
  console.log('\n🔄 Generating new types from database...');
  
  try {
    const command = `npx supabase gen types typescript --project-id=${PROJECT_ID}`;
    console.log(`Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf-8',
      timeout: 30000 
    });
    
    // Write to types file
    fs.writeFileSync(TYPES_FILE, output);
    console.log(`✅ Types generated and saved to: ${TYPES_FILE}`);
    
    return true;
  } catch (error) {
    console.error('❌ Type generation failed:', error.message);
    
    if (error.message.includes('failed to connect')) {
      console.log('\n💡 This likely means:');
      console.log('  1. Database tables are still missing');
      console.log('  2. Execute the SQL scripts first');
      console.log('  3. Then run this script again');
    }
    
    return false;
  }
}

function validateGeneratedTypes() {
  console.log('\n🔍 Validating generated types...');
  
  if (!fs.existsSync(TYPES_FILE)) {
    console.log('❌ Types file not found');
    return false;
  }
  
  const content = fs.readFileSync(TYPES_FILE, 'utf-8');
  
  // Check for essential tables
  const requiredTables = [
    'organizations',
    'organization_members', 
    'organization_features',
    'profiles',
    'events',
    'social_posts'
  ];
  
  let missing = [];
  for (const table of requiredTables) {
    if (!content.includes(table)) {
      missing.push(table);
    }
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing tables in generated types:');
    missing.forEach(table => console.log(`  - ${table}`));
    console.log('\n💡 This suggests the database tables are still not created');
    return false;
  }
  
  console.log('✅ All essential tables found in generated types');
  
  // Check file size (should be substantial)
  const stats = fs.statSync(TYPES_FILE);
  console.log(`📊 Generated types file size: ${Math.round(stats.size / 1024)}KB`);
  
  if (stats.size < 10000) {
    console.log('⚠️  Types file seems small - may be incomplete');
    return false;
  }
  
  return true;
}

function showNextSteps() {
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Restart your development server');
  console.log('2. Check for TypeScript errors in the organization context');
  console.log('3. Test organization-related functionality');
  console.log('4. Verify multi-tenant data isolation works');
}

async function main() {
  try {
    backupCurrentTypes();
    
    const success = generateTypes();
    if (!success) {
      console.log('\n❌ Type generation failed');
      console.log('📋 Required steps before running this:');
      console.log('1. Execute MANUAL_MIGRATION_SCRIPT.sql in Supabase Dashboard');
      console.log('2. Execute CREATE_CORE_TABLES.sql in Supabase Dashboard');
      console.log('3. Verify tables exist with: node verify_database_setup.js');
      return;
    }
    
    const valid = validateGeneratedTypes();
    if (!valid) {
      console.log('\n⚠️  Types generated but may be incomplete');
    }
    
    showNextSteps();
    console.log('\n🎉 Type regeneration completed');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

main().catch(console.error);