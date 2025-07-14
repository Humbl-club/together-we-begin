import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Heart, 
  Calendar,
  MessageSquare,
  Eye,
  Lock,
  Smartphone,
  Moon,
  Sun,
  Globe,
  Activity,
  Target,
  Users,
  MapPin,
  Camera,
  Zap,
  Star,
  Crown,
  Coffee
} from 'lucide-react';

interface UserSettings {
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    events: boolean;
    challenges: boolean;
    messages: boolean;
    social: boolean;
    wellness_reminders: boolean;
    weekly_digest: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'members' | 'private';
    show_activity_status: boolean;
    allow_messages: 'everyone' | 'members' | 'friends';
    allow_friend_requests: boolean;
    show_location: boolean;
    show_fitness_data: boolean;
  };
  wellness: {
    activity_goal: number;
    reminder_frequency: 'none' | 'daily' | 'weekly';
    preferred_workout_time: string;
    health_data_sharing: boolean;
    challenge_difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  social: {
    auto_follow_event_attendees: boolean;
    share_achievements: boolean;
    allow_story_mentions: boolean;
    comment_moderation: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    compact_mode: boolean;
    glassmorphism_effects: boolean;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    push_enabled: true,
    email_enabled: true,
    events: true,
    challenges: true,
    messages: true,
    social: true,
    wellness_reminders: true,
    weekly_digest: true,
  },
  privacy: {
    profile_visibility: 'members',
    show_activity_status: true,
    allow_messages: 'everyone',
    allow_friend_requests: true,
    show_location: false,
    show_fitness_data: false,
  },
  wellness: {
    activity_goal: 10000,
    reminder_frequency: 'daily',
    preferred_workout_time: '09:00',
    health_data_sharing: false,
    challenge_difficulty: 'intermediate',
  },
  social: {
    auto_follow_event_attendees: false,
    share_achievements: true,
    allow_story_mentions: true,
    comment_moderation: false,
  },
  appearance: {
    theme: 'system',
    language: 'en',
    compact_mode: false,
    glassmorphism_effects: true,
  },
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      // Load from multiple tables based on the schema
      const [privacyResponse, notificationResponse] = await Promise.all([
        supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      // Merge with defaults and existing data
      const loadedSettings = { ...defaultSettings };
      
      if (privacyResponse.data) {
        loadedSettings.privacy = {
          ...loadedSettings.privacy,
          profile_visibility: privacyResponse.data.profile_visibility as any,
          show_activity_status: privacyResponse.data.show_activity_status,
          allow_messages: privacyResponse.data.allow_messages as any,
          allow_friend_requests: privacyResponse.data.allow_friend_requests,
          show_location: privacyResponse.data.allow_location_sharing,
          show_fitness_data: false, // Custom field
        };
      }

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Some settings may not be displayed correctly.",
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
      // Update privacy settings
      await supabase
        .from('privacy_settings')
        .upsert({
          user_id: user.id,
          profile_visibility: settings.privacy.profile_visibility,
          show_activity_status: settings.privacy.show_activity_status,
          allow_messages: settings.privacy.allow_messages,
          allow_friend_requests: settings.privacy.allow_friend_requests,
          allow_location_sharing: settings.privacy.show_location,
        });

      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-card-enhanced p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded-lg w-48 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mobile:p-4 sm:p-6 lg:p-8 safe-area-top safe-area-bottom spacing-responsive-lg animate-fade-in">
      {/* Header */}
      <div className="glass-card-enhanced mobile:p-6 sm:p-8 spacing-responsive-md settings-header">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mobile:text-center sm:text-left">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm mobile:mx-auto sm:mx-0 animate-glow">
            <SettingsIcon className="mobile:w-6 mobile:h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display mobile:text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Settings
            </h1>
            <p className="text-muted-foreground mobile:text-base sm:text-lg break-words text-balance mt-2">
              Customize your HUMBL experience with precision
            </p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="spacing-responsive-lg stagger-children">
        <div className="premium-tabs mobile:p-1 sm:p-2">
          <TabsList className="grid mobile:grid-cols-3 sm:grid-cols-5 w-full bg-transparent mobile:gap-1 sm:gap-2 mobile:h-auto sm:h-12">
            <TabsTrigger 
              value="notifications" 
              className="premium-tab flex items-center gap-2 mobile:flex-col mobile:gap-1 sm:flex-row sm:gap-2 mobile:min-h-[60px] sm:min-h-[44px] mobile:p-2 sm:p-3 transition-all duration-300 touch-manipulation focus-ring"
            >
              <Bell className="mobile:w-4 mobile:h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="mobile:text-xs mobile:font-medium sm:text-sm mobile:block sm:hidden lg:block">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="premium-tab flex items-center gap-2 mobile:flex-col mobile:gap-1 sm:flex-row sm:gap-2 mobile:min-h-[60px] sm:min-h-[44px] mobile:p-2 sm:p-3 transition-all duration-300 touch-manipulation focus-ring"
            >
              <Shield className="mobile:w-4 mobile:h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="mobile:text-xs mobile:font-medium sm:text-sm mobile:block sm:hidden lg:block">Privacy</span>
            </TabsTrigger>
            <TabsTrigger 
              value="wellness" 
              className="premium-tab flex items-center gap-2 mobile:flex-col mobile:gap-1 sm:flex-row sm:gap-2 mobile:min-h-[60px] sm:min-h-[44px] mobile:p-2 sm:p-3 transition-all duration-300 touch-manipulation focus-ring"
            >
              <Heart className="mobile:w-4 mobile:h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="mobile:text-xs mobile:font-medium sm:text-sm mobile:block sm:hidden lg:block">Wellness</span>
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="premium-tab flex items-center gap-2 mobile:flex-col mobile:gap-1 sm:flex-row sm:gap-2 mobile:min-h-[60px] sm:min-h-[44px] mobile:p-2 sm:p-3 transition-all duration-300 touch-manipulation mobile:col-span-1 sm:col-span-1 focus-ring"
            >
              <Users className="mobile:w-4 mobile:h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="mobile:text-xs mobile:font-medium sm:text-sm mobile:block sm:hidden lg:block">Social</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="premium-tab flex items-center gap-2 mobile:flex-col mobile:gap-1 sm:flex-row sm:gap-2 mobile:min-h-[60px] sm:min-h-[44px] mobile:p-2 sm:p-3 transition-all duration-300 touch-manipulation mobile:col-span-2 sm:col-span-1 focus-ring"
            >
              <Eye className="mobile:w-4 mobile:h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="mobile:text-xs mobile:font-medium sm:text-sm mobile:block sm:hidden lg:block">Appearance</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="spacing-responsive-lg">
          <Card className="glass-card-enhanced">
            <CardHeader className="mobile:pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-3 mobile:text-lg sm:text-xl lg:text-2xl">
                <Bell className="mobile:w-5 mobile:h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="break-words">Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="spacing-responsive-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="spacing-responsive-md">
                  <h3 className="font-semibold mobile:text-base sm:text-lg text-primary">Push Notifications</h3>
                  
                  <div className="glass-input flex items-center justify-between mobile:p-3 sm:p-4 rounded-lg touch-manipulation">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Smartphone className="mobile:w-4 mobile:h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="mobile:text-sm sm:text-base font-medium cursor-pointer">Enable Push Notifications</Label>
                        <p className="mobile:text-xs sm:text-sm text-muted-foreground mt-1 break-words">Get notifications on your device</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.push_enabled}
                      onCheckedChange={(checked) => updateSetting('notifications', 'push_enabled', checked)}
                      className="ml-4 flex-shrink-0"
                    />
                  </div>

                  <div className="settings-item flex items-center justify-between touch-manipulation">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Calendar className="mobile:w-4 mobile:h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="mobile:text-sm sm:text-base font-medium cursor-pointer">Event Notifications</Label>
                        <p className="mobile:text-xs sm:text-sm text-muted-foreground mt-1 break-words">New events and reminders</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.events}
                      onCheckedChange={(checked) => updateSetting('notifications', 'events', checked)}
                      className="settings-switch ml-4"
                    />
                  </div>

                  <div className="settings-item flex items-center justify-between touch-manipulation">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Target className="mobile:w-4 mobile:h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="mobile:text-sm sm:text-base font-medium cursor-pointer">Challenge Notifications</Label>
                        <p className="mobile:text-xs sm:text-sm text-muted-foreground mt-1 break-words">Challenge updates and achievements</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.challenges}
                      onCheckedChange={(checked) => updateSetting('notifications', 'challenges', checked)}
                      className="settings-switch ml-4"
                    />
                  </div>

                  <div className="settings-item flex items-center justify-between touch-manipulation">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <MessageSquare className="mobile:w-4 mobile:h-4 sm:w-5 sm:h-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Label className="mobile:text-sm sm:text-base font-medium cursor-pointer">Message Notifications</Label>
                        <p className="mobile:text-xs sm:text-sm text-muted-foreground mt-1 break-words">Direct messages and replies</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.messages}
                      onCheckedChange={(checked) => updateSetting('notifications', 'messages', checked)}
                      className="settings-switch ml-4"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Email Notifications</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Social Activity</Label>
                        <p className="text-sm text-muted-foreground">Likes, comments, and mentions</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.social}
                      onCheckedChange={(checked) => updateSetting('notifications', 'social', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Wellness Reminders</Label>
                        <p className="text-sm text-muted-foreground">Daily wellness check-ins</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.wellness_reminders}
                      onCheckedChange={(checked) => updateSetting('notifications', 'wellness_reminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Coffee className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">Weekly summary of your activity</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.weekly_digest}
                      onCheckedChange={(checked) => updateSetting('notifications', 'weekly_digest', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Profile Visibility</h3>
                  
                  <div className="space-y-3">
                    <Label>Who can see your profile?</Label>
                    <Select
                      value={settings.privacy.profile_visibility}
                      onValueChange={(value: any) => updateSetting('privacy', 'profile_visibility', value)}
                    >
                      <SelectTrigger className="bg-muted/30 backdrop-blur-sm border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Everyone
                          </div>
                        </SelectItem>
                        <SelectItem value="members">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Members Only
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Who can message you?</Label>
                    <Select
                      value={settings.privacy.allow_messages}
                      onValueChange={(value: any) => updateSetting('privacy', 'allow_messages', value)}
                    >
                      <SelectTrigger className="bg-muted/30 backdrop-blur-sm border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Activity Sharing</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Show Activity Status</Label>
                        <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.show_activity_status}
                      onCheckedChange={(checked) => updateSetting('privacy', 'show_activity_status', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Share Location</Label>
                        <p className="text-sm text-muted-foreground">Share your location in posts</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.show_location}
                      onCheckedChange={(checked) => updateSetting('privacy', 'show_location', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Share Fitness Data</Label>
                        <p className="text-sm text-muted-foreground">Include fitness data in challenges</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.show_fitness_data}
                      onCheckedChange={(checked) => updateSetting('privacy', 'show_fitness_data', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wellness Settings */}
        <TabsContent value="wellness" className="space-y-6">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" />
                Wellness Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Daily Activity Goal (steps)</Label>
                    <Input
                      type="number"
                      value={settings.wellness.activity_goal}
                      onChange={(e) => updateSetting('wellness', 'activity_goal', parseInt(e.target.value))}
                      className="bg-muted/30 backdrop-blur-sm border-border/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Preferred Workout Time</Label>
                    <Input
                      type="time"
                      value={settings.wellness.preferred_workout_time}
                      onChange={(e) => updateSetting('wellness', 'preferred_workout_time', e.target.value)}
                      className="bg-muted/30 backdrop-blur-sm border-border/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Challenge Difficulty</Label>
                    <Select
                      value={settings.wellness.challenge_difficulty}
                      onValueChange={(value: any) => updateSetting('wellness', 'challenge_difficulty', value)}
                    >
                      <SelectTrigger className="bg-muted/30 backdrop-blur-sm border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="beginner">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Beginner
                          </div>
                        </SelectItem>
                        <SelectItem value="intermediate">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            <Star className="w-4 h-4" />
                            Intermediate
                          </div>
                        </SelectItem>
                        <SelectItem value="advanced">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4" />
                            Advanced
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Reminder Frequency</Label>
                    <Select
                      value={settings.wellness.reminder_frequency}
                      onValueChange={(value: any) => updateSetting('wellness', 'reminder_frequency', value)}
                    >
                      <SelectTrigger className="bg-muted/30 backdrop-blur-sm border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="none">No reminders</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Health Data Sharing</Label>
                        <p className="text-sm text-muted-foreground">Share anonymized data for research</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.wellness.health_data_sharing}
                      onCheckedChange={(checked) => updateSetting('wellness', 'health_data_sharing', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Settings */}
        <TabsContent value="social" className="space-y-6">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                Social Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Connections</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Auto-follow Event Attendees</Label>
                        <p className="text-sm text-muted-foreground">Automatically connect with event participants</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.social.auto_follow_event_attendees}
                      onCheckedChange={(checked) => updateSetting('social', 'auto_follow_event_attendees', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Share Achievements</Label>
                        <p className="text-sm text-muted-foreground">Automatically post when you earn badges</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.social.share_achievements}
                      onCheckedChange={(checked) => updateSetting('social', 'share_achievements', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Content</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Allow Story Mentions</Label>
                        <p className="text-sm text-muted-foreground">Let others mention you in stories</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.social.allow_story_mentions}
                      onCheckedChange={(checked) => updateSetting('social', 'allow_story_mentions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Comment Moderation</Label>
                        <p className="text-sm text-muted-foreground">Review comments before they appear</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.social.comment_moderation}
                      onCheckedChange={(checked) => updateSetting('social', 'comment_moderation', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" />
                Appearance & Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value: any) => updateSetting('appearance', 'theme', value)}
                    >
                      <SelectTrigger className="bg-muted/30 backdrop-blur-sm border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Language</Label>
                    <Select
                      value={settings.appearance.language}
                      onValueChange={(value) => updateSetting('appearance', 'language', value)}
                    >
                      <SelectTrigger className="bg-muted/30 backdrop-blur-sm border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.appearance.compact_mode}
                      onCheckedChange={(checked) => updateSetting('appearance', 'compact_mode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label>Glass Effects</Label>
                        <p className="text-sm text-muted-foreground">Enable beautiful glassmorphism effects</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.appearance.glassmorphism_effects}
                      onCheckedChange={(checked) => updateSetting('appearance', 'glassmorphism_effects', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="glass-card-enhanced p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Save Changes</h3>
            <p className="text-sm text-muted-foreground">
              Your preferences are automatically saved as you change them.
            </p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="btn-responsive glass-card-enhanced border-primary/20 hover:border-primary/40"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;