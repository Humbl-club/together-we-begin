
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import ConnectionService from '@/services/ConnectionService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOrganizationAdmin: boolean;
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isOrganizationAdmin, setIsOrganizationAdmin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Fast timeout - show UI quickly
    const setLoadingTimeout = () => {
      loadingTimeout = setTimeout(() => {
        if (mounted && loading) {
          console.log('Auth initialization complete - showing UI');
          setLoading(false);
        }
      }, 2000); // 2 second timeout for fast UI
    };

    setLoadingTimeout();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, !!session);
        
        // Clear connection errors on auth success
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setConnectionError(null);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check - don't block UI
        if (session?.user) {
          setTimeout(async () => {
            try {
              // Ensure platform super admin (by email) is granted automatically
              try { await supabase.functions.invoke('grant-super-admin'); } catch {}

              // Check for organization admin (club owners)
              const { data: orgAdminCheck } = await supabase
                .rpc('is_organization_admin', { user_id: session.user.id });
              if (mounted) {
                setIsOrganizationAdmin(orgAdminCheck || false);
                setIsAdmin(orgAdminCheck || false); // Keep backwards compatibility
              }

              // Check for super admin role (platform owner - YOU)
              const { data: superAdminCheck } = await supabase
                .rpc('is_platform_admin', { user_id: session.user.id });
              if (mounted) {
                setIsSuperAdmin(superAdminCheck || false);
                // Optional auto-redirect for super admin to desktop dashboard
                if ((superAdminCheck || false) && (location.pathname === '/' || location.pathname === '/dashboard')) {
                  // Prefer desktop layout; still works on mobile
                  window.location.replace('/super-admin');
                }
              }
            } catch (error) {
              console.error('Error checking admin status:', error);
              if (mounted) {
                setIsAdmin(false);
                setIsSuperAdmin(false);
                setIsOrganizationAdmin(false);
              }
            }
          }, 100); // Quick defer, non-blocking
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsOrganizationAdmin(false);
        }
        
        // Clear timeout and set loading to false
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        setLoading(false);
      }
    );

    // Get initial session - non-blocking
    const getInitialSession = async () => {
      try {
        // Fast timeout for session retrieval
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setConnectionError(null);
          
          // Defer admin check to after UI loads
          if (session?.user) {
            setTimeout(async () => {
              try {
                try { await supabase.functions.invoke('grant-super-admin'); } catch {}
                // Check for organization admin (club owners)
                const { data: orgAdminCheck } = await supabase
                  .rpc('is_organization_admin', { user_id: session.user.id });
                if (mounted) {
                  setIsOrganizationAdmin(orgAdminCheck || false);
                  setIsAdmin(orgAdminCheck || false);
                }

                // Check for super admin role (platform owner - YOU)
                const { data: superAdminCheck } = await supabase
                  .rpc('is_platform_admin', { user_id: session.user.id });
                if (mounted) {
                  setIsSuperAdmin(superAdminCheck || false);
                  if ((superAdminCheck || false) && (location.pathname === '/' || location.pathname === '/dashboard')) {
                    window.location.replace('/super-admin');
                  }
                }
              } catch (error) {
                console.error('Error checking admin status:', error);
                if (mounted) {
                  setIsAdmin(false);
                  setIsSuperAdmin(false);
                  setIsOrganizationAdmin(false);
                }
              }
            }, 100);
          }
          
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Session retrieval failed - showing UI anyway:', error);
        if (mounted) {
          // Don't block UI - show it even if session fails
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: Record<string, any>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsOrganizationAdmin(false);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAdmin,
    isSuperAdmin,
    isOrganizationAdmin,
    connectionError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
