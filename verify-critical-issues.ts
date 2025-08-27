#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://ynqdddwponrqwhtqfepi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ';

interface Issue {
  category: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'BROKEN' | 'WORKING' | 'PARTIAL';
  details: string;
  reproduction?: string;
  fix?: string;
}

class CriticalIssueVerifier {
  private supabase: any;
  private issues: Issue[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow
    };
    console.log(colors[type](message));
  }

  private addIssue(issue: Issue) {
    this.issues.push(issue);
    const symbol = issue.status === 'WORKING' ? '✅' : issue.status === 'BROKEN' ? '🔴' : '🟡';
    this.log(`${symbol} ${issue.category}: ${issue.title}`, 
      issue.status === 'WORKING' ? 'success' : issue.status === 'BROKEN' ? 'error' : 'warning');
  }

  async verifyDatabaseFunctions() {
    this.log('\n🔍 Verifying Database Functions...', 'info');
    
    const criticalFunctions = [
      'get_events_optimized',
      'get_user_available_points',
      'get_dashboard_data_v2',
      'get_social_posts_optimized',
      'redeem_reward',
      'process_walking_challenges',
      'is_admin',
      'has_role',
      'use_invite_code'
    ];

    for (const func of criticalFunctions) {
      try {
        // Try to get function definition
        const { data, error } = await this.supabase.rpc(func, {});
        
        if (error && error.message.includes('Could not find the function')) {
          this.addIssue({
            category: 'Database Functions',
            title: `Function: ${func}`,
            severity: 'CRITICAL',
            status: 'BROKEN',
            details: `Function ${func} does not exist in database`,
            reproduction: `supabase.rpc('${func}', {})`,
            fix: `Deploy migration containing CREATE FUNCTION ${func}`
          });
        } else {
          this.addIssue({
            category: 'Database Functions',
            title: `Function: ${func}`,
            severity: 'CRITICAL',
            status: 'WORKING',
            details: `Function exists and is callable`
          });
        }
      } catch (error: any) {
        this.addIssue({
          category: 'Database Functions',
          title: `Function: ${func}`,
          severity: 'CRITICAL',
          status: 'BROKEN',
          details: error.message
        });
      }
    }
  }

  async verifyStorageBuckets() {
    this.log('\n🗄️ Verifying Storage Buckets...', 'info');
    
    const requiredBuckets = ['avatars', 'posts', 'events', 'challenges'];
    
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        this.addIssue({
          category: 'Storage',
          title: 'List Buckets',
          severity: 'CRITICAL',
          status: 'BROKEN',
          details: error.message
        });
        return;
      }

      for (const bucketName of requiredBuckets) {
        const exists = buckets?.some((b: any) => b.name === bucketName);
        
        this.addIssue({
          category: 'Storage',
          title: `Bucket: ${bucketName}`,
          severity: 'CRITICAL',
          status: exists ? 'WORKING' : 'BROKEN',
          details: exists ? 'Bucket exists' : 'Bucket missing',
          fix: exists ? undefined : `CREATE BUCKET ${bucketName} in Supabase Dashboard`
        });
      }
    } catch (error: any) {
      this.addIssue({
        category: 'Storage',
        title: 'Storage System',
        severity: 'CRITICAL',
        status: 'BROKEN',
        details: error.message
      });
    }
  }

  async verifyAuthentication() {
    this.log('\n🔐 Verifying Authentication System...', 'info');
    
    // Check if we can get session
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    this.addIssue({
      category: 'Authentication',
      title: 'Get Session',
      severity: 'CRITICAL',
      status: error ? 'BROKEN' : 'WORKING',
      details: error ? error.message : 'Session retrieval working'
    });

    // Check auth configuration
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const { data, error: signUpError } = await this.supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      this.addIssue({
        category: 'Authentication',
        title: 'Sign Up Flow',
        severity: 'CRITICAL',
        status: signUpError ? 'BROKEN' : 'WORKING',
        details: signUpError ? signUpError.message : 'Sign up successful',
        reproduction: signUpError ? `Email validation failing: ${signUpError.message}` : undefined
      });
    } catch (error: any) {
      this.addIssue({
        category: 'Authentication',
        title: 'Sign Up Flow',
        severity: 'CRITICAL',
        status: 'BROKEN',
        details: error.message
      });
    }
  }

  async verifyRLSPolicies() {
    this.log('\n🛡️ Verifying Row Level Security...', 'info');
    
    const protectedTables = [
      'admin_actions',
      'user_roles',
      'organization_settings',
      'loyalty_transactions'
    ];

    for (const table of protectedTables) {
      try {
        // Try to access without authentication
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);

        const isProtected = error && (
          error.message.includes('Row Level Security') ||
          error.message.includes('permission denied')
        );

        this.addIssue({
          category: 'Security',
          title: `RLS: ${table}`,
          severity: 'CRITICAL',
          status: isProtected ? 'WORKING' : 'BROKEN',
          details: isProtected ? 'Table protected by RLS' : 'SECURITY RISK: Table not protected!',
          fix: isProtected ? undefined : `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
        });
      } catch (error: any) {
        this.addIssue({
          category: 'Security',
          title: `RLS: ${table}`,
          severity: 'CRITICAL',
          status: 'PARTIAL',
          details: error.message
        });
      }
    }
  }

  async verifyOrganizationStructure() {
    this.log('\n🏢 Verifying Organization Structure...', 'info');
    
    // Check if organization tables exist
    const orgTables = [
      'organizations',
      'organization_members',
      'organization_invites',
      'organization_settings'
    ];

    for (const table of orgTables) {
      try {
        const { error } = await this.supabase
          .from(table)
          .select('*')
          .limit(0); // Just check if accessible

        this.addIssue({
          category: 'Multi-Tenant',
          title: `Table: ${table}`,
          severity: 'HIGH',
          status: error ? 'BROKEN' : 'WORKING',
          details: error ? error.message : 'Table accessible'
        });
      } catch (error: any) {
        this.addIssue({
          category: 'Multi-Tenant',
          title: `Table: ${table}`,
          severity: 'HIGH',
          status: 'BROKEN',
          details: error.message
        });
      }
    }
  }

  async verifyMigrationFiles() {
    this.log('\n📁 Verifying Migration Files...', 'info');
    
    const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    try {
      const files = fs.readdirSync(migrationDir);
      const orgMigrations = files.filter(f => 
        f.includes('multi_tenant') || 
        f.includes('organization') || 
        f.includes('super_admin')
      );

      this.addIssue({
        category: 'Migrations',
        title: 'Migration Files',
        severity: 'HIGH',
        status: orgMigrations.length > 0 ? 'PARTIAL' : 'BROKEN',
        details: `Found ${orgMigrations.length} multi-tenant migration files`,
        reproduction: orgMigrations.join(', '),
        fix: 'Run: npx supabase db push to deploy migrations'
      });

      // Check if migrations were applied
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('*')
        .order('version', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        this.log(`  Latest migrations: ${data.map((m: any) => m.version).join(', ')}`, 'info');
      }
    } catch (error: any) {
      this.addIssue({
        category: 'Migrations',
        title: 'Migration System',
        severity: 'HIGH',
        status: 'BROKEN',
        details: error.message
      });
    }
  }

  async verifyEdgeFunctions() {
    this.log('\n⚡ Verifying Edge Functions...', 'info');
    
    const edgeFunctions = [
      { name: 'create-payment', critical: true },
      { name: 'verify-payment', critical: true },
      { name: 'process-walking-challenges', critical: false },
      { name: 'send-email', critical: false }
    ];

    for (const func of edgeFunctions) {
      // Note: Can't directly invoke without auth, checking deployment status
      this.addIssue({
        category: 'Edge Functions',
        title: func.name,
        severity: func.critical ? 'CRITICAL' : 'MEDIUM',
        status: 'PARTIAL',
        details: 'Requires manual verification in Supabase Dashboard',
        reproduction: `Check Functions tab in Supabase Dashboard`,
        fix: `Deploy with: supabase functions deploy ${func.name}`
      });
    }
  }

  async verifyFrontendComponents() {
    this.log('\n🎨 Verifying Frontend Components...', 'info');
    
    const componentsToCheck = [
      { path: '/client/src/components/auth/AuthProvider.tsx', critical: true },
      { path: '/client/src/components/auth/OrganizationAuth.tsx', critical: true },
      { path: '/client/src/contexts/OrganizationContext.tsx', critical: true },
      { path: '/client/src/components/app-sidebar/AppSidebar.tsx', critical: false },
      { path: '/client/src/components/theme/ThemeController.tsx', critical: false }
    ];

    for (const component of componentsToCheck) {
      const fullPath = path.join(process.cwd(), component.path);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasOrgContext = content.includes('useOrganization') || content.includes('OrganizationContext');
        
        this.addIssue({
          category: 'Frontend',
          title: path.basename(component.path),
          severity: component.critical ? 'HIGH' : 'MEDIUM',
          status: hasOrgContext ? 'PARTIAL' : 'WORKING',
          details: hasOrgContext ? 'Uses organization context - may fail without org' : 'Component exists'
        });
      } else {
        this.addIssue({
          category: 'Frontend',
          title: path.basename(component.path),
          severity: component.critical ? 'HIGH' : 'MEDIUM',
          status: 'BROKEN',
          details: 'Component file not found'
        });
      }
    }
  }

  generateReport() {
    this.log('\n📋 CRITICAL ISSUE VERIFICATION REPORT\n', 'info');
    
    const critical = this.issues.filter(i => i.severity === 'CRITICAL');
    const high = this.issues.filter(i => i.severity === 'HIGH');
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');
    
    const broken = this.issues.filter(i => i.status === 'BROKEN');
    const partial = this.issues.filter(i => i.status === 'PARTIAL');
    const working = this.issues.filter(i => i.status === 'WORKING');
    
    this.log('Summary by Severity:', 'info');
    this.log(`  🔴 CRITICAL: ${critical.length} issues (${critical.filter(i => i.status === 'BROKEN').length} broken)`, 'error');
    this.log(`  🟠 HIGH: ${high.length} issues (${high.filter(i => i.status === 'BROKEN').length} broken)`, 'warning');
    this.log(`  🟡 MEDIUM: ${medium.length} issues (${medium.filter(i => i.status === 'BROKEN').length} broken)`, 'warning');
    
    this.log('\nSummary by Status:', 'info');
    this.log(`  🔴 BROKEN: ${broken.length} components`, 'error');
    this.log(`  🟡 PARTIAL: ${partial.length} components`, 'warning');
    this.log(`  ✅ WORKING: ${working.length} components`, 'success');
    
    if (broken.length > 0) {
      this.log('\n🚨 CRITICAL BROKEN COMPONENTS:', 'error');
      broken
        .filter(i => i.severity === 'CRITICAL')
        .forEach(issue => {
          this.log(`\n  ${issue.category} - ${issue.title}:`, 'error');
          this.log(`    Details: ${issue.details}`, 'info');
          if (issue.fix) {
            this.log(`    Fix: ${issue.fix}`, 'warning');
          }
        });
    }
    
    // Generate fix script
    this.log('\n🔧 QUICK FIX COMMANDS:', 'info');
    this.log('# Deploy migrations:', 'info');
    this.log('npx supabase db push', 'info');
    this.log('\n# Create storage buckets (run in SQL editor):', 'info');
    this.log(`INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('events', 'events', true),
  ('challenges', 'challenges', true);`, 'info');
    this.log('\n# Enable RLS (run in SQL editor):', 'info');
    this.log('ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;', 'info');
    this.log('ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;', 'info');
    
    const criticalBroken = broken.filter(i => i.severity === 'CRITICAL').length;
    const percentWorking = Math.round((working.length / this.issues.length) * 100);
    
    this.log(`\n🎯 APPLICATION STATUS: ${criticalBroken > 5 ? 'CRITICAL' : criticalBroken > 2 ? 'UNSTABLE' : 'DEGRADED'}`, 
      criticalBroken > 5 ? 'error' : 'warning');
    this.log(`📊 Overall Health: ${percentWorking}% components working\n`, 
      percentWorking > 70 ? 'success' : percentWorking > 40 ? 'warning' : 'error');
  }

  async runVerification() {
    this.log('🔬 Starting Critical Issue Verification...\n', 'info');
    
    await this.verifyDatabaseFunctions();
    await this.verifyStorageBuckets();
    await this.verifyAuthentication();
    await this.verifyRLSPolicies();
    await this.verifyOrganizationStructure();
    await this.verifyMigrationFiles();
    await this.verifyEdgeFunctions();
    await this.verifyFrontendComponents();
    
    this.generateReport();
  }
}

// Run verification
const verifier = new CriticalIssueVerifier();
verifier.runVerification().catch(console.error);