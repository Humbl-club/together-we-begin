import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import type { Organization, OrganizationMember } from '@/types/organization'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('Organization Lifecycle - Critical Path', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockOrganization: Organization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    description: 'Test Description',
    logo_url: null,
    website: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: mockUser.id,
    settings: {},
    subscription_tier: 'free',
    subscription_status: 'active',
    member_count: 1,
    is_active: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth state
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser, access_token: 'mock-token' } },
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Organization Creation', () => {
    it('should create new organization with default settings', async () => {
      const newOrgData = {
        name: 'New Club',
        slug: 'new-club',
        description: 'A new community club',
      }

      // Mock successful organization creation
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockOrganization, ...newOrgData },
                  error: null,
                }),
              }),
            }),
          } as any
        }
        return {} as any
      })

      // Mock RPC calls for default setup
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ data: true, error: null }) // create_default_theme_settings
        .mockResolvedValueOnce({ data: true, error: null }) // create_default_dashboard_layout
        .mockResolvedValueOnce({ data: true, error: null }) // create_extreme_modularity_defaults

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        const org = await result.current.createOrganization(newOrgData)
        expect(org).toBeDefined()
        expect(org.name).toBe('New Club')
        expect(org.slug).toBe('new-club')
      })

      // Verify default setup functions were called
      expect(supabase.rpc).toHaveBeenCalledWith('create_default_theme_settings', {
        org_id: expect.any(String),
      })
      expect(supabase.rpc).toHaveBeenCalledWith('create_default_dashboard_layout', {
        org_id: expect.any(String),
      })
    })

    it('should handle organization creation errors', async () => {
      const error = new Error('Slug already exists')
      
      vi.mocked(supabase.from).mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any))

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        try {
          await result.current.createOrganization({
            name: 'Duplicate Club',
            slug: 'existing-slug',
          })
        } catch (err) {
          expect(err).toBe(error)
        }
      })
    })
  })

  describe('Organization Switching', () => {
    const organizations = [
      { ...mockOrganization, id: 'org-1', name: 'Org 1', slug: 'org-1' },
      { ...mockOrganization, id: 'org-2', name: 'Org 2', slug: 'org-2' },
      { ...mockOrganization, id: 'org-3', name: 'Org 3', slug: 'org-3' },
    ]

    beforeEach(() => {
      // Mock user memberships
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: organizations.map(org => ({
                  organization_id: org.id,
                  user_id: mockUser.id,
                  role: 'member',
                  joined_at: new Date().toISOString(),
                })),
                error: null,
              }),
            }),
          } as any
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: organizations,
                error: null,
              }),
            }),
          } as any
        }
        return {} as any
      })
    })

    it('should switch between organizations', async () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Switch to different organization
      await act(async () => {
        await result.current.switchOrganization('org-2')
      })

      expect(result.current.currentOrganization?.id).toBe('org-2')
      
      // Verify organization-specific data is loaded
      expect(supabase.from).toHaveBeenCalledWith('organization_features')
      expect(supabase.from).toHaveBeenCalledWith('organization_themes')
    })

    it('should persist organization selection', async () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        await result.current.switchOrganization('org-2')
      })

      // Check localStorage
      const stored = localStorage.getItem('selected_organization_id')
      expect(stored).toBe('org-2')
    })
  })

  describe('Feature Management', () => {
    const features = [
      { feature_key: 'events', enabled: true },
      { feature_key: 'challenges', enabled: true },
      { feature_key: 'loyalty', enabled: false },
    ]

    beforeEach(() => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organization_features') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: features,
                error: null,
              }),
            }),
            upsert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any
        }
        return {} as any
      })
    })

    it('should check if feature is enabled', async () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasFeature('events')).toBe(true)
      expect(result.current.hasFeature('challenges')).toBe(true)
      expect(result.current.hasFeature('loyalty')).toBe(false)
      expect(result.current.hasFeature('nonexistent')).toBe(false)
    })

    it('should enable/disable features', async () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        await result.current.toggleFeature('loyalty', true)
      })

      expect(supabase.from).toHaveBeenCalledWith('organization_features')
      expect(result.current.hasFeature('loyalty')).toBe(true)
    })
  })

  describe('Theme Customization', () => {
    const theme = {
      primary_color: '#FF6B6B',
      secondary_color: '#4ECDC4',
      background_color: '#FFFFFF',
      text_color: '#2D3748',
      font_family: 'Inter',
      border_radius: 8,
    }

    it('should update organization theme', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organization_themes') {
          return {
            upsert: vi.fn().mockResolvedValue({
              data: theme,
              error: null,
            }),
          } as any
        }
        return {} as any
      })

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        await result.current.updateTheme(theme)
      })

      expect(result.current.organizationTheme).toEqual(theme)
    })

    it('should apply theme to DOM', async () => {
      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        await result.current.updateTheme(theme)
      })

      // Check CSS variables are set
      const root = document.documentElement
      expect(root.style.getPropertyValue('--primary')).toBe('#FF6B6B')
      expect(root.style.getPropertyValue('--font-family')).toBe('Inter')
    })
  })

  describe('Member Management', () => {
    const members: OrganizationMember[] = [
      {
        id: 'member-1',
        organization_id: mockOrganization.id,
        user_id: 'user-1',
        role: 'owner',
        joined_at: new Date().toISOString(),
        profile: {
          full_name: 'Owner User',
          avatar_url: null,
        },
      },
      {
        id: 'member-2',
        organization_id: mockOrganization.id,
        user_id: 'user-2',
        role: 'admin',
        joined_at: new Date().toISOString(),
        profile: {
          full_name: 'Admin User',
          avatar_url: null,
        },
      },
      {
        id: 'member-3',
        organization_id: mockOrganization.id,
        user_id: 'user-3',
        role: 'member',
        joined_at: new Date().toISOString(),
        profile: {
          full_name: 'Member User',
          avatar_url: null,
        },
      },
    ]

    it('should load organization members', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: members,
                error: null,
              }),
            }),
          } as any
        }
        return {} as any
      })

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await waitFor(() => {
        expect(result.current.organizationMembers).toHaveLength(3)
      })

      expect(result.current.organizationMembers[0].role).toBe('owner')
      expect(result.current.organizationMembers[1].role).toBe('admin')
      expect(result.current.organizationMembers[2].role).toBe('member')
    })

    it('should update member roles', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: { ...members[2], role: 'admin' },
                  error: null,
                }),
              }),
            }),
          } as any
        }
        return {} as any
      })

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        await result.current.updateMemberRole('user-3', 'admin')
      })

      expect(supabase.from).toHaveBeenCalledWith('organization_members')
    })

    it('should ban user from organization', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: true,
        error: null,
      })

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        await result.current.banUser('user-3', 'Violation of community guidelines')
      })

      expect(supabase.rpc).toHaveBeenCalledWith('ban_user_from_organization', {
        target_user_id: 'user-3',
        org_id: mockOrganization.id,
        reason: 'Violation of community guidelines',
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to organization changes', async () => {
      const channelMock = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      }

      vi.mocked(supabase.channel).mockReturnValue(channelMock as any)

      renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('organization-changes')
      })

      expect(channelMock.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'organizations',
        }),
        expect.any(Function)
      )
    })

    it('should handle organization deletion', async () => {
      const channelMock = {
        on: vi.fn((event, config, callback) => {
          // Simulate organization deletion
          setTimeout(() => {
            callback({
              eventType: 'DELETE',
              old: mockOrganization,
            })
          }, 100)
          return channelMock
        }),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      }

      vi.mocked(supabase.channel).mockReturnValue(channelMock as any)

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await waitFor(() => {
        expect(result.current.currentOrganization).toBeNull()
      })
    })
  })

  describe('Platform Admin Functions', () => {
    it('should identify platform admin users', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'platform_admins') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      user_id: mockUser.id,
                      role: 'super_admin',
                      is_active: true,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any
        }
        return {} as any
      })

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await waitFor(() => {
        expect(result.current.isPlatformAdmin).toBe(true)
        expect(result.current.isSuperAdmin).toBe(true)
      })
    })

    it('should allow platform admin to access all organizations', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockResolvedValue({
              data: organizations,
              error: null,
            }),
          } as any
        }
        return {} as any
      })

      const { result } = renderHook(() => useOrganization(), {
        wrapper: OrganizationProvider,
      })

      await act(async () => {
        const allOrgs = await result.current.getAllOrganizations()
        expect(allOrgs).toHaveLength(3)
      })
    })
  })
})