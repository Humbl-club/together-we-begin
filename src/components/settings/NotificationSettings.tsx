import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Calendar, Trophy, Users, Save, Clock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  event_reminders: boolean;
  challenge_updates: boolean;
  social_interactions: boolean;
  marketing_emails: boolean;
  notification_frequency: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    event_reminders: true,
    challenge_updates: true,
    social_interactions: true,
    marketing_emails: false,
    notification_frequency: 'immediate',
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          push_enabled: data.push_enabled,
          email_enabled: data.email_enabled,
          sms_enabled: data.sms_enabled,
          event_reminders: data.event_reminders,
          challenge_updates: data.challenge_updates,
          social_interactions: data.social_interactions,
          marketing_emails: data.marketing_emails,
          notification_frequency: data.notification_frequency || 'immediate',
          quiet_hours_start: data.quiet_hours_start || '22:00',
          quiet_hours_end: data.quiet_hours_end || '07:00',
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
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
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          push_enabled: settings.push_enabled,
          email_enabled: settings.email_enabled,
          sms_enabled: settings.sms_enabled,
          event_reminders: settings.event_reminders,
          challenge_updates: settings.challenge_updates,
          social_interactions: settings.social_interactions,
          marketing_emails: settings.marketing_emails,
          notification_frequency: settings.notification_frequency,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center">Loading notification settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Notification Types */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Push Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Get instant updates on your device
              </p>
            </div>
            <Switch
              checked={settings.push_enabled}
              onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={settings.email_enabled}
              onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">SMS Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Get text messages for important updates
              </p>
            </div>
            <Switch
              checked={settings.sms_enabled}
              onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Types */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>What You'll Be Notified About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Event Reminders</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Never miss upcoming events and activities
              </p>
            </div>
            <Switch
              checked={settings.event_reminders}
              onCheckedChange={(checked) => updateSetting('event_reminders', checked)}
            />
          </div>

          {/* Challenge Updates */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Challenge Updates</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Progress updates and completion celebrations
              </p>
            </div>
            <Switch
              checked={settings.challenge_updates}
              onCheckedChange={(checked) => updateSetting('challenge_updates', checked)}
            />
          </div>

          {/* Social Interactions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Social Interactions</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Likes, comments, messages, and new followers
              </p>
            </div>
            <Switch
              checked={settings.social_interactions}
              onCheckedChange={(checked) => updateSetting('social_interactions', checked)}
            />
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">Marketing Emails</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Community updates, tips, and special offers
              </p>
            </div>
            <Switch
              checked={settings.marketing_emails}
              onCheckedChange={(checked) => updateSetting('marketing_emails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Frequency & Timing */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Timing & Frequency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Frequency */}
          <div className="space-y-3">
            <Label htmlFor="notification_frequency" className="text-base font-medium">
              Notification Frequency
            </Label>
            <Select 
              value={settings.notification_frequency} 
              onValueChange={(value) => updateSetting('notification_frequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Quiet Hours</Label>
            <p className="text-sm text-muted-foreground">
              Choose when you don't want to receive notifications
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_start">Start Time</Label>
                <Select 
                  value={settings.quiet_hours_start} 
                  onValueChange={(value) => updateSetting('quiet_hours_start', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet_hours_end">End Time</Label>
                <Select 
                  value={settings.quiet_hours_end} 
                  onValueChange={(value) => updateSetting('quiet_hours_end', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
    </div>
  );
};