import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';

// Helper functions for organization-scoped queries
export class OrganizationSupabaseHelper {
  
  /**
   * Get the user's current organization ID from context or profile
   */
  static async getCurrentOrgId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // First try to get from profile's current_organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.current_organization_id) {
        return profile.current_organization_id;
      }

      // Fallback to first organization membership
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      return membership?.organization_id || null;
    } catch (error) {
      console.error('Failed to get current org ID:', error);
      return null;
    }
  }

  /**
   * Create a query builder that automatically filters by organization
   */
  static createOrgQuery<T extends keyof Database['public']['Tables']>(
    table: T,
    orgId?: string
  ) {
    const query = supabase.from(table);
    
    if (orgId) {
      // Cast to any to handle the generic type complexity
      return (query as any).eq('organization_id', orgId);
    }
    
    return query;
  }

  /**
   * Execute a query with automatic organization filtering
   */
  static async queryWithOrg<T extends keyof Database['public']['Tables']>(
    table: T,
    orgId?: string | null
  ) {
    const currentOrgId = orgId || await this.getCurrentOrgId();
    if (!currentOrgId) {
      throw new Error('No organization context available');
    }

    return this.createOrgQuery(table, currentOrgId);
  }

  /**
   * Insert data with organization ID automatically added
   */
  static async insertWithOrg<T extends keyof Database['public']['Tables']>(
    table: T,
    data: any,
    orgId?: string | null
  ) {
    const currentOrgId = orgId || await this.getCurrentOrgId();
    if (!currentOrgId) {
      throw new Error('No organization context available');
    }

    const dataWithOrg = {
      ...data,
      organization_id: currentOrgId
    };

    return supabase.from(table).insert(dataWithOrg);
  }

  /**
   * Update data with organization validation
   */
  static async updateWithOrg<T extends keyof Database['public']['Tables']>(
    table: T,
    data: any,
    match: Record<string, any>,
    orgId?: string | null
  ) {
    const currentOrgId = orgId || await this.getCurrentOrgId();
    if (!currentOrgId) {
      throw new Error('No organization context available');
    }

    const matchWithOrg = {
      ...match,
      organization_id: currentOrgId
    };

    return supabase.from(table).update(data).match(matchWithOrg);
  }

  /**
   * Delete data with organization validation
   */
  static async deleteWithOrg<T extends keyof Database['public']['Tables']>(
    table: T,
    match: Record<string, any>,
    orgId?: string | null
  ) {
    const currentOrgId = orgId || await this.getCurrentOrgId();
    if (!currentOrgId) {
      throw new Error('No organization context available');
    }

    const matchWithOrg = {
      ...match,
      organization_id: currentOrgId
    };

    return supabase.from(table).delete().match(matchWithOrg);
  }

  /**
   * Check if user has permission to access organization data
   */
  static async validateOrgAccess(orgId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      return !!membership;
    } catch {
      return false;
    }
  }

  /**
   * Get user's role in specific organization
   */
  static async getUserRole(orgId: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      return membership?.role || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is admin in organization
   */
  static async isOrgAdmin(orgId?: string | null): Promise<boolean> {
    const currentOrgId = orgId || await this.getCurrentOrgId();
    if (!currentOrgId) return false;

    const role = await this.getUserRole(currentOrgId);
    return role === 'owner' || role === 'admin';
  }

  /**
   * Get organization theme settings
   */
  static async getOrgTheme(orgId?: string | null) {
    const currentOrgId = orgId || await this.getCurrentOrgId();
    if (!currentOrgId) return null;

    const { data, error } = await supabase.rpc('get_organization_theme', {
      p_org_id: currentOrgId
    });

    if (error) {
      console.error('Failed to get organization theme:', error);
      return null;
    }

    return data;
  }

  /**
   * Get organization signup page configuration
   */
  static async getOrgSignupPage(slug: string) {
    const { data, error } = await supabase.rpc('get_organization_by_slug', {
      p_slug: slug
    });

    if (error) {
      console.error('Failed to get organization signup page:', error);
      return null;
    }

    return data?.[0] || null;
  }
}

// Convenience exports
export const orgSupabase = OrganizationSupabaseHelper;