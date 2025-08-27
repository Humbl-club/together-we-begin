import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  Calendar,
  Activity, 
  MessageCircle, 
  Users, 
  Gift, 
  CreditCard,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Crown,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useOrganizationFeatures } from '../../hooks/useOrganizationFeatures';
import { useMobileFirst } from '../../hooks/useMobileFirst';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  events: <Calendar className="w-5 h-5" />,
  challenges: <Activity className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  messaging: <MessageCircle className="w-5 h-5" />,
  loyalty: <Gift className="w-5 h-5" />,
  payments: <CreditCard className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-blue-100 text-blue-800',
  social: 'bg-green-100 text-green-800',
  events: 'bg-purple-100 text-purple-800',
  wellness: 'bg-orange-100 text-orange-800',
  commerce: 'bg-indigo-100 text-indigo-800',
  admin: 'bg-gray-100 text-gray-800'
};

export const FeatureManagement: React.FC = () => {
  const { isMobile } = useMobileFirst();
  const { currentOrganization, isAdmin } = useOrganization();
  const {
    features,
    catalog,
    loading,
    error,
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    canEnableFeature,
    getEnabledFeaturesByCategory
  } = useOrganizationFeatures();

  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleFeatureToggle = async (featureKey: string, enabled: boolean) => {
    if (!isAdmin) {
      setToggleError('Only admins can manage features');
      return;
    }

    setSaving(featureKey);
    setToggleError(null);
    setSuccess(null);

    try {
      if (enabled) {
        await enableFeature(featureKey);
        setSuccess(`${featureKey} feature enabled successfully!`);
      } else {
        await disableFeature(featureKey);
        setSuccess(`${featureKey} feature disabled successfully!`);
      }
    } catch (err) {
      console.error('Failed to toggle feature:', err);
      setToggleError(err instanceof Error ? err.message : `Failed to ${enabled ? 'enable' : 'disable'} feature`);
    } finally {
      setSaving(null);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'pro': return <Star className="w-4 h-4 text-blue-600" />;
      case 'basic': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  const getFeaturesByCategory = () => {
    const grouped: Record<string, typeof catalog> = {};
    
    catalog.forEach(feature => {
      if (!grouped[feature.category]) {
        grouped[feature.category] = [];
      }
      grouped[feature.category].push(feature);
    });

    return grouped;
  };

  const getEnabledCount = () => {
    return features.filter(f => f.enabled).length;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-gray-600">Only organization admins can manage features.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading feature catalog...</p>
        </CardContent>
      </Card>
    );
  }

  const featuresByCategory = getFeaturesByCategory();
  const enabledCount = getEnabledCount();
  const totalFeatures = catalog.length;

  return (
    <div className="space-y-6">
      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Feature Management
          </CardTitle>
          <CardDescription>
            Enable or disable features for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Status Alerts */}
          {toggleError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{toggleError}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-4">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Feature Summary */}
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{enabledCount}</div>
              <div className="text-sm text-blue-600">Enabled</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">{totalFeatures - enabledCount}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{totalFeatures}</div>
              <div className="text-sm text-purple-600">Total Features</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 capitalize">
                {currentOrganization?.subscription_tier || 'Free'}
              </div>
              <div className="text-sm text-green-600">Current Plan</div>
            </div>
          </div>

          {/* Current Plan Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getTierIcon(currentOrganization?.subscription_tier || 'free')}
              <div>
                <div className="font-medium capitalize">
                  {currentOrganization?.subscription_tier || 'Free'} Plan
                </div>
                <div className="text-sm text-gray-600">
                  {enabledCount} of {totalFeatures} features enabled
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentOrganization?.subscription_status || 'active'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Features by Category */}
      {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize flex items-center gap-2">
                {category} Features
                <Badge variant="outline" className={CATEGORY_COLORS[category] || 'bg-gray-100'}>
                  {categoryFeatures.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryFeatures.map((feature) => {
                const enabled = isFeatureEnabled(feature.key);
                const canEnable = canEnableFeature(feature.key);
                const isSaving = saving === feature.key;

                return (
                  <div key={feature.key} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                        {FEATURE_ICONS[feature.key] || <Settings className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{feature.name}</h4>
                          {feature.base_price > 0 && (
                            <Badge variant="outline" className="text-xs">
                              ${feature.base_price}/mo
                            </Badge>
                          )}
                          {feature.min_tier !== 'free' && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {feature.min_tier}+
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                        
                        {/* Dependencies */}
                        {feature.dependencies.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Requires: {feature.dependencies.join(', ')}
                          </div>
                        )}
                        
                        {/* Conflicts */}
                        {feature.conflicts.length > 0 && (
                          <div className="text-xs text-red-500">
                            Conflicts with: {feature.conflicts.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Label htmlFor={`feature-${feature.key}`} className="sr-only">
                        Toggle {feature.name}
                      </Label>
                      
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Switch
                          id={`feature-${feature.key}`}
                          checked={enabled}
                          onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
                          disabled={!canEnable && !enabled}
                        />
                      )}
                      
                      <div className="text-xs text-gray-500 ml-2 w-16 text-center">
                        {enabled ? (
                          <Badge variant="default" className="text-xs bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Feature Management Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Management Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
            <p className="text-sm text-gray-600">
              Features can be enabled or disabled at any time without data loss
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
            <p className="text-sm text-gray-600">
              Some features have dependencies - enable required features first
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
            <p className="text-sm text-gray-600">
              Subscription tier determines which features are available
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
            <p className="text-sm text-gray-600">
              Changes take effect immediately for all organization members
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};