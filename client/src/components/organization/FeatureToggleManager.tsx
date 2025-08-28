import React, { useState, useMemo } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from '../ui/use-toast';
import { 
  Zap, 
  Search, 
  Shield, 
  Calendar, 
  MessageSquare,
  Trophy,
  Gift,
  Users,
  BarChart,
  Settings,
  AlertCircle,
  Check,
  X,
  DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';

const CATEGORY_ICONS: Record<string, any> = {
  core: Shield,
  social: MessageSquare,
  events: Calendar,
  wellness: Trophy,
  commerce: Gift,
  admin: Settings,
  analytics: BarChart
};

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  basic: 'bg-blue-100 text-blue-800',
  pro: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
};

export const FeatureToggleManager: React.FC = () => {
  const {
    currentOrganization,
    organizationFeatures,
    featureCatalog,
    isFeatureEnabled,
    toggleFeature,
    isAdmin
  } = useOrganization();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Group features by category
  const featuresByCategory = useMemo(() => {
    const grouped = featureCatalog.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<string, typeof featureCatalog>);
    
    return grouped;
  }, [featureCatalog]);

  // Filter features based on search and category
  const filteredFeatures = useMemo(() => {
    let features = featureCatalog;
    
    if (selectedCategory !== 'all') {
      features = features.filter(f => f.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      features = features.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query)
      );
    }
    
    return features;
  }, [featureCatalog, selectedCategory, searchQuery]);

  // Calculate feature usage stats
  const featureStats = useMemo(() => {
    const total = featureCatalog.length;
    const enabled = organizationFeatures.filter(f => f.enabled).length;
    const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0;
    
    const byCategory = Object.entries(featuresByCategory).map(([category, features]) => {
      const categoryEnabled = features.filter(f => 
        isFeatureEnabled(f.key)
      ).length;
      return {
        category,
        total: features.length,
        enabled: categoryEnabled,
        percentage: features.length > 0 ? Math.round((categoryEnabled / features.length) * 100) : 0
      };
    });
    
    return { total, enabled, percentage, byCategory };
  }, [featureCatalog, organizationFeatures, featuresByCategory, isFeatureEnabled]);

  const handleToggle = async (featureKey: string, currentlyEnabled: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can toggle features.",
        variant: "destructive"
      });
      return;
    }

    const feature = featureCatalog.find(f => f.key === featureKey);
    if (!feature) return;

    // Check tier requirements
    if (!currentlyEnabled && currentOrganization) {
      const tierOrder = ['free', 'basic', 'pro', 'enterprise'];
      const requiredTierIndex = tierOrder.indexOf(feature.min_tier);
      const currentTierIndex = tierOrder.indexOf(currentOrganization.subscription_tier);
      
      if (currentTierIndex < requiredTierIndex) {
        toast({
          title: "Upgrade Required",
          description: `This feature requires ${feature.min_tier} tier or higher. Current tier: ${currentOrganization.subscription_tier}`,
          variant: "destructive"
        });
        return;
      }
    }

    // Check dependencies
    if (!currentlyEnabled && feature.dependencies.length > 0) {
      const missingDeps = feature.dependencies.filter(dep => !isFeatureEnabled(dep));
      if (missingDeps.length > 0) {
        toast({
          title: "Missing Dependencies",
          description: `Enable these features first: ${missingDeps.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    // Check conflicts
    if (!currentlyEnabled && feature.conflicts.length > 0) {
      const activeConflicts = feature.conflicts.filter(conf => isFeatureEnabled(conf));
      if (activeConflicts.length > 0) {
        toast({
          title: "Feature Conflict",
          description: `Disable these conflicting features first: ${activeConflicts.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsUpdating(featureKey);
    try {
      await toggleFeature(featureKey, !currentlyEnabled);
      toast({
        title: currentlyEnabled ? "Feature Disabled" : "Feature Enabled",
        description: `${feature.name} has been ${currentlyEnabled ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update feature settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const canEnableFeature = (feature: typeof featureCatalog[0]): { canEnable: boolean; reason?: string } => {
    if (!currentOrganization) {
      return { canEnable: false, reason: "No organization selected" };
    }

    // Check tier
    const tierOrder = ['free', 'basic', 'pro', 'enterprise'];
    const requiredTierIndex = tierOrder.indexOf(feature.min_tier);
    const currentTierIndex = tierOrder.indexOf(currentOrganization.subscription_tier);
    
    if (currentTierIndex < requiredTierIndex) {
      return { canEnable: false, reason: `Requires ${feature.min_tier} tier` };
    }

    // Check dependencies
    if (feature.dependencies.length > 0) {
      const missingDeps = feature.dependencies.filter(dep => !isFeatureEnabled(dep));
      if (missingDeps.length > 0) {
        return { canEnable: false, reason: `Missing: ${missingDeps.join(', ')}` };
      }
    }

    // Check conflicts
    if (feature.conflicts.length > 0) {
      const activeConflicts = feature.conflicts.filter(conf => isFeatureEnabled(conf));
      if (activeConflicts.length > 0) {
        return { canEnable: false, reason: `Conflicts with: ${activeConflicts.join(', ')}` };
      }
    }

    return { canEnable: true };
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">You need administrator permissions to manage features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Feature Management
              </CardTitle>
              <CardDescription>
                Enable or disable features for your organization
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {featureStats.enabled} / {featureStats.total} Features Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featureStats.byCategory.map(stat => {
              const Icon = CATEGORY_ICONS[stat.category] || Zap;
              return (
                <div key={stat.category} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium capitalize">{stat.category}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-2xl font-bold">{stat.enabled}</span>
                    <span className="text-sm text-gray-500">/ {stat.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tier Alert */}
      {currentOrganization && currentOrganization.subscription_tier !== 'enterprise' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your current plan is <strong className="capitalize">{currentOrganization.subscription_tier}</strong>. 
            Some features may require an upgrade. 
            <Button variant="link" className="px-1" onClick={() => window.location.href = '/admin/organization/billing'}>
              View upgrade options →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-4 md:flex">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="core">Core</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="wellness">Wellness</TabsTrigger>
                <TabsTrigger value="commerce">Commerce</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {/* Feature List */}
      <div className="grid gap-4">
        {filteredFeatures.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No features found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredFeatures.map(feature => {
            const isEnabled = isFeatureEnabled(feature.key);
            const { canEnable, reason } = canEnableFeature(feature);
            const Icon = CATEGORY_ICONS[feature.category] || Zap;
            const isLoading = isUpdating === feature.key;
            
            return (
              <Card 
                key={feature.key}
                className={cn(
                  "transition-all",
                  isEnabled && "border-primary/50 bg-primary/5"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isEnabled ? "bg-primary/10" : "bg-gray-100"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isEnabled ? "text-primary" : "text-gray-500"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{feature.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", TIER_COLORS[feature.min_tier])}
                          >
                            {feature.min_tier}
                          </Badge>
                          {feature.base_price > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-3 w-3" />
                              {feature.base_price}/mo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {feature.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {feature.dependencies.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>Requires:</span>
                              {feature.dependencies.map(dep => (
                                <Badge 
                                  key={dep} 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    isFeatureEnabled(dep) ? "text-green-600" : "text-gray-400"
                                  )}
                                >
                                  {isFeatureEnabled(dep) ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {feature.conflicts.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>Conflicts:</span>
                              {feature.conflicts.map(conf => (
                                <Badge 
                                  key={conf} 
                                  variant="outline" 
                                  className="text-xs text-orange-600"
                                >
                                  {conf}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {!isEnabled && !canEnable && reason && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {reason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEnabled && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(feature.key, isEnabled)}
                        disabled={isLoading || (!isEnabled && !canEnable)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};