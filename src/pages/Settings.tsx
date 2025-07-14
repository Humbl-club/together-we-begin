import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useViewport } from '@/hooks/use-mobile';
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
  Coffee,
  Save,
  Check
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

// Setting Item Component for consistent mobile layout
const SettingItem: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, description, children, className = "" }) => {
  const { isMobile } = useViewport();
  
  return (
    <div className={`glass-card p-4 lg:p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between gap-4'}`}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-sm lg:text-base font-medium leading-tight">{title}</Label>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {children}
        </div>
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader: React.FC<{ icon: React.ElementType; title: string; subtitle?: string }> = ({ 
  icon: Icon, 
  title, 
  subtitle 
}) => (
  <div className="flex items-center gap-3 mb-4 lg:mb-6">
    <div className="p-2 lg:p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
    </div>
    <div>
      <h2 className="text-lg lg:text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm lg:text-base text-muted-foreground">{subtitle}</p>
      )}
    </div>
  </div>
);

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile, isTablet } = useViewport();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const [privacyResponse] = await Promise.all([
        supabase.from('privacy_settings').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      const loadedSettings = { ...defaultSettings };
      
      if (privacyResponse.data) {
        loadedSettings.privacy = {
          ...loadedSettings.privacy,
          profile_visibility: privacyResponse.data.profile_visibility as any,
          show_activity_status: privacyResponse.data.show_activity_status,
          allow_messages: privacyResponse.data.allow_messages as any,
          allow_friend_requests: privacyResponse.data.allow_friend_requests,
          show_location: privacyResponse.data.allow_location_sharing,
          show_fitness_data: false,
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

      setHasChanges(false);
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
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <div className="glass-card p-6 lg:p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 lg:h-8 bg-muted rounded-lg w-32 lg:w-48 mx-auto"></div>
            <div className="h-3 lg:h-4 bg-muted rounded w-48 lg:w-64 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4 text-sm lg:text-base">Loading your settings...</p>
        </div>
      </div>
    );
  }

  const tabsOrientation = isMobile ? "horizontal" : "horizontal";
  const tabsClass = isMobile ? "w-full" : "w-full";

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <Card className="glass-card border-0 shadow-xl">
        <CardContent className="p-4 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                <SettingsIcon className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm lg:text-lg">
                  Customize your HUMBL experience
                </p>
              </div>
            </div>
            
            {hasChanges && (
              <div className="lg:ml-auto">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full lg:w-auto glass-card border-primary/20 hover:border-primary/40"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4 lg:space-y-6" orientation={tabsOrientation}>
        <Card className="glass-card border-0 p-2">
          <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-5'} ${tabsClass} bg-transparent gap-1 lg:gap-2`}>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-1 lg:gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-xs lg:text-sm p-2 lg:p-3"
            >
              <Bell className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className={isMobile ? "text-xs" : ""}>Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="flex items-center gap-1 lg:gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-xs lg:text-sm p-2 lg:p-3"
            >
              <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className={isMobile ? "text-xs" : ""}>Privacy</span>
            </TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger 
                  value="wellness" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-sm p-3"
                >
                  <Heart className="w-4 h-4" />
                  Wellness
                </TabsTrigger>
                <TabsTrigger 
                  value="social" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-sm p-3"
                >
                  <Users className="w-4 h-4" />
                  Social
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-sm p-3"
                >
                  <Eye className="w-4 h-4" />
                  Appearance
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          {/* Mobile Additional Tabs */}
          {isMobile && (
            <TabsList className="grid grid-cols-3 w-full bg-transparent gap-1 mt-2">
              <TabsTrigger 
                value="wellness" 
                className="flex items-center gap-1 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-xs p-2"
              >
                <Heart className="w-3 h-3" />
                Wellness
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="flex items-center gap-1 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-xs p-2"
              >
                <Users className="w-3 h-3" />
                Social
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="flex items-center gap-1 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-sm text-xs p-2"
              >
                <Eye className="w-3 h-3" />
                Appearance
              </TabsTrigger>
            </TabsList>
          )}
        </Card>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4 lg:space-y-6">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-4">
              <SectionHeader 
                icon={Bell} 
                title="Notification Preferences" 
                subtitle="Choose what updates you want to receive"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 lg:space-y-4">
                <SettingItem
                  icon={Smartphone}
                  title="Push Notifications"
                  description="Get notifications on your device"
                >
                  <Switch
                    checked={settings.notifications.push_enabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'push_enabled', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Calendar}
                  title="Event Notifications"
                  description="New events and reminders"
                >
                  <Switch
                    checked={settings.notifications.events}
                    onCheckedChange={(checked) => updateSetting('notifications', 'events', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Target}
                  title="Challenge Notifications"
                  description="Challenge updates and achievements"
                >
                  <Switch
                    checked={settings.notifications.challenges}
                    onCheckedChange={(checked) => updateSetting('notifications', 'challenges', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={MessageSquare}
                  title="Message Notifications"
                  description="Direct messages and replies"
                >
                  <Switch
                    checked={settings.notifications.messages}
                    onCheckedChange={(checked) => updateSetting('notifications', 'messages', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Activity}
                  title="Social Activity"
                  description="Likes, comments, and mentions"
                >
                  <Switch
                    checked={settings.notifications.social}
                    onCheckedChange={(checked) => updateSetting('notifications', 'social', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Heart}
                  title="Wellness Reminders"
                  description="Daily wellness check-ins"
                >
                  <Switch
                    checked={settings.notifications.wellness_reminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'wellness_reminders', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Coffee}
                  title="Weekly Digest"
                  description="Weekly summary of your activity"
                >
                  <Switch
                    checked={settings.notifications.weekly_digest}
                    onCheckedChange={(checked) => updateSetting('notifications', 'weekly_digest', checked)}
                  />
                </SettingItem>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4 lg:space-y-6">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-4">
              <SectionHeader 
                icon={Shield} 
                title="Privacy & Security" 
                subtitle="Control who can see your information"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 lg:space-y-4">
                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Who can see your profile?</Label>
                    <Select
                      value={settings.privacy.profile_visibility}
                      onValueChange={(value: any) => updateSetting('privacy', 'profile_visibility', value)}
                    >
                      <SelectTrigger className="glass-card border-border/50 h-10 lg:h-12">
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
                </div>

                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Who can message you?</Label>
                    <Select
                      value={settings.privacy.allow_messages}
                      onValueChange={(value: any) => updateSetting('privacy', 'allow_messages', value)}
                    >
                      <SelectTrigger className="glass-card border-border/50 h-10 lg:h-12">
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

                <SettingItem
                  icon={Activity}
                  title="Show Activity Status"
                  description="Let others see when you're online"
                >
                  <Switch
                    checked={settings.privacy.show_activity_status}
                    onCheckedChange={(checked) => updateSetting('privacy', 'show_activity_status', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={MapPin}
                  title="Share Location"
                  description="Share your location in posts"
                >
                  <Switch
                    checked={settings.privacy.show_location}
                    onCheckedChange={(checked) => updateSetting('privacy', 'show_location', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Heart}
                  title="Share Fitness Data"
                  description="Include fitness data in challenges"
                >
                  <Switch
                    checked={settings.privacy.show_fitness_data}
                    onCheckedChange={(checked) => updateSetting('privacy', 'show_fitness_data', checked)}
                  />
                </SettingItem>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wellness Settings */}
        <TabsContent value="wellness" className="space-y-4 lg:space-y-6">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-4">
              <SectionHeader 
                icon={Heart} 
                title="Wellness Goals" 
                subtitle="Set your health and fitness preferences"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 lg:space-y-4">
                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Daily Activity Goal (steps)</Label>
                    <Input
                      type="number"
                      value={settings.wellness.activity_goal}
                      onChange={(e) => updateSetting('wellness', 'activity_goal', parseInt(e.target.value))}
                      className="glass-card border-border/50 h-10 lg:h-12"
                    />
                  </div>
                </div>

                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Preferred Workout Time</Label>
                    <Input
                      type="time"
                      value={settings.wellness.preferred_workout_time}
                      onChange={(e) => updateSetting('wellness', 'preferred_workout_time', e.target.value)}
                      className="glass-card border-border/50 h-10 lg:h-12"
                    />
                  </div>
                </div>

                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Challenge Difficulty</Label>
                    <Select
                      value={settings.wellness.challenge_difficulty}
                      onValueChange={(value: any) => updateSetting('wellness', 'challenge_difficulty', value)}
                    >
                      <SelectTrigger className="glass-card border-border/50 h-10 lg:h-12">
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

                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Reminder Frequency</Label>
                    <Select
                      value={settings.wellness.reminder_frequency}
                      onValueChange={(value: any) => updateSetting('wellness', 'reminder_frequency', value)}
                    >
                      <SelectTrigger className="glass-card border-border/50 h-10 lg:h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        <SelectItem value="none">No reminders</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SettingItem
                  icon={Activity}
                  title="Health Data Sharing"
                  description="Share anonymized data for research"
                >
                  <Switch
                    checked={settings.wellness.health_data_sharing}
                    onCheckedChange={(checked) => updateSetting('wellness', 'health_data_sharing', checked)}
                  />
                </SettingItem>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Settings */}
        <TabsContent value="social" className="space-y-4 lg:space-y-6">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-4">
              <SectionHeader 
                icon={Users} 
                title="Social Preferences" 
                subtitle="Manage your social interactions"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 lg:space-y-4">
                <SettingItem
                  icon={Users}
                  title="Auto-follow Event Attendees"
                  description="Automatically connect with event participants"
                >
                  <Switch
                    checked={settings.social.auto_follow_event_attendees}
                    onCheckedChange={(checked) => updateSetting('social', 'auto_follow_event_attendees', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Star}
                  title="Share Achievements"
                  description="Automatically post when you earn badges"
                >
                  <Switch
                    checked={settings.social.share_achievements}
                    onCheckedChange={(checked) => updateSetting('social', 'share_achievements', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Camera}
                  title="Allow Story Mentions"
                  description="Let others mention you in stories"
                >
                  <Switch
                    checked={settings.social.allow_story_mentions}
                    onCheckedChange={(checked) => updateSetting('social', 'allow_story_mentions', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Shield}
                  title="Comment Moderation"
                  description="Review comments before they appear"
                >
                  <Switch
                    checked={settings.social.comment_moderation}
                    onCheckedChange={(checked) => updateSetting('social', 'comment_moderation', checked)}
                  />
                </SettingItem>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4 lg:space-y-6">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-4">
              <SectionHeader 
                icon={Eye} 
                title="Appearance & Accessibility" 
                subtitle="Customize how the app looks and feels"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 lg:space-y-4">
                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value: any) => updateSetting('appearance', 'theme', value)}
                    >
                      <SelectTrigger className="glass-card border-border/50 h-10 lg:h-12">
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
                </div>

                <div className="glass-card p-4 lg:p-6">
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium">Language</Label>
                    <Select
                      value={settings.appearance.language}
                      onValueChange={(value) => updateSetting('appearance', 'language', value)}
                    >
                      <SelectTrigger className="glass-card border-border/50 h-10 lg:h-12">
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

                <SettingItem
                  icon={Zap}
                  title="Compact Mode"
                  description="Reduce spacing for more content"
                >
                  <Switch
                    checked={settings.appearance.compact_mode}
                    onCheckedChange={(checked) => updateSetting('appearance', 'compact_mode', checked)}
                  />
                </SettingItem>

                <SettingItem
                  icon={Eye}
                  title="Glass Effects"
                  description="Enable beautiful glassmorphism effects"
                >
                  <Switch
                    checked={settings.appearance.glassmorphism_effects}
                    onCheckedChange={(checked) => updateSetting('appearance', 'glassmorphism_effects', checked)}
                  />
                </SettingItem>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Confirmation */}
      {hasChanges && (
        <Card className="glass-card border-0 border-primary/20 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Check className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm lg:text-base">You have unsaved changes</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Don't forget to save your preferences.
                  </p>
                </div>
              </div>
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="w-full lg:w-auto"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;