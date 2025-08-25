import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Activity, Calendar, Share, Smartphone, Watch } from 'lucide-react';

interface IntegrationSettings {
  fitness_tracker_type?: string;
  fitness_tracker_token?: string;
  social_media_crosspost: boolean;
  calendar_sync: boolean;
}

export const IntegrationSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<IntegrationSettings>({
    social_media_crosspost: false,
    calendar_sync: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          fitness_tracker_type: data.fitness_tracker_type || undefined,
          fitness_tracker_token: data.fitness_tracker_token || undefined,
          social_media_crosspost: data.social_media_crosspost || false,
          calendar_sync: data.calendar_sync || false
        });
      }
    } catch (error) {
      console.error('Failed to fetch integration settings:', error);
      toast({
        title: "Error",
        description: "Failed to load integration settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<IntegrationSettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings
        });

      if (error) throw error;

      setSettings(updatedSettings);
      toast({
        title: "Settings Saved",
        description: "Your integration settings have been updated"
      });
    } catch (error) {
      console.error('Failed to save integration settings:', error);
      toast({
        title: "Error",
        description: "Failed to save integration settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const connectFitnessTracker = async (type: string) => {
    // In a real app, this would redirect to OAuth flow
    toast({
      title: "Coming Soon",
      description: `${type} integration will be available soon!`
    });
  };

  const connectCalendar = async () => {
    // In a real app, this would connect to Google Calendar/Outlook
    await saveSettings({ calendar_sync: !settings.calendar_sync });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your favorite apps and services to enhance your experience
        </p>
      </div>

      <div className="grid gap-4">
        {/* Fitness Trackers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Fitness Trackers
            </CardTitle>
            <CardDescription>
              Sync your fitness data to track wellness challenges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Select your fitness tracker</Label>
              <Select 
                value={settings.fitness_tracker_type || "none"} 
                onValueChange={(value) => {
                  if (value === "none") {
                    saveSettings({ fitness_tracker_type: undefined, fitness_tracker_token: undefined });
                  } else {
                    connectFitnessTracker(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a fitness tracker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fitbit">
                    <div className="flex items-center gap-2">
                      <Watch className="h-4 w-4" />
                      Fitbit
                    </div>
                  </SelectItem>
                  <SelectItem value="apple_health">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Apple Health
                    </div>
                  </SelectItem>
                  <SelectItem value="google_fit">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Google Fit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {settings.fitness_tracker_type && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Connected</Badge>
                  <span className="text-sm text-muted-foreground">
                    {settings.fitness_tracker_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Sync
            </CardTitle>
            <CardDescription>
              Automatically add event registrations to your calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable calendar synchronization</Label>
                <p className="text-sm text-muted-foreground">
                  Events you register for will be added to your calendar
                </p>
              </div>
              <Switch
                checked={settings.calendar_sync}
                onCheckedChange={connectCalendar}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media Crosspost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Social Media
            </CardTitle>
            <CardDescription>
              Share your achievements on external social platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable cross-posting</Label>
                <p className="text-sm text-muted-foreground">
                  Share your challenge completions and milestones
                </p>
              </div>
              <Switch
                checked={settings.social_media_crosspost}
                onCheckedChange={(checked) => saveSettings({ social_media_crosspost: checked })}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            For developers who want to build integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Generate API Key (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};