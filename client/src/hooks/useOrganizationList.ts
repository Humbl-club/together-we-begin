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

// Calculate health score based on organization metrics
const calculateHealthScore = (org: any): number => {
  let score = 0;
  
  // Active status (+30 points)
  if (org.is_active) score += 30;
  
  // Member count contribution (up to 30 points)
  if (org.member_count > 0) {
    score += Math.min(30, Math.floor(org.member_count / 10) * 5);
  }
  
  // Subscription tier contribution (up to 20 points)
  const tierScores: Record<string, number> = {
    'free': 5,
    'basic': 10,
    'pro': 15,
    'enterprise': 20
  };
  score += tierScores[org.subscription_tier] || 0;
  
  // Recent activity contribution (up to 20 points)
  if (org.last_activity) {
    const daysSinceActivity = Math.floor((Date.now() - new Date(org.last_activity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity <= 1) score += 20;
    else if (daysSinceActivity <= 7) score += 15;
    else if (daysSinceActivity <= 30) score += 10;
    else if (daysSinceActivity <= 90) score += 5;
  }
  
  return Math.min(100, score);
};

// Calculate monthly revenue based on subscription tier and member count
const calculateMonthlyRevenue = (tier: string, memberCount: number): number => {
  const tierPricing: Record<string, number> = {
    'free': 0,
    'basic': 1900, // $19.00 in cents
    'pro': 4900,   // $49.00 in cents
    'enterprise': 14900 // $149.00 in cents
  };
  
  const basePrice = tierPricing[tier] || 0;
  
  // Enterprise tier may have custom pricing based on member count
  if (tier === 'enterprise' && memberCount > 500) {
    // Add $0.10 per member over 500
    const additionalMembers = memberCount - 500;
    return basePrice + (additionalMembers * 10);
  }
  
  return basePrice;
};

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
        // Calculate health score based on activity metrics
        health_score: calculateHealthScore(org),
        // Use actual last activity from org data or default to created_at
        last_activity: org.last_activity || org.created_at,
        // Calculate revenue from subscription tier
        monthly_revenue: calculateMonthlyRevenue(org.subscription_tier, org.member_count),
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