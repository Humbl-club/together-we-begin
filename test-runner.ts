#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  message?: string;
  details?: any;
}

class ApplicationTester {
  private supabase: any;
  private results: TestResult[] = [];
  private testUser: any = null;
  private testOrg: any = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // Helper functions
  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow
    };
    console.log(colors[type](message));
  }

  private addResult(category: string, test: string, status: TestResult['status'], message?: string, details?: any) {
    this.results.push({ category, test, status, message, details });
    const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'ERROR' ? '🔥' : '⏭️';
    this.log(`${statusSymbol} ${category}: ${test} ${message ? `- ${message}` : ''}`, 
      status === 'PASS' ? 'success' : status === 'FAIL' ? 'error' : 'warning');
  }

  // Test Categories
  async testAuthentication() {
    const category = 'Authentication';
    
    // Test signup
    try {
      const email = `test_${uuidv4()}@test.com`;
      const password = 'TestPassword123!';
      
      const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
            username: `test_${Date.now()}`
          }
        }
      });

      if (signUpError) {
        this.addResult(category, 'User Signup', 'FAIL', signUpError.message);
      } else {
        this.addResult(category, 'User Signup', 'PASS', 'Successfully created user');
        this.testUser = signUpData.user;
      }

      // Test signin
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        this.addResult(category, 'User Signin', 'FAIL', signInError.message);
      } else {
        this.addResult(category, 'User Signin', 'PASS');
      }

      // Test password reset
      const { error: resetError } = await this.supabase.auth.resetPasswordForEmail(email);
      if (resetError) {
        this.addResult(category, 'Password Reset', 'FAIL', resetError.message);
      } else {
        this.addResult(category, 'Password Reset', 'PASS');
      }

      // Test logout
      const { error: logoutError } = await this.supabase.auth.signOut();
      if (logoutError) {
        this.addResult(category, 'User Logout', 'FAIL', logoutError.message);
      } else {
        this.addResult(category, 'User Logout', 'PASS');
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testOrganizations() {
    const category = 'Organizations';
    
    try {
      // First sign in as test user
      if (!this.testUser) {
        this.addResult(category, 'Organization Tests', 'SKIP', 'No test user available');
        return;
      }

      // Test organization creation
      const { data: orgData, error: orgError } = await this.supabase
        .from('organizations')
        .insert({
          name: `Test Org ${Date.now()}`,
          slug: `test-org-${Date.now()}`,
          created_by: this.testUser.id,
          settings: {
            allow_self_signup: true,
            require_invite_code: false
          }
        })
        .select()
        .single();

      if (orgError) {
        this.addResult(category, 'Create Organization', 'FAIL', orgError.message);
      } else {
        this.addResult(category, 'Create Organization', 'PASS');
        this.testOrg = orgData;
      }

      // Test organization members
      if (this.testOrg) {
        const { data: memberData, error: memberError } = await this.supabase
          .from('organization_members')
          .insert({
            organization_id: this.testOrg.id,
            user_id: this.testUser.id,
            role: 'admin'
          });

        if (memberError) {
          this.addResult(category, 'Add Organization Member', 'FAIL', memberError.message);
        } else {
          this.addResult(category, 'Add Organization Member', 'PASS');
        }
      }

      // Test invite codes
      if (this.testOrg) {
        const { data: inviteData, error: inviteError } = await this.supabase
          .from('organization_invites')
          .insert({
            organization_id: this.testOrg.id,
            code: `INV${Date.now()}`,
            created_by: this.testUser.id,
            max_uses: 10
          });

        if (inviteError) {
          this.addResult(category, 'Create Invite Code', 'FAIL', inviteError.message);
        } else {
          this.addResult(category, 'Create Invite Code', 'PASS');
        }
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testDatabase() {
    const category = 'Database';

    try {
      // Test profiles table
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profileError) {
        this.addResult(category, 'Profiles Table Access', 'FAIL', profileError.message);
      } else {
        this.addResult(category, 'Profiles Table Access', 'PASS');
      }

      // Test events table
      const { data: eventsData, error: eventsError } = await this.supabase
        .from('events')
        .select('*')
        .limit(1);

      if (eventsError) {
        this.addResult(category, 'Events Table Access', 'FAIL', eventsError.message);
      } else {
        this.addResult(category, 'Events Table Access', 'PASS');
      }

      // Test challenges table
      const { data: challengesData, error: challengesError } = await this.supabase
        .from('challenges')
        .select('*')
        .limit(1);

      if (challengesError) {
        this.addResult(category, 'Challenges Table Access', 'FAIL', challengesError.message);
      } else {
        this.addResult(category, 'Challenges Table Access', 'PASS');
      }

      // Test RLS policies by trying unauthorized access
      const { data: unauthorizedData, error: unauthorizedError } = await this.supabase
        .from('admin_actions')
        .select('*');

      if (unauthorizedError && unauthorizedError.message.includes('Row Level Security')) {
        this.addResult(category, 'RLS Policies', 'PASS', 'Properly blocking unauthorized access');
      } else {
        this.addResult(category, 'RLS Policies', 'FAIL', 'RLS not properly configured');
      }

      // Test RPC functions
      const { data: rpcData, error: rpcError } = await this.supabase
        .rpc('get_events_optimized', { 
          p_limit: 10, 
          p_offset: 0 
        });

      if (rpcError) {
        this.addResult(category, 'RPC Functions', 'FAIL', rpcError.message);
      } else {
        this.addResult(category, 'RPC Functions', 'PASS');
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testRealtime() {
    const category = 'Realtime';
    
    try {
      // Test realtime subscription
      const channel = this.supabase.channel('test-channel');
      
      let subscriptionWorking = false;
      
      channel
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'social_posts' }, 
          (payload: any) => {
            subscriptionWorking = true;
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.addResult(category, 'Realtime Subscription', 'PASS');
          }
        });

      // Wait a bit for subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clean up
      await channel.unsubscribe();

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testStorageBuckets() {
    const category = 'Storage';
    
    try {
      // List buckets
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();
      
      if (bucketsError) {
        this.addResult(category, 'List Buckets', 'FAIL', bucketsError.message);
      } else {
        this.addResult(category, 'List Buckets', 'PASS', `Found ${buckets?.length || 0} buckets`);
        
        // Check expected buckets
        const expectedBuckets = ['avatars', 'posts', 'events', 'challenges'];
        for (const bucketName of expectedBuckets) {
          const exists = buckets?.some(b => b.name === bucketName);
          if (exists) {
            this.addResult(category, `Bucket: ${bucketName}`, 'PASS');
          } else {
            this.addResult(category, `Bucket: ${bucketName}`, 'FAIL', 'Bucket not found');
          }
        }
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testEdgeFunctions() {
    const category = 'Edge Functions';
    
    try {
      // Note: Edge functions require authentication and proper setup
      // These are placeholders for manual testing
      
      const edgeFunctions = [
        'create-payment',
        'verify-payment',
        'process-walking-challenges',
        'send-email'
      ];

      for (const func of edgeFunctions) {
        // Can't directly test edge functions without proper auth
        this.addResult(category, `Edge Function: ${func}`, 'SKIP', 'Requires manual testing');
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testDataIntegrity() {
    const category = 'Data Integrity';
    
    try {
      // Test foreign key relationships
      const { data: fkTest, error: fkError } = await this.supabase
        .from('event_registrations')
        .select(`
          *,
          events (*),
          profiles (*)
        `)
        .limit(1);

      if (fkError) {
        this.addResult(category, 'Foreign Key Relationships', 'FAIL', fkError.message);
      } else {
        this.addResult(category, 'Foreign Key Relationships', 'PASS');
      }

      // Test cascade deletes (would need to create and delete test data)
      this.addResult(category, 'Cascade Deletes', 'SKIP', 'Requires destructive testing');

      // Test points calculation
      const { data: pointsData, error: pointsError } = await this.supabase
        .rpc('get_user_available_points', { 
          p_user_id: this.testUser?.id || '00000000-0000-0000-0000-000000000000'
        });

      if (pointsError && !pointsError.message.includes('No user found')) {
        this.addResult(category, 'Points Calculation', 'FAIL', pointsError.message);
      } else {
        this.addResult(category, 'Points Calculation', 'PASS');
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async testSecurity() {
    const category = 'Security';
    
    try {
      // Test SQL injection attempt
      const maliciousInput = "'; DROP TABLE users; --";
      const { error: sqlError } = await this.supabase
        .from('social_posts')
        .select('*')
        .eq('content', maliciousInput);

      if (!sqlError) {
        this.addResult(category, 'SQL Injection Protection', 'PASS');
      } else {
        this.addResult(category, 'SQL Injection Protection', 'FAIL', 'Query failed unexpectedly');
      }

      // Test XSS prevention (would need frontend testing)
      this.addResult(category, 'XSS Protection', 'SKIP', 'Requires frontend testing');

      // Test authentication bypass
      const { error: authBypassError } = await this.supabase
        .from('admin_actions')
        .select('*')
        .limit(1);

      if (authBypassError) {
        this.addResult(category, 'Auth Bypass Protection', 'PASS', 'Admin tables protected');
      } else {
        this.addResult(category, 'Auth Bypass Protection', 'FAIL', 'Unauthorized access allowed');
      }

      // Test role escalation
      if (this.testUser) {
        const { error: roleError } = await this.supabase
          .from('user_roles')
          .update({ role: 'super_admin' })
          .eq('user_id', this.testUser.id);

        if (roleError) {
          this.addResult(category, 'Role Escalation Protection', 'PASS', 'Prevented unauthorized role change');
        } else {
          this.addResult(category, 'Role Escalation Protection', 'FAIL', 'Role escalation allowed');
        }
      }

    } catch (error: any) {
      this.addResult(category, 'Overall', 'ERROR', error.message);
    }
  }

  async cleanup() {
    try {
      // Clean up test data
      if (this.testOrg) {
        await this.supabase
          .from('organizations')
          .delete()
          .eq('id', this.testOrg.id);
      }

      if (this.testUser) {
        // Note: User deletion may require admin SDK
        this.log('Test user created but requires admin access to delete', 'warning');
      }
    } catch (error: any) {
      this.log(`Cleanup error: ${error.message}`, 'warning');
    }
  }

  async runAllTests() {
    this.log('\n🧪 Starting Comprehensive Application Testing\n', 'info');
    
    await this.testAuthentication();
    await this.testOrganizations();
    await this.testDatabase();
    await this.testRealtime();
    await this.testStorageBuckets();
    await this.testEdgeFunctions();
    await this.testDataIntegrity();
    await this.testSecurity();
    
    await this.cleanup();
    
    this.printSummary();
  }

  private printSummary() {
    this.log('\n📊 Test Summary\n', 'info');
    
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.status === 'PASS').length;
      const failed = categoryResults.filter(r => r.status === 'FAIL').length;
      const errors = categoryResults.filter(r => r.status === 'ERROR').length;
      const skipped = categoryResults.filter(r => r.status === 'SKIP').length;
      
      this.log(`${category}: ✅ ${passed} | ❌ ${failed} | 🔥 ${errors} | ⏭️ ${skipped}`, 
        failed > 0 || errors > 0 ? 'error' : passed > 0 ? 'success' : 'warning');
    }
    
    const totalPassed = this.results.filter(r => r.status === 'PASS').length;
    const totalFailed = this.results.filter(r => r.status === 'FAIL').length;
    const totalErrors = this.results.filter(r => r.status === 'ERROR').length;
    const totalSkipped = this.results.filter(r => r.status === 'SKIP').length;
    
    this.log(`\n📈 Total: ✅ ${totalPassed} | ❌ ${totalFailed} | 🔥 ${totalErrors} | ⏭️ ${totalSkipped}\n`, 'info');
    
    // Report critical issues
    const criticalIssues = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    if (criticalIssues.length > 0) {
      this.log('\n⚠️ Critical Issues Found:\n', 'error');
      for (const issue of criticalIssues) {
        this.log(`  - ${issue.category}: ${issue.test} - ${issue.message || 'Failed'}`, 'error');
      }
    }
  }
}

// Run tests
const tester = new ApplicationTester();
tester.runAllTests().catch(console.error);
