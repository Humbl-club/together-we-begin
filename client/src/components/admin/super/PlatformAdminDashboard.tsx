import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { supabase } from '../../../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Shield,
  Users,
  Building,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Settings,
  BarChart3,
  Database,
  Zap,
  Globe
} from 'lucide-react';
import { TrialsAndGrants } from './TrialsAndGrants';
import { OrganizationsList } from './OrganizationsList';
import { PlatformAnalytics } from './PlatformAnalytics';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { FeatureFlagManager } from './FeatureFlagManager';
import { ContentModerationQueue } from './ContentModerationQueue';
import { BillingOverview } from './BillingOverview';
import { IncidentManagement } from './IncidentManagement';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  systemHealth: number;
  openIncidents: number;
  pendingModeration: number;
  storageUsed: number;
}

export const PlatformAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, platformAdmin } = useOrganization();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<PlatformStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    systemHealth: 95,
    openIncidents: 0,
    pendingModeration: 0,
    storageUsed: 0
  });
  const [loading, setLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState<{ enabled:boolean; days:number; tier:string; activeTrials:number } | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    loadPlatformStats();
  }, [isSuperAdmin, navigate]);

  const loadPlatformStats = async () => {
    try {
      setLoading(true);
      
      // Load organizations count
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      // Load users count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Load active users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', thirtyDaysAgo.toISOString());
      
      // Load revenue data
      const { data: billingData } = await supabase
        .from('platform_billing')
        .select('amount_cents')
        .eq('status', 'active');
      
      const totalRevenue = billingData?.reduce((sum, b) => sum + (b.amount_cents || 0), 0) || 0;
      
      // Load incidents
      const { count: incidentCount } = await supabase
        .from('platform_incidents')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolved');
      
      // Load moderation queue
      const { count: moderationCount } = await supabase
        .from('content_moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setStats({
        totalOrganizations: orgCount || 0,
        totalUsers: userCount || 0,
        activeUsers: activeCount || 0,
        totalRevenue: totalRevenue / 100,
        systemHealth: 95,
        openIncidents: incidentCount || 0,
        pendingModeration: moderationCount || 0,
        storageUsed: 45.2
      });

      // Load trial settings and active trial count
      const [{ data: setting }, { count: trialCount }] = await Promise.all([
        supabase.from('platform_settings').select('value').eq('key','global_trial').maybeSingle(),
        supabase.from('platform_billing').select('*', { count: 'exact', head: true }).eq('status','trialing')
      ]);
      const v = (setting?.value || {}) as any;
      setTrialInfo({ enabled: !!v.enabled, days: v.days || 0, tier: v.default_tier || 'basic', activeTrials: trialCount || 0 });
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'text-gray-600' 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <Icon className={cn("h-8 w-8", color)} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Platform Admin Dashboard
              </CardTitle>
              <CardDescription className="text-purple-100">
                Manage and monitor the entire platform
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {platformAdmin?.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Organizations"
            value={stats.totalOrganizations}
            icon={Building}
            trend="+12% this month"
            color="text-blue-600"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend="+8% this month"
            color="text-green-600"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+15% this month"
            color="text-purple-600"
          />
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            icon={Activity}
            color="text-green-600"
          />
        </div>
      )}

      {/* Alerts */}
      {stats.openIncidents > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{stats.openIncidents} active incidents</strong> require attention.
            <Button 
              variant="link" 
              className="px-1 text-orange-600"
              onClick={() => setActiveTab('incidents')}
            >
              View incidents →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {stats.pendingModeration > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{stats.pendingModeration} items</strong> pending moderation review.
            <Button 
              variant="link" 
              className="px-1 text-yellow-600"
              onClick={() => setActiveTab('moderation')}
            >
              Review queue →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            <span className="hidden lg:inline">Orgs</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden lg:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden lg:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden lg:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden lg:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="trials" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden lg:inline">Trials</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">Moderation</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden lg:inline">Incidents</span>
          </TabsTrigger>
        </TabsList>

      <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlatformAnalytics compact />
            <SystemHealthMonitor compact />
          </div>
          {trialInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Trials Summary</CardTitle>
                <CardDescription>Platform-wide trial configuration and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Trials Enabled</p>
                    <p className="text-lg font-semibold">{trialInfo.enabled ? 'On' : 'Off'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Default Trial Length</p>
                    <p className="text-lg font-semibold">{trialInfo.days} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Default Trial Tier</p>
                    <p className="text-lg font-semibold capitalize">{trialInfo.tier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Trials</p>
                    <p className="text-lg font-semibold">{trialInfo.activeTrials}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <OrganizationsList limit={5} />
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationsList />
        </TabsContent>

        <TabsContent value="analytics">
          <PlatformAnalytics />
        </TabsContent>

        <TabsContent value="billing">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="system">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="features">
          <FeatureFlagManager />
        </TabsContent>

        <TabsContent value="trials">
          <TrialsAndGrants />
        </TabsContent>

        <TabsContent value="moderation">
          <ContentModerationQueue />
        </TabsContent>

        <TabsContent value="incidents">
          <IncidentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
