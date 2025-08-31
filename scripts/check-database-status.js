#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read environment variables
const supabaseUrl = 'https://ynqdddwponrqwhtqfepi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MzY3NDYsImV4cCI6MjA0NjMxMjc0Nn0.2GDqBTu0s1xMxoF5Qv7huUBJAB_u3jY3ZvLJBl8ANcA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Expected tables from CLAUDE.md
const expectedTables = [
  // Core Multi-Tenant Tables
  'organizations', 'organization_members', 'organization_features', 'organization_themes',
  'organization_typography', 'organization_layouts', 'organization_branding', 'organization_bans',
  'club_signup_pages', 'feature_catalog',
  
  // User & Authentication
  'profiles', 'user_roles', 'user_settings', 'privacy_settings',
  'user_notification_settings', 'user_appearance_settings', 'user_social_settings', 'user_wellness_settings',
  
  // Events System
  'events', 'event_registrations', 'event_attendance', 'event_qr_codes',
  
  // Wellness & Challenges
  'challenges', 'challenge_participations', 'challenge_cycles', 'walking_leaderboards',
  'health_data', 'step_validation_logs',
  
  // Social Platform
  'social_posts', 'post_likes', 'post_comments', 'post_reactions',
  'direct_messages', 'message_threads', 'blocked_users',
  
  // Loyalty & Rewards
  'loyalty_transactions', 'rewards_catalog', 'reward_redemptions',
  'expired_points', 'points_expiration_policies', 'user_achievements',
  
  // Platform Administration
  'platform_admins', 'platform_analytics', 'platform_billing', 'platform_incidents',
  'platform_audit_logs', 'platform_feature_flags', 'admin_actions', 'content_reports',
  'content_deletions', 'moderation_actions', 'user_warnings', 'content_moderation_queue',
  
  // Extreme Modularity System
  'dashboard_widgets', 'dashboard_layouts', 'widget_templates', 'navigation_items',
  'google_fonts_catalog', 'theme_presets', 'font_presets', 'container_presets',
  'system_configurations', 'performance_metrics', 'notifications',
  
  // Storage & Invites
  'invite_codes', 'invite_redemptions', 'email_invitations', 'push_subscriptions',
  'integration_settings', 'notification_templates', 'system_config', 'invites'
];

// Expected RPC functions from CLAUDE.md
const expectedFunctions = [
  // Organization Management
  'is_member_of_organization', 'is_admin_of_organization', 'get_user_role_in_organization',
  'get_user_current_organization', 'get_organization_by_slug', 'get_organization_theme',
  'get_organization_admin_details', 'get_organizations_for_admin', 'ban_user_from_organization',
  'calculate_organization_health_scores', 'update_organization_status', 'create_default_signup_page',
  'create_extreme_modularity_defaults', 'is_organization_admin', 'get_organization_members_for_admin',
  
  // Platform Administration
  'is_platform_admin', 'assign_super_admin_role', 'auto_assign_platform_admin',
  'get_platform_statistics', 'get_platform_statistics_real', 'fix_orphaned_records',
  'get_migration_status', 'expire_temporary_bans', 'auto_ban_after_warnings',
  'get_user_warning_count', 'cleanup_expired_points_regularly', 'log_admin_action',
  
  // Theme & Modularity
  'apply_theme_preset', 'create_default_theme_settings', 'create_default_dashboard_layout',
  'load_google_font', 'update_widget_positions', 'get_user_dashboard_optimized',
  'refresh_dashboard_stats', 'get_dashboard_data_v2', 'get_unread_counts_for_user',
  'update_user_last_seen',
  
  // Event Management
  'get_events_optimized', 'register_for_event', 'generate_event_qr_code',
  'mark_event_attendance', 'increment_event_capacity', 'create_event_with_defaults',
  'cancel_event_and_refund', 'get_event_attendees',
  
  // Social Features
  'get_social_posts_optimized', 'get_user_threads_optimized', 'mark_thread_messages_read',
  'create_post_with_media', 'delete_post_cascade', 'report_content', 'block_user',
  'unblock_user', 'get_blocked_users', 'get_user_activity_summary',
  
  // Loyalty & Rewards
  'get_user_available_points', 'redeem_reward', 'expire_old_points',
  'admin_adjust_user_points', 'calculate_loyalty_tier', 'award_achievement',
  'get_redemption_history', 'process_points_expiration',
  
  // Authentication & Roles
  'is_admin', 'has_role', 'assign_user_role', 'remove_user_role',
  'get_users_with_roles', 'switch_user_role', 'get_role_permissions',
  
  // Content Moderation
  'moderate_content', 'get_content_for_moderation', 'resolve_content_reports',
  'delete_content_with_audit', 'get_moderation_queue_real', 'process_user_warning',
  
  // Invites & Onboarding
  'create_invite_code', 'redeem_invite_code', 'use_invite_code',
  'generate_invite_code', 'validate_invite_code', 'auto_generate_invite_code'
];

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status...\n');
  
  const report = {
    tables: { expected: expectedTables.length, found: 0, missing: [] },
    functions: { expected: expectedFunctions.length, found: 0, missing: [] },
    storage: { buckets: [] },
    timestamp: new Date().toISOString()
  };

  // Check tables
  console.log('📊 Checking Tables...');
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        report.tables.found++;
        process.stdout.write('✅');
      } else {
        report.tables.missing.push(table);
        process.stdout.write('❌');
      }
    } catch (e) {
      report.tables.missing.push(table);
      process.stdout.write('❌');
    }
  }
  console.log(`\n✅ Found: ${report.tables.found}/${report.tables.expected} tables`);
  
  // Check RPC functions
  console.log('\n🔧 Checking RPC Functions...');
  for (const func of expectedFunctions) {
    try {
      // Try to call with minimal/no args to check if function exists
      const { error } = await supabase.rpc(func, {});
      if (!error || error.message.includes('argument') || error.message.includes('parameter')) {
        // Function exists but may need args
        report.functions.found++;
        process.stdout.write('✅');
      } else if (error.message.includes('not exist')) {
        report.functions.missing.push(func);
        process.stdout.write('❌');
      } else {
        // Function exists but has other errors
        report.functions.found++;
        process.stdout.write('⚠️');
      }
    } catch (e) {
      report.functions.missing.push(func);
      process.stdout.write('❌');
    }
  }
  console.log(`\n✅ Found: ${report.functions.found}/${report.functions.expected} functions`);
  
  // Check storage buckets
  console.log('\n📦 Checking Storage Buckets...');
  const expectedBuckets = ['avatars', 'posts', 'events', 'challenges'];
  for (const bucket of expectedBuckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (!error) {
        report.storage.buckets.push({ name: bucket, status: 'active' });
        console.log(`✅ ${bucket}: Active`);
      } else {
        report.storage.buckets.push({ name: bucket, status: 'missing', error: error.message });
        console.log(`❌ ${bucket}: Missing`);
      }
    } catch (e) {
      report.storage.buckets.push({ name: bucket, status: 'error', error: e.message });
      console.log(`❌ ${bucket}: Error`);
    }
  }
  
  // Generate report
  console.log('\n📋 SUMMARY REPORT');
  console.log('=================');
  console.log(`Tables: ${report.tables.found}/${report.tables.expected} (${report.tables.missing.length} missing)`);
  console.log(`Functions: ${report.functions.found}/${report.functions.expected} (${report.functions.missing.length} missing)`);
  console.log(`Storage: ${report.storage.buckets.filter(b => b.status === 'active').length}/${expectedBuckets.length} buckets`);
  
  if (report.tables.missing.length > 0) {
    console.log('\n❌ Missing Tables:');
    report.tables.missing.forEach(t => console.log(`  - ${t}`));
  }
  
  if (report.functions.missing.length > 0) {
    console.log('\n❌ Missing Functions:');
    report.functions.missing.forEach(f => console.log(`  - ${f}`));
  }
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'database-status-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Return critical status
  const criticalTables = ['organizations', 'profiles', 'events', 'challenges'];
  const criticalFunctions = ['get_organization_by_slug', 'create_default_signup_page', 'get_dashboard_data_v2'];
  
  const criticalIssues = [];
  criticalTables.forEach(t => {
    if (report.tables.missing.includes(t)) {
      criticalIssues.push(`CRITICAL: Table '${t}' is missing`);
    }
  });
  
  criticalFunctions.forEach(f => {
    if (report.functions.missing.includes(f)) {
      criticalIssues.push(`CRITICAL: Function '${f}' is missing`);
    }
  });
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    process.exit(1);
  } else {
    console.log('\n✅ All critical infrastructure is in place!');
    process.exit(0);
  }
}

checkDatabaseStatus().catch(console.error);