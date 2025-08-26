import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Eye, MessageSquare, Share2, Lock, Save } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettings {
  profile_visibility: string;
  allow_messages: string;
  allow_friend_requests: boolean;
  allow_location_sharing: boolean;
  show_activity_status: boolean;
}

export const PrivacySettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    allow_messages: 'everyone',
    allow_friend_requests: true,
    allow_location_sharing: false,
    show_activity_status: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility,
          allow_messages: data.allow_messages,
          allow_friend_requests: data.allow_friend_requests,
          allow_location_sharing: data.allow_location_sharing,
          show_activity_status: data.show_activity_status,
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your privacy settings have been updated",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center">Loading privacy settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Visibility */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="profile_visibility" className="text-sm font-medium">
                Profile Visibility
              </Label>
            </div>
            <Select 
              value={settings.profile_visibility} 
              onValueChange={(value) => updateSetting('profile_visibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Everyone can see your profile</SelectItem>
                <SelectItem value="friends">Friends Only - Only friends can view</SelectItem>
                <SelectItem value="private">Private - Only you can see your profile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Preferences */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="allow_messages" className="text-sm font-medium">
                Who Can Message You
              </Label>
            </div>
            <Select 
              value={settings.allow_messages} 
              onValueChange={(value) => updateSetting('allow_messages', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="none">No One</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Friend Requests */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Allow Friend Requests</Label>
              <p className="text-xs text-muted-foreground">
                Let other users send you friend requests
              </p>
            </div>
            <Switch
              checked={settings.allow_friend_requests}
              onCheckedChange={(checked) => updateSetting('allow_friend_requests', checked)}
            />
          </div>

          {/* Location Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Location Sharing</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Share your location with other members during events
              </p>
            </div>
            <Switch
              checked={settings.allow_location_sharing}
              onCheckedChange={(checked) => updateSetting('allow_location_sharing', checked)}
            />
          </div>

          {/* Activity Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Show Activity Status</Label>
              <p className="text-sm text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
            <Switch
              checked={settings.show_activity_status}
              onCheckedChange={(checked) => updateSetting('show_activity_status', checked)}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border border-muted">
            <h4 className="font-medium mb-2">Data Encryption</h4>
            <p className="text-sm text-muted-foreground mb-3">
              All your personal data and messages are encrypted for maximum security.
            </p>
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Lock className="w-4 h-4" />
              <span>End-to-end encryption enabled</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-muted">
            <h4 className="font-medium mb-2">Data Export</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Request a copy of all your data stored in our systems.
            </p>
            <Button variant="outline" size="sm">
              Request Data Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};