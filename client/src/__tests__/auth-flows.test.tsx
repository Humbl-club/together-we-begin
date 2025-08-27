import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/integrations/supabase/client'

// Mock modules
vi.mock('@/integrations/supabase/client')
vi.mock('@/services/ConnectionService')

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  rpc: vi.fn(),
}

// Set up mock before each test
beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(supabase, mockSupabase)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AuthProvider - Critical Authentication Flows', () => {
  describe('Initial Authentication State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })

    it('should handle session timeout gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Timeout'))
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      expect(result.current.user).toBe(null)
    })
  })

  describe('Sign In Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'mock-token' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password123')
        expect(response.error).toBe(null)
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign in errors', async () => {
      const mockError = new Error('Invalid credentials')
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword')
        expect(response.error).toBe(mockError)
      })
    })
  })

  describe('Sign Up Flow', () => {
    it('should successfully sign up with valid data', async () => {
      const userData = {
        full_name: 'Test User',
        organization_id: 'org-123'
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user-id' }, session: null },
        error: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password123', userData)
        expect(response.error).toBe(null)
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      })
    })
  })

  describe('Admin Role Management', () => {
    it('should correctly identify organization admin', async () => {
      const mockUser = { id: 'admin-user-id', email: 'admin@example.com' }
      const mockSession = { user: mockUser, access_token: 'mock-token' }

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null }) // is_organization_admin
        .mockResolvedValueOnce({ data: false, error: null }) // is_platform_admin

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        // Simulate successful sign in
        setTimeout(() => {
          callback('SIGNED_IN', mockSession)
        }, 0)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isOrganizationAdmin).toBe(true)
        expect(result.current.isAdmin).toBe(true) // backwards compatibility
        expect(result.current.isSuperAdmin).toBe(false)
      })
    })

    it('should correctly identify super admin', async () => {
      const mockUser = { id: 'super-admin-id', email: 'superadmin@example.com' }
      const mockSession = { user: mockUser, access_token: 'mock-token' }

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null }) // is_organization_admin
        .mockResolvedValueOnce({ data: true, error: null }) // is_platform_admin

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => {
          callback('SIGNED_IN', mockSession)
        }, 0)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isSuperAdmin).toBe(true)
        expect(result.current.isOrganizationAdmin).toBe(false)
      })
    })

    it('should handle admin check errors gracefully', async () => {
      const mockUser = { id: 'user-id', email: 'user@example.com' }
      const mockSession = { user: mockUser, access_token: 'mock-token' }

      mockSupabase.rpc.mockRejectedValue(new Error('Database error'))

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => {
          callback('SIGNED_IN', mockSession)
        }, 0)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false)
        expect(result.current.isSuperAdmin).toBe(false)
        expect(result.current.isOrganizationAdmin).toBe(false)
      })
    })
  })

  describe('Sign Out Flow', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isSuperAdmin).toBe(false)
      expect(result.current.isOrganizationAdmin).toBe(false)
    })
  })

  describe('Password Reset Flow', () => {
    it('should successfully send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        const response = await result.current.resetPassword('test@example.com')
        expect(response.error).toBe(null)
      })

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: `${window.location.origin}/auth?mode=reset`
        }
      )
    })
  })

  describe('Auth State Changes', () => {
    it('should handle token refresh', async () => {
      const mockUser = { id: 'user-id', email: 'user@example.com' }
      const mockSession = { user: mockUser, access_token: 'refreshed-token' }

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => {
          callback('TOKEN_REFRESHED', mockSession)
        }, 0)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.session).toEqual(mockSession)
      })
    })

    it('should clear connection errors on successful auth', async () => {
      const mockUser = { id: 'user-id', email: 'user@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => {
          callback('SIGNED_IN', mockSession)
        }, 0)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.connectionError).toBe(null)
      })
    })
  })
})

describe('useAuth Hook', () => {
  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})