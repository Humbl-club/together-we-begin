# Comprehensive Test Plan - Humbl Girls Club Platform

## Executive Summary

This comprehensive test plan covers the multi-tenant SaaS platform with focus on critical paths, error scenarios, edge cases, and performance testing for 10,000+ concurrent users. The platform includes 76 database tables, 82 RPC functions, and enterprise-grade security features.

## Test Environment Configuration

### Required Setup
```bash
# Environment Variables
SUPABASE_URL=https://ynqdddwponrqwhtqfepi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# Test Database (Supabase Local)
npx supabase start
npx supabase db reset --seed
```

### Test Data Requirements
- 5 test organizations with different feature sets
- 100 test users per organization
- 1000 test events
- 5000 social posts
- 10000 messages
- Performance test data for 10,000 concurrent users

## 1. Critical Path Testing

### 1.1 User Authentication Flow

#### Test Case: AUTH-001 - User Signup with Organization
**Priority**: Critical
**Components**: AuthProvider, OrganizationContext, Supabase Auth

**Test Steps**:
1. Navigate to /auth
2. Click "Create Account"
3. Enter valid email and password
4. Select or create organization
5. Complete profile setup
6. Verify email confirmation

**Expected Results**:
- User created in auth.users
- Profile created in public.profiles
- Organization membership created
- JWT token contains org context
- User redirected to dashboard

**Actual Issues Found**:
- ❌ RPC function `auto_assign_platform_admin` may fail silently
- ❌ Organization selection not persisted on page refresh
- ❌ Email confirmation redirect URL incorrect for multi-tenant

**Test Implementation**:
```typescript
// client/src/__tests__/critical-paths/auth-signup.test.tsx
describe('User Signup with Organization', () => {
  it('should complete full signup flow with org creation', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Create new organization during signup
    const signupData = {
      email: 'newuser@test.com',
      password: 'Test123!@#',
      userData: {
        full_name: 'Test User',
        create_organization: true,
        organization_name: 'Test Club',
        organization_slug: 'test-club'
      }
    };
    
    await act(async () => {
      const response = await result.current.signUp(
        signupData.email,
        signupData.password,
        signupData.userData
      );
      
      expect(response.error).toBeNull();
      expect(response.data?.user).toBeDefined();
    });
    
    // Verify organization created
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'test-club')
      .single();
      
    expect(org).toBeDefined();
    expect(org.name).toBe('Test Club');
    
    // Verify membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', response.data.user.id)
      .eq('organization_id', org.id)
      .single();
      
    expect(membership.role).toBe('owner');
  });
});
```

### 1.2 Organization Creation and Switching

#### Test Case: ORG-001 - Multi-Organization Management
**Priority**: Critical
**Components**: OrganizationContext, OrganizationSwitcher

**Test Steps**:
1. Login as existing user
2. Create new organization
3. Configure organization features
4. Switch between organizations
5. Verify data isolation

**Expected Results**:
- Organization created with unique slug
- Default features enabled
- Theme and branding applied
- Context switches correctly
- No data leakage between orgs

**Actual Issues Found**:
- ❌ RPC function `create_default_signup_page` missing
- ❌ Theme not applied immediately after creation
- ❌ Dashboard widgets not initialized for new org

### 1.3 Event Creation and Registration

#### Test Case: EVENT-001 - Event Lifecycle
**Priority**: High
**Components**: Events, PaymentModal, Supabase Functions

**Test Implementation**:
```typescript
// client/src/__tests__/critical-paths/event-lifecycle.test.tsx
describe('Event Creation and Registration', () => {
  it('should handle complete event lifecycle', async () => {
    // Create event
    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      start_time: new Date('2025-02-01T10:00:00'),
      end_time: new Date('2025-02-01T12:00:00'),
      location: 'Test Location',
      max_capacity: 50,
      price_cents: 2500,
      loyalty_points_price: 500,
      organization_id: 'test-org-id'
    };
    
    const { data: event, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();
      
    expect(error).toBeNull();
    expect(event.id).toBeDefined();
    
    // Register for event with points
    const { data: payment } = await supabase.functions.invoke('create-payment', {
      body: {
        eventId: event.id,
        usePoints: true
      }
    });
    
    expect(payment.success).toBe(true);
    
    // Verify registration
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', currentUser.id)
      .single();
      
    expect(registration.status).toBe('confirmed');
    expect(registration.payment_method).toBe('points');
  });
});
```

### 1.4 Social Post Creation

#### Test Case: SOCIAL-001 - Post with Media
**Priority**: High
**Components**: Social, Storage, Real-time

**Actual Issues Found**:
- ❌ Image upload fails with CORS error
- ❌ Real-time updates not received by other org members
- ❌ Post visibility not respecting org boundaries

### 1.5 Message Sending

#### Test Case: MSG-001 - Encrypted Messaging
**Priority**: High
**Components**: Messages, Encryption, Real-time

**Test Implementation**:
```typescript
// client/src/__tests__/critical-paths/messaging.test.tsx
describe('Encrypted Messaging', () => {
  it('should send and receive encrypted messages', async () => {
    const message = {
      content: 'Test message',
      recipient_id: 'recipient-user-id',
      thread_id: 'test-thread-id'
    };
    
    // Send message
    const { data: sent } = await supabase
      .from('direct_messages')
      .insert({
        ...message,
        sender_id: currentUser.id,
        encrypted_content: await encryptMessage(message.content)
      })
      .select()
      .single();
      
    expect(sent.id).toBeDefined();
    
    // Verify real-time delivery
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${message.recipient_id}`
      }, (payload) => {
        expect(payload.new.id).toBe(sent.id);
        done();
      })
      .subscribe();
  });
});
```

### 1.6 Points Redemption

#### Test Case: POINTS-001 - Reward Redemption
**Priority**: Medium
**Components**: Loyalty, Rewards, Transactions

**Actual Issues Found**:
- ❌ RPC function `redeem_reward` returns null for valid redemptions
- ❌ Points balance not updated in real-time
- ❌ Expired points not properly handled

## 2. Error Scenarios

### 2.1 Database Connection Failures

#### Test Case: DB-001 - Connection Timeout
**Test Implementation**:
```typescript
// client/src/__tests__/error-scenarios/database-errors.test.tsx
describe('Database Connection Failures', () => {
  it('should handle connection timeout gracefully', async () => {
    // Simulate network failure
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useOrganization());
    
    await waitFor(() => {
      expect(result.current.error).toBe('Failed to connect to database');
      expect(result.current.loading).toBe(false);
    });
    
    // Should show retry button
    expect(screen.getByText('Retry Connection')).toBeInTheDocument();
  });
  
  it('should implement exponential backoff for retries', async () => {
    let attempts = 0;
    vi.spyOn(supabase, 'from').mockImplementation(() => {
      attempts++;
      if (attempts < 3) throw new Error('Connection failed');
      return mockSuccessResponse;
    });
    
    const { result } = renderHook(() => useOrganization());
    
    await waitFor(() => {
      expect(attempts).toBe(3);
      expect(result.current.currentOrganization).toBeDefined();
    }, { timeout: 10000 });
  });
});
```

### 2.2 Missing RPC Functions

#### Test Case: RPC-001 - Function Not Found (42883)
**Priority**: Critical
**Error Code**: PostgreSQL 42883

**Test Implementation**:
```typescript
// client/src/__tests__/error-scenarios/rpc-errors.test.tsx
describe('Missing RPC Functions', () => {
  const missingFunctions = [
    'create_default_signup_page',
    'get_organization_by_slug',
    'create_extreme_modularity_defaults'
  ];
  
  missingFunctions.forEach(funcName => {
    it(`should handle missing RPC function: ${funcName}`, async () => {
      const { error } = await supabase.rpc(funcName, {});
      
      if (error?.code === '42883') {
        // Function doesn't exist
        expect(error.message).toContain('function');
        expect(error.message).toContain('does not exist');
        
        // App should provide fallback
        const fallback = await getFallbackForRPC(funcName);
        expect(fallback).toBeDefined();
      }
    });
  });
});
```

### 2.3 Type Mismatches

#### Test Case: TYPE-001 - Schema Validation
**Test Implementation**:
```typescript
// client/src/__tests__/error-scenarios/type-errors.test.tsx
describe('Type Mismatches', () => {
  it('should validate event data types', async () => {
    const invalidEvent = {
      title: 123, // Should be string
      start_time: 'invalid-date', // Should be timestamp
      max_capacity: 'fifty', // Should be number
      price_cents: 25.50 // Should be integer
    };
    
    const { error } = await supabase
      .from('events')
      .insert(invalidEvent);
      
    expect(error).toBeDefined();
    expect(error.code).toBe('22P02'); // Invalid text representation
  });
  
  it('should handle null values in required fields', async () => {
    const { error } = await supabase
      .from('organizations')
      .insert({
        name: null, // Required field
        slug: 'test-slug'
      });
      
    expect(error.code).toBe('23502'); // Not null violation
  });
});
```

### 2.4 Authentication Failures

#### Test Case: AUTH-ERR-001 - Invalid Credentials
**Test Implementation**:
```typescript
// client/src/__tests__/error-scenarios/auth-errors.test.tsx
describe('Authentication Failures', () => {
  it('should handle invalid credentials', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrong-password'
    });
    
    expect(error.message).toBe('Invalid login credentials');
    expect(error.status).toBe(400);
  });
  
  it('should handle expired JWT tokens', async () => {
    // Set expired token
    localStorage.setItem('supabase.auth.token', expiredToken);
    
    const { error } = await supabase
      .from('organizations')
      .select('*');
      
    expect(error.code).toBe('PGRST301'); // JWT expired
    
    // Should trigger token refresh
    await waitFor(() => {
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });
  });
});
```

### 2.5 Permission Denied Scenarios

#### Test Case: PERM-001 - RLS Policy Violations
**Test Implementation**:
```typescript
// client/src/__tests__/error-scenarios/permission-errors.test.tsx
describe('Permission Denied Scenarios', () => {
  it('should prevent cross-organization data access', async () => {
    // Login as user from Org A
    await loginAs('user-org-a@test.com');
    
    // Try to access Org B's data
    const { error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', 'org-b-id');
      
    expect(error).toBeNull();
    expect(data).toEqual([]); // RLS should filter out
  });
  
  it('should prevent non-admin from modifying org settings', async () => {
    await loginAs('member@test.com');
    
    const { error } = await supabase
      .from('organizations')
      .update({ name: 'Hacked Name' })
      .eq('id', 'test-org-id');
      
    expect(error.code).toBe('42501'); // Insufficient privilege
  });
});
```

## 3. Edge Cases

### 3.1 Concurrent User Operations

#### Test Case: CONC-001 - Race Conditions
**Test Implementation**:
```typescript
// client/src/__tests__/edge-cases/concurrency.test.tsx
describe('Concurrent User Operations', () => {
  it('should handle simultaneous event registrations', async () => {
    const eventId = 'limited-event-id';
    const promises = [];
    
    // 10 users try to register for event with 5 spots
    for (let i = 0; i < 10; i++) {
      promises.push(
        supabase.rpc('register_for_event', {
          event_id: eventId,
          user_id: `user-${i}`
        })
      );
    }
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(successful.length).toBe(5); // Only 5 should succeed
    expect(failed.length).toBe(5); // 5 should fail with capacity error
  });
  
  it('should handle concurrent points redemption', async () => {
    const userId = 'test-user-id';
    const userPoints = 1000;
    
    // Try to redeem 600 points twice simultaneously
    const [result1, result2] = await Promise.all([
      supabase.rpc('redeem_reward', {
        user_id: userId,
        reward_id: 'reward-600-points'
      }),
      supabase.rpc('redeem_reward', {
        user_id: userId,
        reward_id: 'reward-600-points'
      })
    ]);
    
    // Only one should succeed
    const successes = [result1, result2].filter(r => !r.error);
    expect(successes.length).toBe(1);
    
    // Check final balance
    const { data: balance } = await supabase
      .rpc('get_user_available_points', { user_id: userId });
    expect(balance).toBe(400);
  });
});
```

### 3.2 Large Data Sets

#### Test Case: LARGE-001 - Pagination and Virtual Scrolling
**Test Implementation**:
```typescript
// client/src/__tests__/edge-cases/large-datasets.test.tsx
describe('Large Data Sets', () => {
  it('should handle 10,000 posts with virtual scrolling', async () => {
    // Generate test data
    const posts = Array.from({ length: 10000 }, (_, i) => ({
      id: `post-${i}`,
      content: `Test post ${i}`,
      created_at: new Date(),
      organization_id: 'test-org'
    }));
    
    // Insert in batches
    for (let i = 0; i < posts.length; i += 1000) {
      await supabase
        .from('social_posts')
        .insert(posts.slice(i, i + 1000));
    }
    
    // Test virtual scrolling
    render(<Social />);
    
    // Only visible items should be in DOM
    const visiblePosts = screen.getAllByTestId('social-post');
    expect(visiblePosts.length).toBeLessThan(50); // Virtual scroll limit
    
    // Scroll and verify new items load
    fireEvent.scroll(window, { target: { scrollY: 5000 } });
    await waitFor(() => {
      const newPosts = screen.getAllByTestId('social-post');
      expect(newPosts[0].id).not.toBe(visiblePosts[0].id);
    });
  });
  
  it('should optimize queries with proper indexing', async () => {
    const startTime = performance.now();
    
    const { data } = await supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('organization_id', 'test-org')
      .gte('start_time', '2025-01-01')
      .lte('start_time', '2025-12-31')
      .order('start_time', { ascending: true })
      .limit(100);
      
    const queryTime = performance.now() - startTime;
    expect(queryTime).toBeLessThan(200); // Should use index
  });
});
```

### 3.3 Network Interruptions

#### Test Case: NET-001 - Offline Handling
**Test Implementation**:
```typescript
// client/src/__tests__/edge-cases/network.test.tsx
describe('Network Interruptions', () => {
  it('should queue operations when offline', async () => {
    // Go offline
    window.dispatchEvent(new Event('offline'));
    
    // Try to create post
    const post = {
      content: 'Offline post',
      organization_id: 'test-org'
    };
    
    const { error } = await createPost(post);
    expect(error).toBeNull(); // Should queue
    
    // Check queue
    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('CREATE_POST');
    
    // Go online
    window.dispatchEvent(new Event('online'));
    
    // Queue should process
    await waitFor(() => {
      expect(getOfflineQueue().length).toBe(0);
    });
    
    // Post should exist
    const { data } = await supabase
      .from('social_posts')
      .select('*')
      .eq('content', 'Offline post')
      .single();
      
    expect(data).toBeDefined();
  });
});
```

### 3.4 Invalid Inputs

#### Test Case: INPUT-001 - Input Validation
**Test Implementation**:
```typescript
// client/src/__tests__/edge-cases/validation.test.tsx
describe('Invalid Inputs', () => {
  it('should sanitize and validate user inputs', async () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      'Robert\'); DROP TABLE users;--',
      '../../etc/passwd',
      '\x00\x01\x02\x03',
      '🚀'.repeat(10000), // Emoji bomb
      ' '.repeat(1000000), // Space bomb
    ];
    
    for (const input of maliciousInputs) {
      const { error } = await supabase
        .from('social_posts')
        .insert({
          content: input,
          organization_id: 'test-org'
        });
        
      if (!error) {
        // Check stored value is sanitized
        const { data } = await supabase
          .from('social_posts')
          .select('content')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        expect(data.content).not.toContain('<script>');
        expect(data.content).not.toContain('DROP TABLE');
        expect(data.content.length).toBeLessThan(10000);
      }
    }
  });
});
```

### 3.5 Cross-Organization Data Leaks

#### Test Case: ISO-001 - Data Isolation
**Test Implementation**:
```typescript
// client/src/__tests__/edge-cases/isolation.test.tsx
describe('Cross-Organization Data Leaks', () => {
  it('should prevent data leakage between organizations', async () => {
    // Create two organizations
    const [orgA, orgB] = await Promise.all([
      createOrganization('Org A', 'org-a'),
      createOrganization('Org B', 'org-b')
    ]);
    
    // Create data in Org A
    await supabase.from('events').insert({
      title: 'Secret Org A Event',
      organization_id: orgA.id
    });
    
    // Switch to Org B context
    await switchOrganization(orgB.id);
    
    // Try to access Org A data
    const { data: leakedEvents } = await supabase
      .from('events')
      .select('*')
      .eq('title', 'Secret Org A Event');
      
    expect(leakedEvents).toEqual([]);
    
    // Try direct ID access
    const { data: directAccess } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', orgA.id);
      
    expect(directAccess).toEqual([]);
    
    // Verify RLS policies
    const { data: policies } = await supabase
      .rpc('check_rls_policies', {
        table_name: 'events',
        user_id: currentUser.id
      });
      
    expect(policies.select).toContain('organization_id');
  });
});
```

## 4. Performance Testing

### 4.1 Load Testing with 10,000 Users

#### Test Case: PERF-001 - Concurrent User Load
**Test Implementation**:
```typescript
// client/src/__tests__/performance/load-testing.test.tsx
import { test } from '@playwright/test';

describe('Load Testing - 10,000 Concurrent Users', () => {
  test('should handle 10,000 concurrent connections', async () => {
    const users = Array.from({ length: 10000 }, (_, i) => ({
      email: `user${i}@loadtest.com`,
      password: 'TestPass123!'
    }));
    
    // Create users in parallel batches
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map(user => 
          supabase.auth.signUp({
            email: user.email,
            password: user.password
          })
        )
      );
    }
    
    // Simulate concurrent operations
    const operations = users.map(async (user, index) => {
      const startTime = performance.now();
      
      // Login
      await supabase.auth.signInWithPassword(user);
      
      // Perform typical user actions
      await Promise.all([
        supabase.from('events').select('*').limit(10),
        supabase.from('social_posts').select('*').limit(20),
        supabase.from('direct_messages').select('*').limit(50),
        supabase.rpc('get_dashboard_data_v2')
      ]);
      
      const duration = performance.now() - startTime;
      return { userId: index, duration };
    });
    
    const results = await Promise.all(operations);
    
    // Analyze performance
    const durations = results.map(r => r.duration);
    const p50 = percentile(durations, 50);
    const p95 = percentile(durations, 95);
    const p99 = percentile(durations, 99);
    
    expect(p50).toBeLessThan(200); // 50th percentile < 200ms
    expect(p95).toBeLessThan(1000); // 95th percentile < 1s
    expect(p99).toBeLessThan(3000); // 99th percentile < 3s
  });
});
```

### 4.2 Query Optimization

#### Test Case: PERF-002 - Database Query Performance
**Test Implementation**:
```typescript
// client/src/__tests__/performance/query-optimization.test.tsx
describe('Query Optimization', () => {
  it('should execute complex queries within SLA', async () => {
    const queries = [
      {
        name: 'Dashboard Stats',
        query: () => supabase.rpc('get_dashboard_data_v2'),
        maxTime: 100
      },
      {
        name: 'Events with Registrations',
        query: () => supabase
          .from('events')
          .select(`
            *,
            event_registrations(count),
            organization:organizations(name, logo_url)
          `)
          .limit(50),
        maxTime: 150
      },
      {
        name: 'User Activity Feed',
        query: () => supabase
          .from('social_posts')
          .select(`
            *,
            author:profiles!user_id(full_name, avatar_url),
            likes:post_likes(count),
            comments:post_comments(count)
          `)
          .order('created_at', { ascending: false })
          .limit(100),
        maxTime: 200
      }
    ];
    
    for (const { name, query, maxTime } of queries) {
      const start = performance.now();
      const { data, error } = await query();
      const duration = performance.now() - start;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(maxTime);
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    }
  });
});
```

### 4.3 Bundle Size Analysis

#### Test Case: PERF-003 - Frontend Bundle Optimization
**Test Implementation**:
```typescript
// client/src/__tests__/performance/bundle-size.test.tsx
import { analyzeBundle } from 'webpack-bundle-analyzer';

describe('Bundle Size Analysis', () => {
  it('should maintain optimal bundle sizes', async () => {
    const stats = await analyzeBundle();
    
    const mainBundle = stats.assets.find(a => a.name.includes('main'));
    const vendorBundle = stats.assets.find(a => a.name.includes('vendor'));
    
    // Main bundle should be under 512KB
    expect(mainBundle.size).toBeLessThan(512 * 1024);
    
    // Vendor bundle should be split into chunks
    const vendorChunks = stats.assets.filter(a => a.name.includes('vendor'));
    expect(vendorChunks.length).toBeGreaterThan(1);
    
    // No single chunk over 250KB
    vendorChunks.forEach(chunk => {
      expect(chunk.size).toBeLessThan(250 * 1024);
    });
    
    // Check for duplicate dependencies
    const duplicates = findDuplicateDependencies(stats);
    expect(duplicates).toEqual([]);
    
    // Verify tree shaking
    const unusedExports = findUnusedExports(stats);
    expect(unusedExports.length).toBe(0);
  });
});
```

### 4.4 Memory Leak Detection

#### Test Case: PERF-004 - Memory Management
**Test Implementation**:
```typescript
// client/src/__tests__/performance/memory-leaks.test.tsx
describe('Memory Leak Detection', () => {
  it('should not leak memory during navigation', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Navigate through app 100 times
    for (let i = 0; i < 100; i++) {
      await page.goto('/dashboard');
      await page.goto('/events');
      await page.goto('/social');
      await page.goto('/messages');
    }
    
    // Force garbage collection
    await page.evaluate(() => {
      if (global.gc) global.gc();
    });
    
    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
  
  it('should cleanup event listeners and subscriptions', async () => {
    const listeners = [];
    
    // Monitor event listener additions
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(...args) {
      listeners.push(args);
      return originalAddEventListener.apply(this, args);
    };
    
    // Mount and unmount component 100 times
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<Dashboard />);
      await waitFor(() => screen.getByTestId('dashboard'));
      unmount();
    }
    
    // Check for orphaned listeners
    const activeListeners = listeners.filter(l => 
      document.contains(l[0]) || l[0] === window
    );
    
    expect(activeListeners.length).toBeLessThan(10);
  });
});
```

## 5. Security Testing

### 5.1 SQL Injection Prevention

#### Test Case: SEC-001 - SQL Injection Attempts
**Test Implementation**:
```typescript
// client/src/__tests__/security/sql-injection.test.tsx
describe('SQL Injection Prevention', () => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM profiles--",
    "1; UPDATE organizations SET name='Hacked'--"
  ];
  
  it('should prevent SQL injection in search queries', async () => {
    for (const payload of sqlInjectionPayloads) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .ilike('title', `%${payload}%`);
        
      // Should not throw database error
      expect(error).toBeNull();
      
      // Should return empty or sanitized results
      if (data) {
        expect(data.length).toBe(0);
      }
      
      // Verify database integrity
      const { count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
        
      expect(count).toBeGreaterThan(0); // Tables still exist
    }
  });
});
```

### 5.2 XSS Prevention

#### Test Case: SEC-002 - Cross-Site Scripting
**Test Implementation**:
```typescript
// client/src/__tests__/security/xss.test.tsx
describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert()">'
  ];
  
  it('should sanitize user input in posts', async () => {
    for (const payload of xssPayloads) {
      // Create post with XSS payload
      const { data: post } = await supabase
        .from('social_posts')
        .insert({ content: payload })
        .select()
        .single();
        
      // Render post
      render(<PostCard post={post} />);
      
      // Check DOM for script execution
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        expect(script.innerHTML).not.toContain('alert');
      });
      
      // Check rendered content is escaped
      const content = screen.getByTestId('post-content');
      expect(content.innerHTML).not.toContain('<script>');
      expect(content.textContent).toContain(payload);
    }
  });
});
```

## 6. Integration Testing

### 6.1 Third-Party Services

#### Test Case: INT-001 - Stripe Payment Integration
**Test Implementation**:
```typescript
// client/src/__tests__/integration/stripe.test.tsx
describe('Stripe Payment Integration', () => {
  it('should complete payment flow', async () => {
    const { data: session } = await supabase.functions.invoke('create-payment', {
      body: {
        eventId: 'test-event',
        usePoints: false
      }
    });
    
    expect(session.url).toContain('checkout.stripe.com');
    expect(session.id).toBeDefined();
    
    // Simulate webhook
    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: session.id,
          payment_status: 'paid'
        }
      }
    };
    
    const { data: verification } = await supabase.functions.invoke('verify-payment', {
      body: webhookPayload
    });
    
    expect(verification.success).toBe(true);
    
    // Check registration created
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single();
      
    expect(registration.status).toBe('confirmed');
  });
});
```

## 7. Test Execution Plan

### Phase 1: Critical Path (Week 1)
- Authentication flows
- Organization management
- Core features (Events, Social, Messages)
- Payment processing

### Phase 2: Error Handling (Week 2)
- Database errors
- Network failures
- Permission violations
- Input validation

### Phase 3: Performance (Week 3)
- Load testing
- Query optimization
- Bundle analysis
- Memory profiling

### Phase 4: Security (Week 4)
- Penetration testing
- Data isolation verification
- Encryption validation
- Audit trail testing

## 8. Test Metrics and KPIs

### Coverage Targets
- Unit Test Coverage: 80%
- Integration Test Coverage: 70%
- E2E Test Coverage: 60%
- Critical Path Coverage: 100%

### Performance Targets
- P50 Response Time: < 200ms
- P95 Response Time: < 1000ms
- P99 Response Time: < 3000ms
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s

### Reliability Targets
- Error Rate: < 0.1%
- Uptime: 99.9%
- Data Loss: 0%
- Security Incidents: 0

## 9. Issue Tracking

### Critical Issues Found

#### Issue #1: Missing RPC Functions
**Severity**: Critical
**Functions**: `create_default_signup_page`, `get_organization_by_slug`, `create_extreme_modularity_defaults`
**Impact**: Organization creation fails
**Resolution**: Create missing functions or implement fallbacks

#### Issue #2: Organization Context Persistence
**Severity**: High
**Component**: OrganizationContext
**Impact**: User loses organization selection on refresh
**Resolution**: Persist organization ID in localStorage

#### Issue #3: Real-time Subscription Isolation
**Severity**: High
**Component**: RealtimeContext
**Impact**: Users receive updates from other organizations
**Resolution**: Add organization_id filter to subscriptions

#### Issue #4: Points Redemption Race Condition
**Severity**: Medium
**Component**: Loyalty system
**Impact**: Users can redeem more points than available
**Resolution**: Implement database-level locking

## 10. Continuous Testing Strategy

### CI/CD Pipeline
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npx playwright install
      - run: npm run test:e2e
      
  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test:performance
      - uses: actions/upload-artifact@v2
        with:
          name: performance-report
          path: reports/performance.html
```

### Monitoring and Alerting
- Sentry for error tracking
- DataDog for performance monitoring
- PagerDuty for incident management
- Grafana for metrics visualization

## Conclusion

This comprehensive test plan covers all critical aspects of the multi-tenant platform. The identified issues require immediate attention, particularly the missing RPC functions and organization context persistence. Regular execution of these tests will ensure the platform maintains its reliability, performance, and security standards for 10,000+ concurrent users.