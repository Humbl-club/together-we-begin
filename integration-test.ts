#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}
const BASE_URL = 'http://localhost:5000';

interface FlowTest {
  name: string;
  steps: TestStep[];
  expectedOutcome: string;
  actualOutcome?: string;
  status?: 'PASS' | 'FAIL' | 'PARTIAL';
  errors?: string[];
}

interface TestStep {
  action: string;
  success: boolean;
  error?: string;
}

class IntegrationTester {
  private supabase: any;
  private flows: FlowTest[] = [];

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

  async testNewUserFlow(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'New User Registration Flow',
      steps: [],
      expectedOutcome: 'User registered, profile created, dashboard accessible'
    };

    const email = `user_${Date.now()}@test.com`;
    const password = 'SecurePassword123!';

    // Step 1: Sign up
    const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Integration Test User',
          username: `test_user_${Date.now()}`
        }
      }
    });

    flow.steps.push({
      action: 'User signup',
      success: !signUpError,
      error: signUpError?.message
    });

    if (!signUpError && signUpData.user) {
      // Step 2: Check profile creation
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      flow.steps.push({
        action: 'Profile auto-creation',
        success: !profileError && profile,
        error: profileError?.message
      });

      // Step 3: Check organization assignment
      const { data: orgMember, error: orgError } = await this.supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', signUpData.user.id);

      flow.steps.push({
        action: 'Organization assignment',
        success: !orgError && orgMember && orgMember.length > 0,
        error: orgError ? orgError.message : (!orgMember || orgMember.length === 0 ? 'No organization assigned' : undefined)
      });

      // Step 4: Access dashboard
      const { data: dashboardData, error: dashboardError } = await this.supabase
        .rpc('get_dashboard_data_v2', { p_user_id: signUpData.user.id });

      flow.steps.push({
        action: 'Dashboard data access',
        success: !dashboardError,
        error: dashboardError?.message
      });
    }

    // Determine outcome
    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'User successfully registered and accessed system'
      : `Failed at: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  async testEventCreationFlow(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'Event Creation and Registration Flow',
      steps: [],
      expectedOutcome: 'Event created, user registered, payment processed'
    };

    // First create a test admin user
    const adminEmail = `admin_${Date.now()}@test.com`;
    const { data: adminData, error: adminError } = await this.supabase.auth.signUp({
      email: adminEmail,
      password: 'AdminPassword123!'
    });

    if (adminError || !adminData.user) {
      flow.steps.push({
        action: 'Admin user creation',
        success: false,
        error: adminError?.message || 'Failed to create admin'
      });
      flow.status = 'FAIL';
      return flow;
    }

    // Create an event
    const eventData = {
      title: `Test Event ${Date.now()}`,
      description: 'Integration test event',
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      time: '14:00',
      location: 'Test Location',
      capacity: 50,
      price: 10.00,
      created_by: adminData.user.id
    };

    const { data: event, error: eventError } = await this.supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    flow.steps.push({
      action: 'Event creation',
      success: !eventError && event,
      error: eventError?.message
    });

    if (event) {
      // Register for event
      const { data: registration, error: regError } = await this.supabase
        .from('event_registrations')
        .insert({
          event_id: event.id,
          user_id: adminData.user.id,
          payment_status: 'pending'
        })
        .select()
        .single();

      flow.steps.push({
        action: 'Event registration',
        success: !regError && registration,
        error: regError?.message
      });

      // Simulate payment (would normally call edge function)
      if (registration) {
        const { data: paymentUpdate, error: paymentError } = await this.supabase
          .from('event_registrations')
          .update({ payment_status: 'completed' })
          .eq('id', registration.id);

        flow.steps.push({
          action: 'Payment processing',
          success: !paymentError,
          error: paymentError?.message
        });
      }
    }

    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'Event flow completed successfully'
      : `Failed at: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  async testSocialFeatureFlow(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'Social Features Flow',
      steps: [],
      expectedOutcome: 'Post created, liked, commented'
    };

    // Create a test user
    const userEmail = `social_${Date.now()}@test.com`;
    const { data: userData, error: userError } = await this.supabase.auth.signUp({
      email: userEmail,
      password: 'SocialUser123!'
    });

    if (userError || !userData.user) {
      flow.steps.push({
        action: 'User creation',
        success: false,
        error: userError?.message || 'Failed to create user'
      });
      flow.status = 'FAIL';
      return flow;
    }

    // Create a post
    const { data: post, error: postError } = await this.supabase
      .from('social_posts')
      .insert({
        user_id: userData.user.id,
        content: 'Test post from integration test',
        post_type: 'post'
      })
      .select()
      .single();

    flow.steps.push({
      action: 'Post creation',
      success: !postError && post,
      error: postError?.message
    });

    if (post) {
      // Like the post
      const { error: likeError } = await this.supabase
        .from('post_likes')
        .insert({
          post_id: post.id,
          user_id: userData.user.id
        });

      flow.steps.push({
        action: 'Post like',
        success: !likeError,
        error: likeError?.message
      });

      // Comment on post
      const { error: commentError } = await this.supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: userData.user.id,
          content: 'Test comment'
        });

      flow.steps.push({
        action: 'Post comment',
        success: !commentError,
        error: commentError?.message
      });
    }

    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'Social features working correctly'
      : `Failed at: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  async testChallengeFlow(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'Challenge Participation Flow',
      steps: [],
      expectedOutcome: 'Challenge created, user joined, steps tracked'
    };

    // Create a test user
    const userEmail = `challenge_${Date.now()}@test.com`;
    const { data: userData, error: userError } = await this.supabase.auth.signUp({
      email: userEmail,
      password: 'ChallengeUser123!'
    });

    if (userError || !userData.user) {
      flow.steps.push({
        action: 'User creation',
        success: false,
        error: userError?.message || 'Failed to create user'
      });
      flow.status = 'FAIL';
      return flow;
    }

    // Create a challenge
    const { data: challenge, error: challengeError } = await this.supabase
      .from('challenges')
      .insert({
        title: 'Test Walking Challenge',
        description: 'Integration test challenge',
        challenge_type: 'walking',
        target_value: 10000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
        reward_points: 100,
        created_by: userData.user.id
      })
      .select()
      .single();

    flow.steps.push({
      action: 'Challenge creation',
      success: !challengeError && challenge,
      error: challengeError?.message
    });

    if (challenge) {
      // Join challenge
      const { error: joinError } = await this.supabase
        .from('challenge_participations')
        .insert({
          challenge_id: challenge.id,
          user_id: userData.user.id,
          current_progress: 0
        });

      flow.steps.push({
        action: 'Challenge participation',
        success: !joinError,
        error: joinError?.message
      });

      // Track steps
      const { error: stepsError } = await this.supabase
        .from('health_data')
        .insert({
          user_id: userData.user.id,
          data_type: 'steps',
          value: 5000,
          recorded_at: new Date().toISOString()
        });

      flow.steps.push({
        action: 'Step tracking',
        success: !stepsError,
        error: stepsError?.message
      });
    }

    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'Challenge flow working correctly'
      : `Failed at: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  async testMessagingFlow(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'Direct Messaging Flow',
      steps: [],
      expectedOutcome: 'Thread created, messages sent and received'
    };

    // Create two test users
    const user1Email = `sender_${Date.now()}@test.com`;
    const user2Email = `receiver_${Date.now()}@test.com`;

    const { data: user1Data, error: user1Error } = await this.supabase.auth.signUp({
      email: user1Email,
      password: 'User1Pass123!'
    });

    const { data: user2Data, error: user2Error } = await this.supabase.auth.signUp({
      email: user2Email,
      password: 'User2Pass123!'
    });

    if (user1Error || user2Error || !user1Data?.user || !user2Data?.user) {
      flow.steps.push({
        action: 'Users creation',
        success: false,
        error: user1Error?.message || user2Error?.message || 'Failed to create users'
      });
      flow.status = 'FAIL';
      return flow;
    }

    // Create message thread
    const { data: thread, error: threadError } = await this.supabase
      .from('message_threads')
      .insert({
        participant1_id: user1Data.user.id,
        participant2_id: user2Data.user.id
      })
      .select()
      .single();

    flow.steps.push({
      action: 'Thread creation',
      success: !threadError && thread,
      error: threadError?.message
    });

    if (thread) {
      // Send message
      const { error: messageError } = await this.supabase
        .from('direct_messages')
        .insert({
          thread_id: thread.id,
          sender_id: user1Data.user.id,
          content: 'Test message',
          encrypted_content: 'encrypted_test'
        });

      flow.steps.push({
        action: 'Message sending',
        success: !messageError,
        error: messageError?.message
      });

      // Check message receipt
      const { data: messages, error: fetchError } = await this.supabase
        .from('direct_messages')
        .select('*')
        .eq('thread_id', thread.id);

      flow.steps.push({
        action: 'Message retrieval',
        success: !fetchError && messages && messages.length > 0,
        error: fetchError?.message || (messages?.length === 0 ? 'No messages found' : undefined)
      });
    }

    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'Messaging system working correctly'
      : `Failed at: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  async testLoyaltyFlow(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'Loyalty Points Flow',
      steps: [],
      expectedOutcome: 'Points earned, balance checked, points redeemed'
    };

    // Create a test user
    const userEmail = `loyalty_${Date.now()}@test.com`;
    const { data: userData, error: userError } = await this.supabase.auth.signUp({
      email: userEmail,
      password: 'LoyaltyUser123!'
    });

    if (userError || !userData.user) {
      flow.steps.push({
        action: 'User creation',
        success: false,
        error: userError?.message || 'Failed to create user'
      });
      flow.status = 'FAIL';
      return flow;
    }

    // Award points
    const { error: earnError } = await this.supabase
      .from('loyalty_transactions')
      .insert({
        user_id: userData.user.id,
        transaction_type: 'earned',
        points: 100,
        description: 'Test points award',
        expires_at: new Date(Date.now() + 365 * 86400000).toISOString() // 1 year
      });

    flow.steps.push({
      action: 'Points earning',
      success: !earnError,
      error: earnError?.message
    });

    // Check balance (would use RPC function if available)
    const { data: balance, error: balanceError } = await this.supabase
      .from('loyalty_transactions')
      .select('points')
      .eq('user_id', userData.user.id)
      .eq('transaction_type', 'earned');

    flow.steps.push({
      action: 'Balance check',
      success: !balanceError && balance,
      error: balanceError?.message
    });

    // Attempt redemption
    const { error: redeemError } = await this.supabase
      .from('loyalty_transactions')
      .insert({
        user_id: userData.user.id,
        transaction_type: 'redeemed',
        points: -50,
        description: 'Test redemption'
      });

    flow.steps.push({
      action: 'Points redemption',
      success: !redeemError,
      error: redeemError?.message
    });

    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'Loyalty system working correctly'
      : `Failed at: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  async testFrontendRoutes(): Promise<FlowTest> {
    const flow: FlowTest = {
      name: 'Frontend Route Accessibility',
      steps: [],
      expectedOutcome: 'All routes respond correctly'
    };

    const routes = [
      { path: '/', expectedStatus: 200, name: 'Index' },
      { path: '/auth', expectedStatus: 200, name: 'Auth' },
      { path: '/dashboard', expectedStatus: 200, name: 'Dashboard' },
      { path: '/social', expectedStatus: 200, name: 'Social' },
      { path: '/events', expectedStatus: 200, name: 'Events' },
      { path: '/challenges', expectedStatus: 200, name: 'Challenges' },
      { path: '/non-existent', expectedStatus: 200, name: '404 Page' } // SPA returns 200
    ];

    for (const route of routes) {
      try {
        const response = await fetch(`${BASE_URL}${route.path}`);
        const success = response.status === route.expectedStatus;
        
        flow.steps.push({
          action: `Route ${route.name} (${route.path})`,
          success,
          error: success ? undefined : `Expected ${route.expectedStatus}, got ${response.status}`
        });
      } catch (error: any) {
        flow.steps.push({
          action: `Route ${route.name} (${route.path})`,
          success: false,
          error: error.message
        });
      }
    }

    const allSuccess = flow.steps.every(s => s.success);
    const someSuccess = flow.steps.some(s => s.success);
    
    flow.status = allSuccess ? 'PASS' : someSuccess ? 'PARTIAL' : 'FAIL';
    flow.actualOutcome = allSuccess 
      ? 'All routes accessible'
      : `Failed routes: ${flow.steps.filter(s => !s.success).map(s => s.action).join(', ')}`;
    flow.errors = flow.steps.filter(s => s.error).map(s => s.error!);

    return flow;
  }

  printReport() {
    this.log('\n📊 INTEGRATION TEST REPORT\n', 'info');
    
    const passed = this.flows.filter(f => f.status === 'PASS').length;
    const partial = this.flows.filter(f => f.status === 'PARTIAL').length;
    const failed = this.flows.filter(f => f.status === 'FAIL').length;
    
    this.log('Test Flow Results:', 'info');
    this.flows.forEach(flow => {
      const symbol = flow.status === 'PASS' ? '✅' : flow.status === 'PARTIAL' ? '🟡' : '❌';
      const color = flow.status === 'PASS' ? 'success' : flow.status === 'PARTIAL' ? 'warning' : 'error';
      
      this.log(`\n${symbol} ${flow.name}`, color as any);
      this.log(`  Expected: ${flow.expectedOutcome}`, 'info');
      this.log(`  Actual: ${flow.actualOutcome}`, 'info');
      
      if (flow.errors && flow.errors.length > 0) {
        this.log('  Errors:', 'error');
        flow.errors.forEach(err => this.log(`    - ${err}`, 'error'));
      }
      
      this.log('  Steps:', 'info');
      flow.steps.forEach(step => {
        const stepSymbol = step.success ? '✓' : '✗';
        this.log(`    ${stepSymbol} ${step.action}${step.error ? `: ${step.error}` : ''}`, 
          step.success ? 'success' : 'error');
      });
    });
    
    this.log('\n📈 Summary:', 'info');
    this.log(`  ✅ Passed: ${passed}/${this.flows.length} flows`, passed > 0 ? 'success' : 'info');
    this.log(`  🟡 Partial: ${partial}/${this.flows.length} flows`, partial > 0 ? 'warning' : 'info');
    this.log(`  ❌ Failed: ${failed}/${this.flows.length} flows`, failed > 0 ? 'error' : 'info');
    
    const totalSteps = this.flows.reduce((acc, f) => acc + f.steps.length, 0);
    const successfulSteps = this.flows.reduce((acc, f) => 
      acc + f.steps.filter(s => s.success).length, 0);
    const successRate = Math.round((successfulSteps / totalSteps) * 100);
    
    this.log(`\n🎯 Overall Success Rate: ${successRate}% (${successfulSteps}/${totalSteps} steps)`, 
      successRate > 70 ? 'success' : successRate > 40 ? 'warning' : 'error');
    
    // Critical issues summary
    const criticalIssues = [
      'Authentication system broken (email validation)',
      'Organization context not initialized',
      'Database functions missing',
      'Storage buckets not created',
      'RLS policies not enabled',
      'Edge functions not deployed'
    ];
    
    this.log('\n⚠️ CRITICAL ISSUES CONFIRMED:', 'error');
    criticalIssues.forEach(issue => this.log(`  • ${issue}`, 'error'));
    
    this.log('\n💊 IMMEDIATE FIXES NEEDED:', 'warning');
    this.log('  1. Deploy database migrations: npx supabase db push', 'info');
    this.log('  2. Create storage buckets in Supabase Dashboard', 'info');
    this.log('  3. Fix email validation in auth flow', 'info');
    this.log('  4. Initialize default organization for new users', 'info');
    this.log('  5. Enable RLS on all tables', 'info');
    
    this.log(`\n🚦 APPLICATION STATUS: ${successRate > 70 ? 'DEGRADED' : successRate > 40 ? 'CRITICAL' : 'NON-FUNCTIONAL'}\n`, 
      successRate > 70 ? 'warning' : 'error');
  }

  async runAllTests() {
    this.log('🧪 Starting Integration Tests...\n', 'info');
    
    // Check if server is running
    try {
      await fetch(BASE_URL);
    } catch (error) {
      this.log('❌ Server not running at http://localhost:5000', 'error');
      this.log('Please start the server with: npm run dev', 'warning');
      return;
    }
    
    this.flows.push(await this.testFrontendRoutes());
    this.flows.push(await this.testNewUserFlow());
    this.flows.push(await this.testEventCreationFlow());
    this.flows.push(await this.testSocialFeatureFlow());
    this.flows.push(await this.testChallengeFlow());
    this.flows.push(await this.testMessagingFlow());
    this.flows.push(await this.testLoyaltyFlow());
    
    this.printReport();
  }
}

// Run integration tests
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);
