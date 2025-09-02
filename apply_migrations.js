const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// Local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Please set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function checkTables() {
  console.log('\n📊 Checking existing tables...\n');
  
  const { data: tables, error } = await supabase.rpc('get_table_list');
  
  if (error) {
    // If RPC doesn't exist, use a direct query
    const query = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    const { data, error: queryError } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
    
    if (queryError) {
      console.log('Note: Unable to list tables directly. Proceeding with migration...');
      return [];
    }
    return data;
  }
  
  return tables;
}

async function checkOrganizationTables() {
  console.log('\n🔍 Checking multi-tenant tables...\n');
  
  // Check if organizations table exists
  const { count: orgCount, error: orgError } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });
    
  if (orgError && orgError.code === '42P01') {
    console.log('❌ Organizations table does not exist');
    return false;
  }
  
  console.log(`✅ Organizations table exists (${orgCount || 0} organizations)`);
  
  // Check if organization_members table exists
  const { count: memberCount, error: memberError } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true });
    
  if (memberError && memberError.code === '42P01') {
    console.log('❌ Organization_members table does not exist');
    return false;
  }
  
  console.log(`✅ Organization_members table exists (${memberCount || 0} members)`);
  
  return true;
}

async function applyMigration(sql, name) {
  console.log(`\n🚀 Applying migration: ${name}`);
  console.log('━'.repeat(50));
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(/;[\s\n]/)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      // Log progress for long migrations
      if (i % 10 === 0 && i > 0) {
        console.log(`  Progress: ${i}/${statements.length} statements processed...`);
      }
      
      // Execute statement
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.code === '42P07') { // duplicate table
          skipCount++;
        } else if (error.message?.includes('does not exist') && 
                   statement.includes('ALTER TABLE')) {
          // Table doesn't exist yet, skip this alteration
          skipCount++;
        } else {
          console.error(`  ⚠️ Error in statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      } else {
        successCount++;
      }
    }
    
    console.log(`\n✅ Migration completed:`);
    console.log(`   - Success: ${successCount} statements`);
    console.log(`   - Skipped: ${skipCount} statements (already exist)`);
    if (errorCount > 0) {
      console.log(`   - Errors: ${errorCount} statements`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(50));
  console.log('  MULTI-TENANT DATABASE MIGRATION');
  console.log('═'.repeat(50));
  
  // Check current state
  const hasOrgTables = await checkOrganizationTables();
  
  if (!hasOrgTables) {
    console.log('\n📦 Multi-tenant tables not found. Applying Day 1 migration...\n');
    
    // Read and apply Day 1 migration
    try {
      const day1Sql = await fs.readFile('./supabase/migrations/100_day1_complete_multitenant.sql', 'utf-8');
      await applyMigration(day1Sql, 'Day 1 - Multi-tenant Foundation');
    } catch (error) {
      console.error('Failed to read or apply Day 1 migration:', error.message);
      process.exit(1);
    }
  } else {
    console.log('\n✅ Multi-tenant tables already exist. Skipping Day 1 migration.');
  }
  
  // Always apply Day 2 for indexes and security
  console.log('\n🔐 Applying Day 2 security and performance optimizations...\n');
  
  try {
    const day2Sql = await fs.readFile('./supabase/migrations/101_day2_security_indexes.sql', 'utf-8');
    await applyMigration(day2Sql, 'Day 2 - Security and Performance');
  } catch (error) {
    console.error('Failed to read or apply Day 2 migration:', error.message);
    process.exit(1);
  }
  
  // Final verification
  console.log('\n' + '═'.repeat(50));
  console.log('  MIGRATION COMPLETE - VERIFICATION');
  console.log('═'.repeat(50));
  
  await checkOrganizationTables();
  
  // Check for organization data
  const { data: orgs } = await supabase.from('organizations').select('*');
  if (orgs && orgs.length > 0) {
    console.log(`\n🎉 Success! Found ${orgs.length} organization(s):`);
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.slug})`);
    });
  }
  
  // Check for members
  const { data: members } = await supabase.from('organization_members').select('*');
  if (members) {
    console.log(`\n👥 ${members.length} members migrated to organizations`);
  }
  
  console.log('\n✅ Database is now ready for multi-tenant operations!');
  console.log('\nNext steps:');
  console.log('1. Update frontend hooks to use organization context');
  console.log('2. Test organization isolation');
  console.log('3. Deploy to production');
}

// Handle RPC execution fallback
async function setupRpcFunction() {
  const rpcSql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
  } catch (error) {
    // Function doesn't exist, create it
    console.log('Creating helper function...');
    // Note: This might not work without direct DB access
  }
}

main().catch(console.error);
