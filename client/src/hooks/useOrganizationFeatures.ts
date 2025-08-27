import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useOrganization } from '../contexts/OrganizationContext';

interface OrganizationFeature {
  id: string;
  feature_key: string;
  enabled: boolean;
  configuration: Record<string, any>;
  price_override?: number;
}

interface FeatureCatalogItem {
  key: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  dependencies: string[];
  conflicts: string[];
  available: boolean;
  min_tier: string;
}

export const useOrganizationFeatures = () => {
  const { currentOrganization, isAdmin } = useOrganization();
  const [features, setFeatures] = useState<OrganizationFeature[]>([]);
  const [catalog, setCatalog] = useState<FeatureCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load organization features and catalog
  useEffect(() => {
    if (currentOrganization?.id) {
      loadFeatures();
      loadCatalog();
    }
  }, [currentOrganization?.id]);

  const loadFeatures = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('organization_features')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Failed to load organization features:', err);
      setError(err instanceof Error ? err.message : 'Failed to load features');
    }
  };

  const loadCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_catalog')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setCatalog(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load feature catalog:', err);
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
      setLoading(false);
    }
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.enabled || false;
  };

  const getFeatureConfig = (featureKey: string): Record<string, any> => {
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.configuration || {};
  };

  const enableFeature = async (featureKey: string, configuration?: Record<string, any>) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can enable features');
    }

    try {
      const { error } = await supabase
        .from('organization_features')
        .upsert({
          organization_id: currentOrganization.id,
          feature_key: featureKey,
          enabled: true,
          configuration: configuration || {},
          enabled_at: new Date().toISOString(),
          enabled_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      await loadFeatures(); // Refresh features
    } catch (err) {
      console.error('Failed to enable feature:', err);
      throw err;
    }
  };

  const disableFeature = async (featureKey: string) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can disable features');
    }

    try {
      const { error } = await supabase
        .from('organization_features')
        .update({ 
          enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', currentOrganization.id)
        .eq('feature_key', featureKey);

      if (error) throw error;
      await loadFeatures(); // Refresh features
    } catch (err) {
      console.error('Failed to disable feature:', err);
      throw err;
    }
  };

  const updateFeatureConfig = async (featureKey: string, configuration: Record<string, any>) => {
    if (!currentOrganization?.id || !isAdmin) {
      throw new Error('Only admins can update feature configuration');
    }

    try {
      const { error } = await supabase
        .from('organization_features')
        .update({ 
          configuration,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', currentOrganization.id)
        .eq('feature_key', featureKey);

      if (error) throw error;
      await loadFeatures(); // Refresh features
    } catch (err) {
      console.error('Failed to update feature configuration:', err);
      throw err;
    }
  };

  // Helper to check if organization meets feature requirements
  const canEnableFeature = (featureKey: string): boolean => {
    if (!currentOrganization) return false;

    const catalogItem = catalog.find(c => c.key === featureKey);
    if (!catalogItem) return false;

    // Check subscription tier
    const tierOrder = ['free', 'basic', 'pro', 'enterprise'];
    const currentTierIndex = tierOrder.indexOf(currentOrganization.subscription_tier || 'free');
    const requiredTierIndex = tierOrder.indexOf(catalogItem.min_tier);
    
    if (currentTierIndex < requiredTierIndex) return false;

    // Check dependencies
    for (const dependency of catalogItem.dependencies) {
      if (!isFeatureEnabled(dependency)) return false;
    }

    // Check conflicts
    for (const conflict of catalogItem.conflicts) {
      if (isFeatureEnabled(conflict)) return false;
    }

    return true;
  };

  // Get enabled features by category
  const getEnabledFeaturesByCategory = () => {
    const enabledFeatures = features.filter(f => f.enabled);
    const grouped: Record<string, { feature: OrganizationFeature; catalog: FeatureCatalogItem }[]> = {};

    enabledFeatures.forEach(feature => {
      const catalogItem = catalog.find(c => c.key === feature.feature_key);
      if (catalogItem) {
        if (!grouped[catalogItem.category]) {
          grouped[catalogItem.category] = [];
        }
        grouped[catalogItem.category].push({ feature, catalog: catalogItem });
      }
    });

    return grouped;
  };

  return {
    features,
    catalog,
    loading,
    error,
    isFeatureEnabled,
    getFeatureConfig,
    enableFeature,
    disableFeature,
    updateFeatureConfig,
    canEnableFeature,
    getEnabledFeaturesByCategory,
    refresh: loadFeatures
  };
};