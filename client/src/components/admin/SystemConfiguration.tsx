import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  Save,
  RefreshCw,
  Shield,
  Globe,
  Bell,
  Users,
  Trophy,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

const SystemConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configForm, setConfigForm] = useState<Record<string, any>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('key');

      if (error) throw error;

      setConfigs(data || []);
      
      // Initialize form with current values
      const formData: Record<string, any> = {};
      (data || []).forEach(config => {
        formData[config.key] = config.value;
      });
      setConfigForm(formData);

    } catch (error) {
      console.error('Error loading system config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (key: string, value: any, description?: string) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value,
          description: description || '',
          updated_by: user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${key} updated successfully`,
      });

      loadSystemConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const updates = Object.entries(configForm).map(([key, value]) => ({
        key,
        value,
        description: configs.find(c => c.key === key)?.description || '',
        updated_by: user?.id
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('system_config')
          .upsert(update);
        
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'All configurations saved successfully',
      });

      loadSystemConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configurations',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfigForm = (key: string, value: any) => {
    setConfigForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const initializeDefaultConfigs = async () => {
    const defaultConfigs = [
      {
        key: 'app_name',
        value: 'Women\'s Community App',
        description: 'Application name displayed to users'
      },
      {
        key: 'app_description',
        value: 'A safe, empowering space for women to connect, share, and grow together',
        description: 'Application description for onboarding and marketing'
      },
      {
        key: 'max_file_size_mb',
        value: 10,
        description: 'Maximum file upload size in megabytes'
      },
      {
        key: 'maintenance_mode',
        value: false,
        description: 'Enable maintenance mode to prevent user access'
      },
      {
        key: 'registration_enabled',
        value: true,
        description: 'Allow new user registrations'
      },
      {
        key: 'invite_only_mode',
        value: false,
        description: 'Require invite codes for new registrations'
      },
      {
        key: 'max_posts_per_day',
        value: 10,
        description: 'Maximum posts a user can create per day'
      },
      {
        key: 'auto_approve_posts',
        value: true,
        description: 'Automatically approve new posts without moderation'
      },
      {
        key: 'email_notifications_enabled',
        value: true,
        description: 'Enable email notifications for the system'
      },
      {
        key: 'push_notifications_enabled',
        value: true,
        description: 'Enable push notifications for the system'
      },
      {
        key: 'event_creation_admin_only',
        value: false,
        description: 'Only allow admins to create events'
      },
      {
        key: 'challenge_creation_admin_only',
        value: true,
        description: 'Only allow admins to create challenges'
      },
      {
        key: 'default_loyalty_points_signup',
        value: 100,
        description: 'Default loyalty points awarded on signup'
      },
      {
        key: 'community_guidelines',
        value: 'Be respectful, supportive, and kind. This is a safe space for all women.',
        description: 'Community guidelines displayed to users'
      }
    ];

    for (const config of defaultConfigs) {
      await saveConfig(config.key, config.value, config.description);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">Manage application settings and preferences</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadSystemConfig}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {configs.length === 0 && (
            <Button onClick={initializeDefaultConfigs} className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Initialize Defaults
            </Button>
          )}
          
          <Button onClick={handleSaveAll} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save All
          </Button>
        </div>
      </div>

      {configs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Configuration Found</h3>
            <p className="text-muted-foreground mb-4">
              Initialize default system configurations to get started.
            </p>
            <Button onClick={initializeDefaultConfigs}>
              Initialize Default Configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="app_name">Application Name</Label>
                    <Input
                      id="app_name"
                      value={configForm.app_name || ''}
                      onChange={(e) => updateConfigForm('app_name', e.target.value)}
                      placeholder="App name..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                    <Input
                      id="max_file_size"
                      type="number"
                      value={configForm.max_file_size_mb || ''}
                      onChange={(e) => updateConfigForm('max_file_size_mb', parseInt(e.target.value))}
                      placeholder="10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="app_description">Application Description</Label>
                  <Textarea
                    id="app_description"
                    value={configForm.app_description || ''}
                    onChange={(e) => updateConfigForm('app_description', e.target.value)}
                    placeholder="App description..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent user access during maintenance
                    </p>
                  </div>
                  <Switch
                    checked={configForm.maintenance_mode || false}
                    onCheckedChange={(checked) => updateConfigForm('maintenance_mode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Registration Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register
                    </p>
                  </div>
                  <Switch
                    checked={configForm.registration_enabled !== false}
                    onCheckedChange={(checked) => updateConfigForm('registration_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Invite Only Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Require invite codes for registration
                    </p>
                  </div>
                  <Switch
                    checked={configForm.invite_only_mode || false}
                    onCheckedChange={(checked) => updateConfigForm('invite_only_mode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Feature Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Admin Only Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Only allow admins to create events
                    </p>
                  </div>
                  <Switch
                    checked={configForm.event_creation_admin_only || false}
                    onCheckedChange={(checked) => updateConfigForm('event_creation_admin_only', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Admin Only Challenges</Label>
                    <p className="text-sm text-muted-foreground">
                      Only allow admins to create challenges
                    </p>
                  </div>
                  <Switch
                    checked={configForm.challenge_creation_admin_only !== false}
                    onCheckedChange={(checked) => updateConfigForm('challenge_creation_admin_only', checked)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_posts">Max Posts Per Day</Label>
                    <Input
                      id="max_posts"
                      type="number"
                      value={configForm.max_posts_per_day || ''}
                      onChange={(e) => updateConfigForm('max_posts_per_day', parseInt(e.target.value))}
                      placeholder="10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signup_points">Signup Loyalty Points</Label>
                    <Input
                      id="signup_points"
                      type="number"
                      value={configForm.default_loyalty_points_signup || ''}
                      onChange={(e) => updateConfigForm('default_loyalty_points_signup', parseInt(e.target.value))}
                      placeholder="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system email notifications
                    </p>
                  </div>
                  <Switch
                    checked={configForm.email_notifications_enabled !== false}
                    onCheckedChange={(checked) => updateConfigForm('email_notifications_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system push notifications
                    </p>
                  </div>
                  <Switch
                    checked={configForm.push_notifications_enabled !== false}
                    onCheckedChange={(checked) => updateConfigForm('push_notifications_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Content Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Approve Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve new posts without moderation
                    </p>
                  </div>
                  <Switch
                    checked={configForm.auto_approve_posts !== false}
                    onCheckedChange={(checked) => updateConfigForm('auto_approve_posts', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="guidelines">Community Guidelines</Label>
                  <Textarea
                    id="guidelines"
                    value={configForm.community_guidelines || ''}
                    onChange={(e) => updateConfigForm('community_guidelines', e.target.value)}
                    placeholder="Community guidelines..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SystemConfiguration;