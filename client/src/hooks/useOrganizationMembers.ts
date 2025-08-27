import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useOrganization } from '../contexts/OrganizationContext';

interface OrganizationMemberWithProfile {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url?: string;
    email?: string;
  };
}

export const useOrganizationMembers = () => {
  const { currentOrganization, isAdmin } = useOrganization();
  const [members, setMembers] = useState<OrganizationMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load organization members
  useEffect(() => {
    if (currentOrganization?.id) {
      loadMembers();
      setupRealtimeSubscription();
    }
  }, [currentOrganization?.id]);

  const loadMembers = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles (
            id,
            display_name,
            avatar_url,
            email
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load organization members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentOrganization?.id) return;

    const subscription = supabase
      .channel(`org-members-${currentOrganization.id}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          // Reload members when changes occur
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const inviteMember = async (email: string, role: string = 'member', personalMessage?: string) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can invite members');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('email_invitations')
        .insert({
          organization_id: currentOrganization.id,
          email,
          invited_by: user.id,
          default_role: role,
          personal_message: personalMessage
        });

      if (error) throw error;
      
      // Note: Email sending would be handled by an Edge Function trigger
      return true;
    } catch (err) {
      console.error('Failed to invite member:', err);
      throw err;
    }
  };

  const updateMemberRole = async (userId: string, newRole: string) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can update member roles');
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;
      await loadMembers(); // Refresh members
    } catch (err) {
      console.error('Failed to update member role:', err);
      throw err;
    }
  };

  const removeMember = async (userId: string) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can remove members');
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;
      await loadMembers(); // Refresh members
    } catch (err) {
      console.error('Failed to remove member:', err);
      throw err;
    }
  };

  const suspendMember = async (userId: string) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can suspend members');
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ status: 'suspended' })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;
      await loadMembers(); // Refresh members
    } catch (err) {
      console.error('Failed to suspend member:', err);
      throw err;
    }
  };

  const reactivateMember = async (userId: string) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can reactivate members');
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ status: 'active' })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;
      await loadMembers(); // Refresh members
    } catch (err) {
      console.error('Failed to reactivate member:', err);
      throw err;
    }
  };

  // Helper functions
  const getMembersByRole = (role: string) => {
    return members.filter(m => m.role === role);
  };

  const getActiveMembersCount = () => {
    return members.filter(m => m.status === 'active').length;
  };

  const getMemberByUserId = (userId: string) => {
    return members.find(m => m.user_id === userId);
  };

  const canManageMember = (targetMember: OrganizationMemberWithProfile) => {
    if (!isAdmin) return false;
    
    const { userRole } = useOrganization();
    
    // Owners can manage anyone
    if (userRole === 'owner') return true;
    
    // Admins can manage members and moderators, but not owners or other admins
    if (userRole === 'admin') {
      return ['member', 'moderator'].includes(targetMember.role);
    }
    
    return false;
  };

  return {
    members,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    suspendMember,
    reactivateMember,
    getMembersByRole,
    getActiveMembersCount,
    getMemberByUserId,
    canManageMember,
    refresh: loadMembers
  };
};