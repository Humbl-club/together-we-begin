/**
 * DATABASE STATE VERIFICATION TEST SUITE
 * 
 * This comprehensive test suite verifies the current state of the Supabase database
 * and identifies exactly what exists vs what's missing for the multi-tenant platform.
 * 
 * Usage: node test-database-state.js
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// Database connection
const SUPABASE_URL = "https://ynqdddwponrqwhtqfepi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expected tables according to CLAUDE.md
const EXPECTED_TABLES = {
  // Core Multi-Tenant Tables (10 tables)
  'organizations': { category: 'Core Multi-Tenant', required: true },
  'organization_members': { category: 'Core Multi-Tenant', required: true },
  'organization_features': { category: 'Core Multi-Tenant', required: true },
  'organization_themes': { category: 'Core Multi-Tenant', required: true },
  'organization_typography': { category: 'Core Multi-Tenant', required: true },
  'organization_layouts': { category: 'Core Multi-Tenant', required: true },
  'organization_branding': { category: 'Core Multi-Tenant', required: true },
  'organization_bans': { category: 'Core Multi-Tenant', required: true },
  'club_signup_pages': { category: 'Core Multi-Tenant', required: true },
  'feature_catalog': { category: 'Core Multi-Tenant', required: true },

  // User & Authentication (8 tables)
  'profiles': { category: 'User & Authentication', required: true },
  'user_roles': { category: 'User & Authentication', required: true },
  'user_settings': { category: 'User & Authentication', required: true },
  'privacy_settings': { category: 'User & Authentication', required: true },
  'user_notification_settings': { category: 'User & Authentication', required: true },
  'user_appearance_settings': { category: 'User & Authentication', required: true },
  'user_social_settings': { category: 'User & Authentication', required: true },
  'user_wellness_settings': { category: 'User & Authentication', required: true },

  // Events System (4 tables)
  'events': { category: 'Events System', required: true },
  'event_registrations': { category: 'Events System', required: true },
  'event_attendance': { category: 'Events System', required: true },
  'event_qr_codes': { category: 'Events System', required: true },

  // Wellness & Challenges (6 tables)
  'challenges': { category: 'Wellness & Challenges', required: true },
  'challenge_participations': { category: 'Wellness & Challenges', required: true },
  'challenge_cycles': { category: 'Wellness & Challenges', required: true },
  'walking_leaderboards': { category: 'Wellness & Challenges', required: true },
  'health_data': { category: 'Wellness & Challenges', required: true },
  'step_validation_logs': { category: 'Wellness & Challenges', required: true },

  // Social Platform (7 tables)
  'social_posts': { category: 'Social Platform', required: true },
  'post_likes': { category: 'Social Platform', required: true },
  'post_comments': { category: 'Social Platform', required: true },
  'post_reactions': { category: 'Social Platform', required: true },
  'direct_messages': { category: 'Social Platform', required: true },
  'message_threads': { category: 'Social Platform', required: true },
  'blocked_users': { category: 'Social Platform', required: true },

  // Loyalty & Rewards (6 tables)
  'loyalty_transactions': { category: 'Loyalty & Rewards', required: true },
  'rewards_catalog': { category: 'Loyalty & Rewards', required: true },
  'reward_redemptions': { category: 'Loyalty & Rewards', required: true },
  'expired_points': { category: 'Loyalty & Rewards', required: true },
  'points_expiration_policies': { category: 'Loyalty & Rewards', required: true },
  'user_achievements': { category: 'Loyalty & Rewards', required: true },

  // Platform Administration (12 tables)
  'platform_admins': { category: 'Platform Administration', required: true },
  'platform_analytics': { category: 'Platform Administration', required: true },
  'platform_billing': { category: 'Platform Administration', required: true },
  'platform_incidents': { category: 'Platform Administration', required: true },
  'platform_audit_logs': { category: 'Platform Administration', required: true },
  'platform_feature_flags': { category: 'Platform Administration', required: true },
  'admin_actions': { category: 'Platform Administration', required: true },
  'content_reports': { category: 'Platform Administration', required: true },
  'content_deletions': { category: 'Platform Administration', required: true },
  'moderation_actions': { category: 'Platform Administration', required: true },
  'user_warnings': { category: 'Platform Administration', required: true },
  'content_moderation_queue': { category: 'Platform Administration', required: true },

  // Extreme Modularity System (11 tables)
  'dashboard_widgets': { category: 'Extreme Modularity System', required: true },
  'dashboard_layouts': { category: 'Extreme Modularity System', required: true },
  'widget_templates': { category: 'Extreme Modularity System', required: true },
  'navigation_items': { category: 'Extreme Modularity System', required: true },
  'google_fonts_catalog': { category: 'Extreme Modularity System', required: true },
  'theme_presets': { category: 'Extreme Modularity System', required: true },
  'font_presets': { category: 'Extreme Modularity System', required: true },
  'container_presets': { category: 'Extreme Modularity System', required: true },
  'system_configurations': { category: 'Extreme Modularity System', required: true },
  'performance_metrics': { category: 'Extreme Modularity System', required: true },
  'notifications': { category: 'Extreme Modularity System', required: true },

  // Storage & Invites (8 tables)
  'invite_codes': { category: 'Storage & Invites', required: true },
  'invite_redemptions': { category: 'Storage & Invites', required: true },
  'email_invitations': { category: 'Storage & Invites', required: true },
  'push_subscriptions': { category: 'Storage & Invites', required: true },
  'integration_settings': { category: 'Storage & Invites', required: true },
  'notification_templates': { category: 'Storage & Invites', required: true },
  'system_config': { category: 'Storage & Invites', required: true },
  'invites': { category: 'Storage & Invites', required: true }
};

// Expected RPC functions according to CLAUDE.md
const EXPECTED_RPC_FUNCTIONS = [
  // Organization Management (15 functions)
  'is_member_of_organization',
  'is_admin_of_organization', 
  'get_user_role_in_organization',
  'get_user_current_organization',
  'get_organization_by_slug',
  'get_organization_theme',
  'get_organization_admin_details',
  'get_organizations_for_admin',
  'ban_user_from_organization',
  'calculate_organization_health_scores',
  'update_organization_status',
  'create_default_signup_page',
  'create_extreme_modularity_defaults',
  'is_organization_admin',
  'get_organization_members_for_admin',

  // Platform Administration (12 functions)
  'is_platform_admin',
  'assign_super_admin_role',
  'auto_assign_platform_admin',
  'get_platform_statistics',
  'get_platform_statistics_real',
  'fix_orphaned_records',
  'get_migration_status',
  'expire_temporary_bans',
  'auto_ban_after_warnings',
  'get_user_warning_count',
  'cleanup_expired_points_regularly',
  'log_admin_action',

  // Theme & Modularity (10 functions)
  'apply_theme_preset',
  'create_default_theme_settings',
  'create_default_dashboard_layout',
  'load_google_font',
  'update_widget_positions',
  'get_user_dashboard_optimized',
  'refresh_dashboard_stats',
  'get_dashboard_data_v2',
  'get_unread_counts_for_user',
  'update_user_last_seen',

  // Event Management (8 functions)
  'get_events_optimized',
  'register_for_event',
  'generate_event_qr_code',
  'mark_event_attendance',
  'increment_event_capacity',
  'create_event_with_defaults',
  'cancel_event_and_refund',
  'get_event_attendees',

  // Social Features (10 functions)
  'get_social_posts_optimized',
  'get_user_threads_optimized',
  'mark_thread_messages_read',
  'create_post_with_media',
  'delete_post_cascade',
  'report_content',
  'block_user',
  'unblock_user',
  'get_blocked_users',
  'get_user_activity_summary',

  // Loyalty & Rewards (8 functions)
  'get_user_available_points',
  'redeem_reward',
  'expire_old_points',
  'admin_adjust_user_points',
  'calculate_loyalty_tier',
  'award_achievement',
  'get_redemption_history',
  'process_points_expiration',

  // Authentication & Roles (7 functions)
  'is_admin',
  'has_role',
  'assign_user_role',
  'remove_user_role',
  'get_users_with_roles',
  'switch_user_role',
  'get_role_permissions',

  // Content Moderation (6 functions)
  'moderate_content',
  'get_content_for_moderation',
  'resolve_content_reports',
  'delete_content_with_audit',
  'get_moderation_queue_real',
  'process_user_warning',

  // Invites & Onboarding (6 functions)
  'create_invite_code',
  'redeem_invite_code',
  'use_invite_code',
  'generate_invite_code',
  'validate_invite_code',
  'auto_generate_invite_code'
];

// Test results storage
let testResults = {
  tables: {
    existing: [],
    missing: [],
    categories: {}
  },
  functions: {
    existing: [],
    missing: []
  },
  connectivity: {
    authenticated: false,
    canQuery: false,
    error: null
  },
  multiTenant: {
    organizationsTableExists: false,
    organizationIdColumns: [],
    rlsPolicies: []
  }
};

/**
 * Test basic database connectivity
 */
async function testConnectivity() {
  console.log(chalk.blue('\n📡 TESTING DATABASE CONNECTIVITY...'));
  
  try {
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    testResults.connectivity.authenticated = user !== null;
    
    if (authError) {
      console.log(chalk.yellow('⚠️  No authenticated user (expected for anonymous connection)'));
    } else if (user) {
      console.log(chalk.green(`✅ User authenticated: ${user.email || user.id}`));
    }

    // Test basic query capability
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    testResults.connectivity.canQuery = true;
    console.log(chalk.green('✅ Database connection successful'));
    console.log(chalk.green(`✅ Can execute queries`));
    
  } catch (error) {
    testResults.connectivity.error = error.message;
    console.log(chalk.red(`❌ Database connectivity failed: ${error.message}`));
    return false;
  }
  
  return true;
}

/**
 * Get all existing tables in the database
 */
async function getExistingTables() {
  console.log(chalk.blue('\n📊 DISCOVERING EXISTING TABLES...'));
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) throw error;
    
    const tableNames = data.map(t => t.table_name).filter(name => 
      !name.startsWith('_') && // Skip internal tables
      name !== 'spatial_ref_sys' && // Skip PostGIS tables
      name !== 'geography_columns' &&
      name !== 'geometry_columns'
    );
    
    console.log(chalk.green(`✅ Found ${tableNames.length} tables in public schema`));
    return tableNames;
    
  } catch (error) {
    console.log(chalk.red(`❌ Failed to get existing tables: ${error.message}`));
    return [];
  }
}

/**
 * Get all existing RPC functions
 */
async function getExistingFunctions() {
  console.log(chalk.blue('\n🔧 DISCOVERING EXISTING RPC FUNCTIONS...'));
  
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION')
      .order('routine_name');
    
    if (error) throw error;
    
    const functionNames = data.map(f => f.routine_name);
    console.log(chalk.green(`✅ Found ${functionNames.length} RPC functions`));
    return functionNames;
    
  } catch (error) {
    console.log(chalk.red(`❌ Failed to get existing functions: ${error.message}`));
    return [];
  }
}

/**
 * Test multi-tenant specific requirements
 */
async function testMultiTenantRequirements(existingTables) {
  console.log(chalk.blue('\n🏢 TESTING MULTI-TENANT REQUIREMENTS...'));
  
  // Check if organizations table exists
  testResults.multiTenant.organizationsTableExists = existingTables.includes('organizations');
  
  if (testResults.multiTenant.organizationsTableExists) {
    console.log(chalk.green('✅ Organizations table exists'));
    
    // Test if we can query it
    try {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      console.log(chalk.green(`✅ Organizations table is queryable (${count || 0} records)`));
    } catch (error) {
      console.log(chalk.red(`❌ Cannot query organizations table: ${error.message}`));
    }
  } else {
    console.log(chalk.red('❌ Organizations table missing - CRITICAL for multi-tenant'));
  }
  
  // Check for organization_id columns in other tables
  console.log(chalk.blue('\n🔍 Checking for organization_id columns...'));
  
  const tablesWithOrgId = [];
  for (const tableName of existingTables) {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .eq('column_name', 'organization_id');
      
      if (error) continue;
      
      if (data && data.length > 0) {
        tablesWithOrgId.push(tableName);
      }
    } catch (error) {
      // Skip tables we can't inspect
      continue;
    }
  }
  
  testResults.multiTenant.organizationIdColumns = tablesWithOrgId;
  console.log(chalk.green(`✅ Found ${tablesWithOrgId.length} tables with organization_id column`));
  tablesWithOrgId.forEach(table => {
    console.log(chalk.gray(`   - ${table}`));
  });
}

/**
 * Test RLS policies
 */
async function testRLSPolicies(existingTables) {
  console.log(chalk.blue('\n🔒 TESTING ROW LEVEL SECURITY POLICIES...'));
  
  let totalPolicies = 0;
  const policiesByTable = {};
  
  for (const tableName of existingTables) {
    try {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('policyname, cmd')
        .eq('schemaname', 'public')
        .eq('tablename', tableName);
      
      if (error) continue;
      
      if (data && data.length > 0) {
        policiesByTable[tableName] = data.length;
        totalPolicies += data.length;
      }
    } catch (error) {
      // Skip if we can't access pg_policies
      continue;
    }
  }
  
  console.log(chalk.green(`✅ Found ${totalPolicies} RLS policies across ${Object.keys(policiesByTable).length} tables`));
  
  // Show top tables with most policies
  const sortedPolicies = Object.entries(policiesByTable)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  if (sortedPolicies.length > 0) {
    console.log(chalk.gray('\nTop tables by policy count:'));
    sortedPolicies.forEach(([table, count]) => {
      console.log(chalk.gray(`   - ${table}: ${count} policies`));
    });
  }
  
  testResults.multiTenant.rlsPolicies = policiesByTable;
}

/**
 * Analyze table completeness by category
 */
function analyzeTableCompleteness(existingTables) {
  console.log(chalk.blue('\n📋 ANALYZING TABLE COMPLETENESS BY CATEGORY...'));
  
  // Initialize category tracking
  const categories = {};
  
  Object.entries(EXPECTED_TABLES).forEach(([tableName, tableInfo]) => {
    if (!categories[tableInfo.category]) {
      categories[tableInfo.category] = {
        expected: 0,
        existing: 0,
        missing: []
      };
    }
    
    categories[tableInfo.category].expected++;
    
    if (existingTables.includes(tableName)) {
      categories[tableInfo.category].existing++;
      testResults.tables.existing.push(tableName);
    } else {
      categories[tableInfo.category].missing.push(tableName);
      testResults.tables.missing.push(tableName);
    }
  });
  
  testResults.tables.categories = categories;
  
  // Report by category
  Object.entries(categories).forEach(([categoryName, stats]) => {
    const percentage = Math.round((stats.existing / stats.expected) * 100);
    const statusColor = percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red';
    
    console.log(chalk[statusColor](`\n${categoryName}: ${stats.existing}/${stats.expected} (${percentage}%)`));
    
    if (stats.missing.length > 0) {
      console.log(chalk.red('  Missing:'));
      stats.missing.forEach(tableName => {
        console.log(chalk.red(`    - ${tableName}`));
      });
    }
  });
}

/**
 * Test specific critical organization queries
 */
async function testCriticalOrganizationQueries() {
  console.log(chalk.blue('\n🎯 TESTING CRITICAL ORGANIZATION QUERIES...'));
  
  const criticalTests = [
    {
      name: 'Organizations table basic query',
      test: async () => {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, created_at')
          .limit(5);
        return { data, error };
      }
    },
    {
      name: 'Organization members relationship',
      test: async () => {
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            id, 
            role, 
            organizations!inner (
              name,
              slug
            )
          `)
          .limit(3);
        return { data, error };
      }
    },
    {
      name: 'Platform admin check',
      test: async () => {
        const { data, error } = await supabase
          .from('platform_admins')
          .select('id, role, is_active')
          .eq('is_active', true)
          .limit(5);
        return { data, error };
      }
    },
    {
      name: 'RPC function test - is_platform_admin',
      test: async () => {
        const { data, error } = await supabase
          .rpc('is_platform_admin');
        return { data, error };
      }
    },
    {
      name: 'Feature catalog query',
      test: async () => {
        const { data, error } = await supabase
          .from('feature_catalog')
          .select('feature_key, name, category')
          .eq('available', true)
          .limit(10);
        return { data, error };
      }
    }
  ];
  
  for (const criticalTest of criticalTests) {
    try {
      const result = await criticalTest.test();
      if (result.error) {
        console.log(chalk.red(`❌ ${criticalTest.name}: ${result.error.message}`));
      } else {
        const dataCount = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0);
        console.log(chalk.green(`✅ ${criticalTest.name}: ${dataCount} records`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${criticalTest.name}: ${error.message}`));
    }
  }
}

/**
 * Generate comprehensive report
 */
function generateReport() {
  console.log(chalk.blue('\n📄 COMPREHENSIVE DATABASE STATE REPORT'));
  console.log('='.repeat(80));
  
  // Connectivity Summary
  console.log(chalk.blue('\n🔌 CONNECTIVITY SUMMARY:'));
  console.log(`Authentication: ${testResults.connectivity.authenticated ? chalk.green('✅ Active') : chalk.yellow('⚠️  Anonymous')}`);
  console.log(`Query Capability: ${testResults.connectivity.canQuery ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  
  // Table Summary
  console.log(chalk.blue('\n📊 TABLE SUMMARY:'));
  const totalExpected = Object.keys(EXPECTED_TABLES).length;
  const totalExisting = testResults.tables.existing.length;
  const completionPercentage = Math.round((totalExisting / totalExpected) * 100);
  
  console.log(`Total Expected: ${totalExpected}`);
  console.log(`Total Existing: ${totalExisting}`);
  console.log(`Completion: ${completionPercentage}%`);
  console.log(`Missing: ${testResults.tables.missing.length} tables`);
  
  // Function Summary
  console.log(chalk.blue('\n🔧 FUNCTION SUMMARY:'));
  const totalExpectedFunctions = EXPECTED_RPC_FUNCTIONS.length;
  const totalExistingFunctions = testResults.functions.existing.length;
  const functionCompletionPercentage = Math.round((totalExistingFunctions / totalExpectedFunctions) * 100);
  
  console.log(`Total Expected: ${totalExpectedFunctions}`);
  console.log(`Total Existing: ${totalExistingFunctions}`);
  console.log(`Completion: ${functionCompletionPercentage}%`);
  console.log(`Missing: ${testResults.functions.missing.length} functions`);
  
  // Multi-Tenant Summary
  console.log(chalk.blue('\n🏢 MULTI-TENANT STATUS:'));
  console.log(`Organizations Table: ${testResults.multiTenant.organizationsTableExists ? chalk.green('✅ Exists') : chalk.red('❌ Missing')}`);
  console.log(`Tables with organization_id: ${testResults.multiTenant.organizationIdColumns.length}`);
  console.log(`RLS Policies: ${Object.values(testResults.multiTenant.rlsPolicies).reduce((a, b) => a + b, 0)}`);
  
  // Critical Issues
  console.log(chalk.blue('\n🚨 CRITICAL ISSUES:'));
  const criticalIssues = [];
  
  if (!testResults.connectivity.canQuery) {
    criticalIssues.push('❌ Cannot query database');
  }
  if (!testResults.multiTenant.organizationsTableExists) {
    criticalIssues.push('❌ Organizations table missing - breaks multi-tenant architecture');
  }
  if (testResults.tables.missing.includes('platform_admins')) {
    criticalIssues.push('❌ Platform admins table missing - breaks super admin system');
  }
  if (testResults.tables.missing.includes('profiles')) {
    criticalIssues.push('❌ Profiles table missing - breaks user system');
  }
  if (completionPercentage < 50) {
    criticalIssues.push('❌ Less than 50% of expected tables exist');
  }
  
  if (criticalIssues.length === 0) {
    console.log(chalk.green('✅ No critical issues detected'));
  } else {
    criticalIssues.forEach(issue => console.log(chalk.red(issue)));
  }
  
  // Recommendations
  console.log(chalk.blue('\n💡 RECOMMENDATIONS:'));
  
  if (testResults.tables.missing.length > 0) {
    console.log(chalk.yellow('1. Run database repair migration to create missing tables'));
  }
  if (testResults.functions.missing.length > 0) {
    console.log(chalk.yellow('2. Deploy missing RPC functions'));
  }
  if (!testResults.multiTenant.organizationsTableExists) {
    console.log(chalk.red('3. URGENT: Create organizations table before any other operations'));
  }
  if (testResults.multiTenant.organizationIdColumns.length < 20) {
    console.log(chalk.yellow('4. Add organization_id columns to existing tables for multi-tenancy'));
  }
  
  console.log(chalk.blue('\n📋 DETAILED RESULTS SAVED TO: test-results.json'));
  
  return testResults;
}

/**
 * Main test execution
 */
async function main() {
  console.log(chalk.cyan('🔍 DATABASE STATE VERIFICATION TEST SUITE'));
  console.log(chalk.cyan('=========================================='));
  console.log(`Target Database: ${SUPABASE_URL}`);
  console.log(`Expected Tables: ${Object.keys(EXPECTED_TABLES).length}`);
  console.log(`Expected Functions: ${EXPECTED_RPC_FUNCTIONS.length}`);
  
  // Test connectivity
  const isConnected = await testConnectivity();
  if (!isConnected) {
    console.log(chalk.red('\n❌ Cannot proceed without database connectivity'));
    process.exit(1);
  }
  
  // Get existing tables and functions
  const existingTables = await getExistingTables();
  const existingFunctions = await getExistingFunctions();
  
  testResults.functions.existing = existingFunctions.filter(f => EXPECTED_RPC_FUNCTIONS.includes(f));
  testResults.functions.missing = EXPECTED_RPC_FUNCTIONS.filter(f => !existingFunctions.includes(f));
  
  // Analyze table completeness
  analyzeTableCompleteness(existingTables);
  
  // Test multi-tenant requirements
  await testMultiTenantRequirements(existingTables);
  
  // Test RLS policies
  await testRLSPolicies(existingTables);
  
  // Test critical organization queries
  await testCriticalOrganizationQueries();
  
  // Generate final report
  const results = generateReport();
  
  // Save detailed results to file
  await import('fs/promises').then(fs => 
    fs.writeFile(
      'test-results.json', 
      JSON.stringify(results, null, 2)
    )
  );
  
  // Exit with appropriate code
  const hasErrors = !testResults.connectivity.canQuery || 
                   !testResults.multiTenant.organizationsTableExists ||
                   testResults.tables.missing.length > 30;
  
  process.exit(hasErrors ? 1 : 0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error(chalk.red('\n❌ Test execution failed:'), error);
  process.exit(1);
});