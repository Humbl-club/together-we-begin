import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileToggle } from '@/components/ui/mobile-toggle';
import { Bell, Shield, Heart, Users, Palette, Save, MessageCircle, Lock, Search, ChevronRight } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { MobileActionSheet } from '@/components/ui/mobile-action-sheet';
import { SwipeableCard } from '@/components/ui/swipeable-card';
import { cn } from '@/lib/utils';

const Settings: React.FC = () => {
  const { settings, loading, saving, updateSetting } = useUserSettings();
  const { isMobile } = useViewport();
  const feedback = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Enhanced toggle handler with haptic feedback
  const handleToggleChange = (section: any, key: any, value: boolean) => {
    feedback.tap();
    updateSetting(section, key, value);
  };

  // Settings sections for mobile
  const settingSections = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Manage how you receive notifications'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Control your privacy settings'
    },
    {
      id: 'messaging',
      title: 'Messaging',
      icon: MessageCircle,
      description: 'Communication preferences'
    },
    {
      id: 'wellness',
      title: 'Wellness & Health',
      icon: Heart,
      description: 'Health tracking settings'
    },
    {
      id: 'social',
      title: 'Social Features',
      icon: Users,
      description: 'Social interaction settings'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Customize your interface'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="glass-card-enhanced p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Palette className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your app experience</p>
          </div>
        </div>

        {/* Search bar for mobile */}
        {isMobile && (
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {isMobile ? (
        // Mobile vertical sections layout
        <div className="space-y-4">
          {settingSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <SwipeableCard key={section.id} className="p-0">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{section.title}</h3>
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </SwipeableCard>
            );
          })}
        </div>
      ) : (
        // Desktop tabs layout
        <Tabs defaultValue="notifications" className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:grid-cols-6 gap-1 p-1">
              <TabsTrigger value="notifications" className="flex items-center gap-2 flex-shrink-0">
                <Bell className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 flex-shrink-0">
                <Shield className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="messaging" className="flex items-center gap-2 flex-shrink-0">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Messaging</span>
              </TabsTrigger>
              <TabsTrigger value="wellness" className="flex items-center gap-2 flex-shrink-0">
                <Heart className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Wellness</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2 flex-shrink-0">
                <Users className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Social</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 flex-shrink-0">
                <Palette className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Appearance</span>
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="notifications">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="pushNotifications" className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground mt-1">Get instant updates on your device</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.push_enabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'push_enabled', checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="emailNotifications" className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground mt-1">Receive updates via email</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.email_enabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email_enabled', checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="smsNotifications" className="text-base font-medium">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground mt-1">Get text messages for important updates</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.sms_enabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'sms_enabled', checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="eventReminders" className="text-base font-medium">Event Reminders</Label>
                    <p className="text-sm text-muted-foreground mt-1">Never miss upcoming events</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.event_reminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'event_reminders', checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="challengeUpdates" className="text-base font-medium">Challenge Updates</Label>
                    <p className="text-sm text-muted-foreground mt-1">Stay updated on wellness challenges</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.challenge_updates}
                    onCheckedChange={(checked) => updateSetting('notifications', 'challenge_updates', checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="socialInteractions" className="text-base font-medium">Social Interactions</Label>
                    <p className="text-sm text-muted-foreground mt-1">Likes, comments, and new followers</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.social_interactions}
                    onCheckedChange={(checked) => updateSetting('notifications', 'social_interactions', checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1">
                    <Label htmlFor="marketingEmails" className="text-base font-medium">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground mt-1">Community updates and promotions</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.marketing_emails}
                    onCheckedChange={(checked) => updateSetting('notifications', 'marketing_emails', checked)}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <Select value={settings.social.activity_visibility} onValueChange={(value) => updateSetting('social', 'activity_visibility', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="messageRequests">Allow Message Requests</Label>
                  <MobileToggle
                    checked={settings.social.message_requests}
                    onCheckedChange={(checked) => updateSetting('social', 'message_requests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="groupInvitations">Group Invitations</Label>
                  <MobileToggle
                    checked={settings.social.group_invitations}
                    onCheckedChange={(checked) => updateSetting('social', 'group_invitations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="contentSuggestions">Content Suggestions</Label>
                  <MobileToggle
                    checked={settings.social.content_suggestions}
                    onCheckedChange={(checked) => updateSetting('social', 'content_suggestions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="storySharing">Story Sharing</Label>
                  <MobileToggle
                    checked={settings.social.story_sharing}
                    onCheckedChange={(checked) => updateSetting('social', 'story_sharing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messaging & Communication
              </CardTitle>
              <CardDescription>
                Control your messaging preferences and encryption settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowMessages">Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">Enable direct messaging with other members</p>
                  </div>
                  <MobileToggle
                    checked={settings.social.message_requests}
                    onCheckedChange={(checked) => updateSetting('social', 'message_requests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="messagePreview">Message Previews</Label>
                    <p className="text-sm text-muted-foreground">Show message previews in notifications</p>
                  </div>
                  <MobileToggle
                    checked={settings.notifications.social_interactions}
                    onCheckedChange={(checked) => updateSetting('notifications', 'social_interactions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="readReceipts">Read Receipts</Label>
                    <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
                  </div>
                  <MobileToggle
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">End-to-End Encryption</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All messages are encrypted with client-side keys. Even administrators cannot read your conversations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wellness">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Wellness & Health
              </CardTitle>
              <CardDescription>
                Manage your wellness tracking and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="activityReminders">Activity Reminders</Label>
                  <MobileToggle
                    checked={settings.wellness.activity_reminders}
                    onCheckedChange={(checked) => updateSetting('wellness', 'activity_reminders', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailySteps">Daily Step Goal</Label>
                  <Input
                    id="dailySteps"
                    type="number"
                    value={settings.wellness.daily_goal_steps}
                    onChange={(e) => updateSetting('wellness', 'daily_goal_steps', parseInt(e.target.value) || 8000)}
                    min="1000"
                    max="50000"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="waterReminders">Water Reminders</Label>
                  <MobileToggle
                    checked={settings.wellness.water_reminders}
                    onCheckedChange={(checked) => updateSetting('wellness', 'water_reminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mindfulnessReminders">Mindfulness Reminders</Label>
                  <MobileToggle
                    checked={settings.wellness.mindfulness_reminders}
                    onCheckedChange={(checked) => updateSetting('wellness', 'mindfulness_reminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sleepTracking">Sleep Tracking</Label>
                  <MobileToggle
                    checked={settings.wellness.sleep_tracking}
                    onCheckedChange={(checked) => updateSetting('wellness', 'sleep_tracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="healthDataSharing">Health Data Sharing</Label>
                  <MobileToggle
                    checked={settings.wellness.health_data_sharing}
                    onCheckedChange={(checked) => updateSetting('wellness', 'health_data_sharing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Social Features
              </CardTitle>
              <CardDescription>
                Configure your social interaction preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoFollowFriends">Auto-Follow Event Attendees</Label>
                  <MobileToggle
                    checked={settings.social.auto_follow_friends}
                    onCheckedChange={(checked) => updateSetting('social', 'auto_follow_friends', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="contentSuggestions">Content Suggestions</Label>
                  <MobileToggle
                    checked={settings.social.content_suggestions}
                    onCheckedChange={(checked) => updateSetting('social', 'content_suggestions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="storySharing">Story Sharing</Label>
                  <MobileToggle
                    checked={settings.social.story_sharing}
                    onCheckedChange={(checked) => updateSetting('social', 'story_sharing', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityVisibility">Activity Visibility</Label>
                  <Select value={settings.social.activity_visibility} onValueChange={(value) => updateSetting('social', 'activity_visibility', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="messageRequests">Message Requests</Label>
                  <MobileToggle
                    checked={settings.social.message_requests}
                    onCheckedChange={(checked) => updateSetting('social', 'message_requests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="groupInvitations">Group Invitations</Label>
                  <MobileToggle
                    checked={settings.social.group_invitations}
                    onCheckedChange={(checked) => updateSetting('social', 'group_invitations', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="glass-card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.appearance.theme} onValueChange={(value) => updateSetting('appearance', 'theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select value={settings.appearance.font_size} onValueChange={(value) => updateSetting('appearance', 'font_size', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="highContrast">High Contrast</Label>
                  <MobileToggle
                    checked={settings.appearance.high_contrast}
                    onCheckedChange={(checked) => updateSetting('appearance', 'high_contrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="glassmorphism">Glassmorphism Effects</Label>
                  <MobileToggle
                    checked={settings.appearance.glassmorphism_enabled}
                    onCheckedChange={(checked) => updateSetting('appearance', 'glassmorphism_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Enable Animations</Label>
                  <MobileToggle
                    checked={settings.appearance.animations_enabled}
                    onCheckedChange={(checked) => updateSetting('appearance', 'animations_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <div className="flex justify-end pt-6">
          <Button disabled={saving} className="min-w-[120px]">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Auto-saved'}
          </Button>
        </div>
        </Tabs>
      )}
    </div>
  );
};

export default Settings;