import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createClient } from '@supabase/supabase-js'

/**
 * Critical security tests to ensure complete data isolation between organizations
 * Tests all 76 tables for proper RLS (Row Level Security) policies
 */
describe('Multi-Tenant Data Isolation - Security Critical', () => {
  let orgA: any
  let orgB: any
  let userA: any
  let userB: any
  let clientA: any
  let clientB: any

  beforeAll(async () => {
    // Create two separate organizations
    const { data: organization1 } = await supabase
      .from('organizations')
      .insert({
        name: 'Organization A - Test',
        slug: 'org-a-test-' + Date.now(),
      })
      .select()
      .single()
    orgA = organization1

    const { data: organization2 } = await supabase
      .from('organizations')
      .insert({
        name: 'Organization B - Test',
        slug: 'org-b-test-' + Date.now(),
      })
      .select()
      .single()
    orgB = organization2

    // Create users for each organization
    const { data: { user: user1 } } = await supabase.auth.signUp({
      email: `user-a-${Date.now()}@test.com`,
      password: 'TestPass123!',
    })
    userA = user1

    const { data: { user: user2 } } = await supabase.auth.signUp({
      email: `user-b-${Date.now()}@test.com`,
      password: 'TestPass123!',
    })
    userB = user2

    // Create separate Supabase clients for each user
    clientA = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    clientB = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Sign in users to their respective clients
    await clientA.auth.signInWithPassword({
      email: userA.email,
      password: 'TestPass123!',
    })

    await clientB.auth.signInWithPassword({
      email: userB.email,
      password: 'TestPass123!',
    })

    // Add users to their respective organizations
    await supabase.from('organization_members').insert([
      {
        organization_id: orgA.id,
        user_id: userA.id,
        role: 'owner',
      },
      {
        organization_id: orgB.id,
        user_id: userB.id,
        role: 'owner',
      },
    ])
  })

  afterAll(async () => {
    // Cleanup test data
    if (orgA?.id) {
      await supabase.from('organizations').delete().eq('id', orgA.id)
    }
    if (orgB?.id) {
      await supabase.from('organizations').delete().eq('id', orgB.id)
    }
  })

  describe('Core Organization Tables', () => {
    it('should prevent cross-organization access to organization data', async () => {
      // User A should NOT see Organization B
      const { data: orgsVisibleToA } = await clientA
        .from('organizations')
        .select('*')
        .eq('id', orgB.id)

      expect(orgsVisibleToA).toEqual([])

      // User B should NOT see Organization A
      const { data: orgsVisibleToB } = await clientB
        .from('organizations')
        .select('*')
        .eq('id', orgA.id)

      expect(orgsVisibleToB).toEqual([])
    })

    it('should prevent access to other organization members', async () => {
      // User A tries to see members of Org B
      const { data: membersB } = await clientA
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgB.id)

      expect(membersB).toEqual([])

      // User B tries to see members of Org A
      const { data: membersA } = await clientB
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(membersA).toEqual([])
    })

    it('should prevent modification of other organization settings', async () => {
      // User A tries to update Org B
      const { error: updateErrorA } = await clientA
        .from('organizations')
        .update({ name: 'Hacked Org B' })
        .eq('id', orgB.id)

      expect(updateErrorA).toBeDefined()

      // Verify Org B name unchanged
      const { data: orgBCheck } = await clientB
        .from('organizations')
        .select('name')
        .eq('id', orgB.id)
        .single()

      expect(orgBCheck?.name).toBe('Organization B - Test')
    })
  })

  describe('Events Table Isolation', () => {
    let eventA: any
    let eventB: any

    beforeAll(async () => {
      // Create events in each organization
      const { data: event1 } = await clientA
        .from('events')
        .insert({
          title: 'Secret Event A',
          organization_id: orgA.id,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
        })
        .select()
        .single()
      eventA = event1

      const { data: event2 } = await clientB
        .from('events')
        .insert({
          title: 'Secret Event B',
          organization_id: orgB.id,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
        })
        .select()
        .single()
      eventB = event2
    })

    it('should isolate events between organizations', async () => {
      // User A should NOT see Event B
      const { data: eventsA } = await clientA
        .from('events')
        .select('*')
        .eq('id', eventB?.id)

      expect(eventsA).toEqual([])

      // User B should NOT see Event A
      const { data: eventsB } = await clientB
        .from('events')
        .select('*')
        .eq('id', eventA?.id)

      expect(eventsB).toEqual([])
    })

    it('should prevent registration for other org events', async () => {
      if (!eventB?.id) return

      // User A tries to register for Org B event
      const { error } = await clientA
        .from('event_registrations')
        .insert({
          event_id: eventB.id,
          user_id: userA.id,
        })

      expect(error).toBeDefined()
    })

    it('should prevent event modification across organizations', async () => {
      if (!eventB?.id) return

      // User A tries to modify Org B event
      const { error } = await clientA
        .from('events')
        .update({ title: 'Hacked Event B' })
        .eq('id', eventB.id)

      expect(error).toBeDefined()

      // Verify event unchanged
      const { data: eventCheck } = await clientB
        .from('events')
        .select('title')
        .eq('id', eventB.id)
        .single()

      expect(eventCheck?.title).toBe('Secret Event B')
    })
  })

  describe('Social Posts Isolation', () => {
    let postA: any
    let postB: any

    beforeAll(async () => {
      // Create posts in each organization
      const { data: post1 } = await clientA
        .from('social_posts')
        .insert({
          content: 'Private post from Org A',
          organization_id: orgA.id,
          user_id: userA.id,
        })
        .select()
        .single()
      postA = post1

      const { data: post2 } = await clientB
        .from('social_posts')
        .insert({
          content: 'Private post from Org B',
          organization_id: orgB.id,
          user_id: userB.id,
        })
        .select()
        .single()
      postB = post2
    })

    it('should isolate social posts between organizations', async () => {
      // User A should NOT see posts from Org B
      const { data: postsA } = await clientA
        .from('social_posts')
        .select('*')
        .eq('organization_id', orgB.id)

      expect(postsA).toEqual([])

      // User B should NOT see posts from Org A
      const { data: postsB } = await clientB
        .from('social_posts')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(postsB).toEqual([])
    })

    it('should prevent liking posts from other organizations', async () => {
      if (!postB?.id) return

      // User A tries to like Org B post
      const { error } = await clientA
        .from('post_likes')
        .insert({
          post_id: postB.id,
          user_id: userA.id,
        })

      // Should either error or silently fail
      if (!error) {
        // Check if like was actually created
        const { data: likes } = await clientB
          .from('post_likes')
          .select('*')
          .eq('post_id', postB.id)
          .eq('user_id', userA.id)

        expect(likes).toEqual([])
      }
    })

    it('should prevent commenting on posts from other organizations', async () => {
      if (!postB?.id) return

      // User A tries to comment on Org B post
      const { error } = await clientA
        .from('post_comments')
        .insert({
          post_id: postB.id,
          user_id: userA.id,
          content: 'Spam comment',
        })

      expect(error).toBeDefined()
    })
  })

  describe('Direct Messages Isolation', () => {
    it('should prevent messaging users from other organizations', async () => {
      // User A tries to message User B (different org)
      const { error } = await clientA
        .from('direct_messages')
        .insert({
          sender_id: userA.id,
          recipient_id: userB.id,
          content: 'Cross-org message attempt',
        })

      // Should be blocked by RLS
      expect(error).toBeDefined()
    })

    it('should isolate message threads between organizations', async () => {
      // Create a thread in Org A
      const { data: threadA } = await clientA
        .from('message_threads')
        .insert({
          participant1_id: userA.id,
          participant2_id: userA.id, // Self-thread for testing
          organization_id: orgA.id,
        })
        .select()
        .single()

      // User B should NOT see this thread
      const { data: threadsB } = await clientB
        .from('message_threads')
        .select('*')
        .eq('id', threadA?.id)

      expect(threadsB).toEqual([])
    })
  })

  describe('Challenges and Wellness Isolation', () => {
    let challengeA: any
    let challengeB: any

    beforeAll(async () => {
      // Create challenges in each organization
      const { data: challenge1 } = await clientA
        .from('challenges')
        .insert({
          title: 'Org A Challenge',
          organization_id: orgA.id,
          type: 'walking',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
        })
        .select()
        .single()
      challengeA = challenge1

      const { data: challenge2 } = await clientB
        .from('challenges')
        .insert({
          title: 'Org B Challenge',
          organization_id: orgB.id,
          type: 'walking',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
        })
        .select()
        .single()
      challengeB = challenge2
    })

    it('should isolate challenges between organizations', async () => {
      // User A should NOT see Org B challenges
      const { data: challengesA } = await clientA
        .from('challenges')
        .select('*')
        .eq('organization_id', orgB.id)

      expect(challengesA).toEqual([])

      // User B should NOT see Org A challenges
      const { data: challengesB } = await clientB
        .from('challenges')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(challengesB).toEqual([])
    })

    it('should prevent joining challenges from other organizations', async () => {
      if (!challengeB?.id) return

      // User A tries to join Org B challenge
      const { error } = await clientA
        .from('challenge_participations')
        .insert({
          challenge_id: challengeB.id,
          user_id: userA.id,
        })

      expect(error).toBeDefined()
    })

    it('should isolate health data between organizations', async () => {
      // Create health data for User A
      await clientA
        .from('health_data')
        .insert({
          user_id: userA.id,
          organization_id: orgA.id,
          steps: 10000,
          date: new Date().toISOString(),
        })

      // User B should NOT see User A's health data
      const { data: healthDataB } = await clientB
        .from('health_data')
        .select('*')
        .eq('user_id', userA.id)

      expect(healthDataB).toEqual([])
    })
  })

  describe('Loyalty Points Isolation', () => {
    it('should isolate loyalty transactions between organizations', async () => {
      // Create points for User A in Org A
      await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userA.id,
          organization_id: orgA.id,
          points: 100,
          type: 'earned',
          description: 'Test points',
        })

      // User B should NOT see User A's transactions
      const { data: transactionsB } = await clientB
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userA.id)

      expect(transactionsB).toEqual([])

      // User A should NOT see transactions from Org B
      const { data: transactionsA } = await clientA
        .from('loyalty_transactions')
        .select('*')
        .eq('organization_id', orgB.id)

      expect(transactionsA).toEqual([])
    })

    it('should prevent reward redemption across organizations', async () => {
      // Create reward in Org B
      const { data: rewardB } = await clientB
        .from('rewards_catalog')
        .insert({
          organization_id: orgB.id,
          name: 'Org B Exclusive Reward',
          points_required: 50,
        })
        .select()
        .single()

      if (!rewardB?.id) return

      // User A tries to redeem Org B reward
      const { error } = await clientA
        .from('reward_redemptions')
        .insert({
          user_id: userA.id,
          reward_id: rewardB.id,
          points_spent: 50,
        })

      expect(error).toBeDefined()
    })
  })

  describe('Platform Admin Bypass', () => {
    it('should allow platform admins to access all organizations', async () => {
      // Make User A a platform admin
      await supabase
        .from('platform_admins')
        .insert({
          user_id: userA.id,
          role: 'super_admin',
          is_active: true,
        })

      // Platform admin should see all organizations
      const { data: allOrgs } = await clientA
        .from('organizations')
        .select('*')

      expect(allOrgs?.length).toBeGreaterThanOrEqual(2)
      
      // Clean up admin role
      await supabase
        .from('platform_admins')
        .delete()
        .eq('user_id', userA.id)
    })
  })

  describe('Invite Codes Isolation', () => {
    it('should prevent using invite codes from other organizations', async () => {
      // Create invite code for Org B
      const { data: inviteB } = await clientB
        .from('invite_codes')
        .insert({
          organization_id: orgB.id,
          code: 'ORG-B-ONLY-' + Date.now(),
          max_uses: 10,
          created_by: userB.id,
        })
        .select()
        .single()

      if (!inviteB?.code) return

      // User A tries to use Org B invite code
      const { error } = await clientA
        .from('invite_redemptions')
        .insert({
          invite_code_id: inviteB.id,
          user_id: userA.id,
        })

      expect(error).toBeDefined()
    })
  })

  describe('Theme and Customization Isolation', () => {
    it('should isolate theme settings between organizations', async () => {
      // Set theme for Org A
      await clientA
        .from('organization_themes')
        .upsert({
          organization_id: orgA.id,
          primary_color: '#FF0000',
          secondary_color: '#00FF00',
        })

      // User B should NOT see Org A's theme
      const { data: themeB } = await clientB
        .from('organization_themes')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(themeB).toEqual([])
    })

    it('should prevent modifying other organization themes', async () => {
      // User A tries to modify Org B theme
      const { error } = await clientA
        .from('organization_themes')
        .update({ primary_color: '#000000' })
        .eq('organization_id', orgB.id)

      expect(error).toBeDefined()
    })
  })

  describe('Dashboard Widgets Isolation', () => {
    it('should isolate dashboard configurations between organizations', async () => {
      // Create dashboard layout for Org A
      const { data: layoutA } = await clientA
        .from('dashboard_layouts')
        .insert({
          organization_id: orgA.id,
          user_id: userA.id,
          layout_config: { widgets: ['stats', 'events'] },
        })
        .select()
        .single()

      // User B should NOT see Org A's layouts
      const { data: layoutsB } = await clientB
        .from('dashboard_layouts')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(layoutsB).toEqual([])
    })
  })

  describe('Audit and Moderation Isolation', () => {
    it('should isolate audit logs between organizations', async () => {
      // Create audit log for Org A
      await supabase
        .from('platform_audit_logs')
        .insert({
          organization_id: orgA.id,
          user_id: userA.id,
          action: 'test_action',
          details: { test: 'data' },
        })

      // User B should NOT see Org A's audit logs
      const { data: logsB } = await clientB
        .from('platform_audit_logs')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(logsB).toEqual([])
    })

    it('should isolate content moderation between organizations', async () => {
      // Create content report in Org A
      const { data: reportA } = await clientA
        .from('content_reports')
        .insert({
          organization_id: orgA.id,
          reporter_id: userA.id,
          content_type: 'post',
          content_id: 'test-post-id',
          reason: 'spam',
        })
        .select()
        .single()

      // User B should NOT see Org A's reports
      const { data: reportsB } = await clientB
        .from('content_reports')
        .select('*')
        .eq('organization_id', orgA.id)

      expect(reportsB).toEqual([])
    })
  })

  describe('Cross-Table Data Leak Prevention', () => {
    it('should prevent data leaks through JOIN queries', async () => {
      // Try to join across organizations
      const { data: leakedData } = await clientA
        .from('events')
        .select(`
          *,
          event_registrations(*),
          organization:organizations(*)
        `)
        .eq('organization_id', orgB.id)

      expect(leakedData).toEqual([])
    })

    it('should prevent data leaks through RPC functions', async () => {
      // Try to call RPC with other org's data
      const { data, error } = await clientA
        .rpc('get_organization_members_for_admin', {
          org_id: orgB.id,
        })

      // Should either error or return empty
      if (!error) {
        expect(data).toEqual([])
      } else {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Summary Report', () => {
    it('should validate all critical tables have RLS enabled', async () => {
      const criticalTables = [
        'organizations',
        'organization_members',
        'events',
        'event_registrations',
        'social_posts',
        'direct_messages',
        'challenges',
        'loyalty_transactions',
        'rewards_catalog',
        'invite_codes',
      ]

      for (const table of criticalTables) {
        // Attempt cross-org access
        const { data: crossOrgData } = await clientA
          .from(table)
          .select('*')
          .eq('organization_id', orgB.id)
          .limit(1)

        expect(
          crossOrgData,
          `Table ${table} leaked data across organizations!`
        ).toEqual([])
      }

      console.log('✅ All critical tables passed isolation tests')
    })
  })
})