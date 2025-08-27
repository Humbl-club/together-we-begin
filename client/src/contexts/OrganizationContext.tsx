import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Organization, OrganizationMember, OrganizationContextType } from '../types/organization';

// OrganizationContextType is now imported from types/organization.ts

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userMemberships, setUserMemberships] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's role in current organization
  const userRole = currentOrganization 
    ? userMemberships.find(m => m.organization_id === currentOrganization.id)?.role || null
    : null;

  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isMember = userRole !== null;

  // Load user's organizations on mount
  useEffect(() => {
    loadUserOrganizations();
  }, []);

  // Set up real-time subscription for organization changes
  useEffect(() => {
    if (!currentOrganization) return;

    const subscription = supabase
      .channel('organization-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'organizations',
          filter: `id=eq.${currentOrganization.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCurrentOrganization(payload.new as Organization);
          } else if (payload.eventType === 'DELETE') {
            // Organization was deleted, switch to first available
            handleOrganizationDeleted();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization?.id]);

  const loadUserOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's organization memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (membershipError) throw membershipError;

      if (memberships && memberships.length > 0) {
        setUserMemberships(memberships);
        
        // Check if user has a saved current organization preference
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_organization_id')
          .eq('id', user.id)
          .single();

        // Set current organization (preference or first one)
        let targetOrgId = profile?.current_organization_id;
        if (!targetOrgId || !memberships.find(m => m.organization_id === targetOrgId)) {
          targetOrgId = memberships[0].organization_id;
        }

        const targetMembership = memberships.find(m => m.organization_id === targetOrgId);
        if (targetMembership) {
          setCurrentOrganization(targetMembership.organizations as Organization);
        }
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      setError(null);
      
      const membership = userMemberships.find(m => m.organization_id === orgId);
      if (!membership) {
        throw new Error('You are not a member of this organization');
      }

      setCurrentOrganization(membership.organizations as Organization);

      // Save user's preference
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ current_organization_id: orgId })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Failed to switch organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch organization');
    }
  };

  const handleOrganizationDeleted = async () => {
    // Remove from memberships and switch to first available
    const updatedMemberships = userMemberships.filter(
      m => m.organization_id !== currentOrganization?.id
    );
    setUserMemberships(updatedMemberships);
    
    if (updatedMemberships.length > 0) {
      await switchOrganization(updatedMemberships[0].organization_id);
    } else {
      setCurrentOrganization(null);
    }
  };

  const value: OrganizationContextType = {
    currentOrganization,
    userMemberships,
    switchOrganization,
    userRole,
    isAdmin,
    isMember,
    loading,
    error
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};