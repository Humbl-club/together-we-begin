import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  subscription_tier: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
  health_score: number;
  last_activity: string | null;
  monthly_revenue: number;
  owner: {
    email: string;
    full_name: string | null;
  };
}

export const useOrganizationList = (searchTerm: string = '') => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSuperAdmin } = useAuth();

  const fetchOrganizations = async () => {
    if (!user || !isSuperAdmin) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_organizations_for_admin', { 
          admin_user_id: user.id 
        });

      if (fetchError) throw fetchError;

      // Transform and enrich the data
      const enrichedOrgs = (data || []).map((org: any) => ({
        ...org,
        health_score: Math.floor(Math.random() * 100), // TODO: Calculate real health score
        last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        monthly_revenue: Math.floor(Math.random() * 10000) * 100, // TODO: Get real revenue
      }));

      // Apply search filter
      const filtered = searchTerm
        ? enrichedOrgs.filter((org: Organization) => 
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : enrichedOrgs;

      setOrganizations(filtered);
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user?.id, isSuperAdmin, searchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrganizations, 30000);
    return () => clearInterval(interval);
  }, [user?.id, isSuperAdmin, searchTerm]);

  const suspendOrganization = async (orgId: string) => {
    if (!user || !isSuperAdmin) return false;

    try {
      const { error } = await supabase.rpc('update_organization_status', {
        admin_id: user.id,
        org_id: orgId,
        new_status: 'suspended'
      });

      if (error) throw error;
      
      await fetchOrganizations();
      return true;
    } catch (err) {
      console.error('Error suspending organization:', err);
      return false;
    }
  };

  const activateOrganization = async (orgId: string) => {
    if (!user || !isSuperAdmin) return false;

    try {
      const { error } = await supabase.rpc('update_organization_status', {
        admin_id: user.id,
        org_id: orgId,
        new_status: 'active'
      });

      if (error) throw error;
      
      await fetchOrganizations();
      return true;
    } catch (err) {
      console.error('Error activating organization:', err);
      return false;
    }
  };

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations,
    suspendOrganization,
    activateOrganization,
    metrics: {
      totalOrgs: organizations.length,
      activeOrgs: organizations.filter(org => org.is_active).length,
      suspendedOrgs: organizations.filter(org => !org.is_active).length,
      totalRevenue: organizations.reduce((sum, org) => sum + org.monthly_revenue, 0),
      avgHealthScore: organizations.length > 0 
        ? Math.round(organizations.reduce((sum, org) => sum + org.health_score, 0) / organizations.length)
        : 0
    }
  };
};