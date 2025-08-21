
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
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;
    let connectionRetryCount = 0;
    const maxRetries = 3;

    // Set loading timeout to prevent infinite loading
    const setLoadingTimeout = () => {
      loadingTimeout = setTimeout(() => {
        if (mounted && loading) {
          console.warn('Auth loading timeout - forcing completion');
          setLoading(false);
          setConnectionError('Connection timeout. Please check your internet connection.');
        }
      }, 10000); // 10 second timeout
    };

    setLoadingTimeout();

    // Check connection first
    const connectionService = ConnectionService.getInstance();
    connectionService.checkConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('No connection detected during auth init');
        setConnectionError('No internet connection detected.');
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, !!session);
        
        // Clear any connection errors on successful auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setConnectionError(null);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status when user changes
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: adminCheck } = await supabase
                .rpc('is_admin', { _user_id: session.user.id });
              if (mounted) {
                setIsAdmin(adminCheck || false);
              }
            } catch (error) {
              console.error('Error checking admin status:', error);
              if (mounted) {
                setIsAdmin(false);
              }
            }
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        // Clear timeout and set loading to false
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        setLoading(false);
      }
    );

    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 8000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (mounted) {
          console.log('Initial session retrieved:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
          setConnectionError(null);
          
          if (session?.user) {
            try {
              const { data: adminCheck } = await supabase
                .rpc('is_admin', { _user_id: session.user.id });
              setIsAdmin(adminCheck || false);
            } catch (error) {
              console.error('Error checking admin status:', error);
              setIsAdmin(false);
            }
          }
          
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          connectionRetryCount++;
          
          if (connectionRetryCount < maxRetries) {
            console.log(`Retrying session fetch (${connectionRetryCount}/${maxRetries})...`);
            setTimeout(() => getInitialSession(), 2000 * connectionRetryCount);
          } else {
            setConnectionError('Failed to connect. Please check your internet connection and try again.');
            if (loadingTimeout) {
              clearTimeout(loadingTimeout);
            }
            setLoading(false);
          }
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
