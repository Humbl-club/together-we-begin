import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../components/auth/AuthProvider';

/**
 * Hook to fetch data with automatic organization filtering
 * Ensures all queries are scoped to the current organization
 */
export function useOrganizationData<T = any>(
  tableName: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    realtime?: boolean;
    requireAuth?: boolean;
    skipOrgFilter?: boolean; // For platform-level queries
  }
) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Skip if auth is required but no user
    if (options?.requireAuth && !user) {
      setLoading(false);
      return;
    }

    // Skip if organization is required but none selected
    if (!options?.skipOrgFilter && !currentOrganization) {
      setLoading(false);
      setError('No organization selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).select(options?.select || '*');

      // Add organization filter unless explicitly skipped
      if (!options?.skipOrgFilter && currentOrganization) {
        query = query.eq('organization_id', currentOrganization.id);
      }

      // Add custom filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value.operator) {
              // Support complex filters like { operator: 'gte', value: date }
              const { operator, value: filterValue } = value;
              query = (query as any)[operator](key, filterValue);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Add ordering
      if (options?.orderBy) {
        query = query.order(
          options.orderBy.column, 
          { ascending: options.orderBy.ascending ?? true }
        );
      }

      // Add limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      setData(result || []);
    } catch (err) {
      console.error(`Failed to fetch ${tableName}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tableName, currentOrganization, user, options?.select, options?.filters, options?.orderBy, options?.limit, options?.requireAuth, options?.skipOrgFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time subscription if requested
  useEffect(() => {
    if (!options?.realtime || !currentOrganization) return;

    const subscription = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: options.skipOrgFilter ? undefined : `organization_id=eq.${currentOrganization.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              (item as any).id === payload.new.id ? payload.new as T : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => 
              (item as any).id !== payload.old.id
            ));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, currentOrganization, options?.realtime, options?.skipOrgFilter]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    organizationId: currentOrganization?.id
  };
}

/**
 * Hook to call RPC functions with automatic organization context
 */
export function useOrganizationRPC<T = any>(
  functionName: string,
  params?: Record<string, any>,
  options?: {
    autoExecute?: boolean;
    skipOrgParam?: boolean;
  }
) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (overrideParams?: Record<string, any>) => {
    if (!options?.skipOrgParam && !currentOrganization) {
      setError('No organization selected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Merge organization_id into params unless skipped
      const rpcParams = {
        ...params,
        ...overrideParams,
        ...(!options?.skipOrgParam && currentOrganization ? {
          p_organization_id: currentOrganization.id,
          organization_id: currentOrganization.id // Some functions use different param names
        } : {})
      };

      const { data: result, error: rpcError } = await supabase.rpc(
        functionName, 
        rpcParams
      );

      if (rpcError) throw rpcError;
      setData(result);
      return result;
    } catch (err) {
      console.error(`RPC ${functionName} failed:`, err);
      setError(err instanceof Error ? err.message : 'RPC call failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [functionName, params, currentOrganization, options?.skipOrgParam]);

  useEffect(() => {
    if (options?.autoExecute !== false) {
      execute();
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    organizationId: currentOrganization?.id
  };
}

/**
 * Hook to manage organization-scoped storage
 */
export function useOrganizationStorage(bucketName: string) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const uploadFile = useCallback(async (
    file: File,
    path?: string
  ): Promise<{ url: string; path: string } | null> => {
    if (!currentOrganization || !user) {
      console.error('No organization or user context');
      return null;
    }

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path 
        ? `${currentOrganization.id}/${path}/${fileName}`
        : `${currentOrganization.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (err) {
      console.error('File upload failed:', err);
      return null;
    }
  }, [bucketName, currentOrganization, user]);

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    if (!currentOrganization) return false;

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('File deletion failed:', err);
      return false;
    }
  }, [bucketName, currentOrganization]);

  const listFiles = useCallback(async (path?: string) => {
    if (!currentOrganization) return [];

    try {
      const folderPath = path 
        ? `${currentOrganization.id}/${path}`
        : currentOrganization.id;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to list files:', err);
      return [];
    }
  }, [bucketName, currentOrganization]);

  return {
    uploadFile,
    deleteFile,
    listFiles,
    organizationId: currentOrganization?.id
  };
}