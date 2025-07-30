import React, { memo, useState } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Smartphone,
  Volume2,
  Vibrate,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Heart,
  ChevronRight,
  ArrowLeft,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'slider' | 'action';
  value?: boolean | number;
  icon?: React.ComponentType<any>;
  action?: () => void;
}

interface SettingSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  items: SettingItem[];
}

const MobileSettingsPage: React.FC = memo(() => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, boolean | number>>({
    pushNotifications: true,
    emailNotifications: false,
    messageNotifications: true,
    eventReminders: true,
    darkMode: false,
    hapticFeedback: true,
    soundVolume: 70,
    privateProfile: false,
    showActivity: true,
    allowConnections: true
  });

  const settingSections: SettingSection[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          id: 'pushNotifications',
          label: 'Push Notifications',
          description: 'Receive notifications on your device',
          type: 'toggle',
          value: settings.pushNotifications
        },
        {
          id: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Get updates via email',
          type: 'toggle',
          value: settings.emailNotifications
        },
        {
          id: 'messageNotifications',
          label: 'Message Alerts',
          description: 'Notify when you receive messages',
          type: 'toggle',
          value: settings.messageNotifications
        },
        {
          id: 'eventReminders',
          label: 'Event Reminders',
          description: 'Remind me about upcoming events',
          type: 'toggle',
          value: settings.eventReminders
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          id: 'privateProfile',
          label: 'Private Profile',
          description: 'Only connections can see your profile',
          type: 'toggle',
          value: settings.privateProfile
        },
        {
          id: 'showActivity',
          label: 'Show Activity Status',
          description: 'Let others see when you\'re active',
          type: 'toggle',
          value: settings.showActivity
        },
        {
          id: 'allowConnections',
          label: 'Allow New Connections',
          description: 'Others can send you connection requests',
          type: 'toggle',
          value: settings.allowConnections
        }
      ]
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      icon: Smartphone,
      items: [
        {
          id: 'darkMode',
          label: 'Dark Mode',
          description: 'Use dark theme',
          type: 'toggle',
          value: settings.darkMode
        },
        {
          id: 'hapticFeedback',
          label: 'Haptic Feedback',
          description: 'Feel vibrations for interactions',
          type: 'toggle',
          value: settings.hapticFeedback
        },
        {
          id: 'soundVolume',
          label: 'Sound Volume',
          description: 'Adjust notification sounds',
          type: 'slider',
          value: settings.soundVolume
        }
      ]
    }
  ];

  const handleSettingChange = (settingId: string, value: boolean | number) => {
    feedback.tap();
    setSettings(prev => ({ ...prev, [settingId]: value }));
  };

  const handleSectionTap = (sectionId: string) => {
    feedback.tap();
    setActiveSection(sectionId);
  };

  const handleBack = () => {
    feedback.tap();
    setActiveSection(null);
  };

  const handleSave = () => {
    feedback.success();
    console.log('Settings saved:', settings);
  };

  if (!isMobile) {
    // Desktop version
    return (
      <UnifiedLayout>
        <div className="container mx-auto px-8 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          {/* Desktop settings content */}
        </div>
      </UnifiedLayout>
    );
  }

  // Mobile section detail view
  if (activeSection) {
    const section = settingSections.find(s => s.id === activeSection);
    if (!section) return null;

    return (
      <UnifiedLayout>
        <div 
          className="min-h-screen bg-background"
          style={{
            paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
            paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`,
            paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
            paddingRight: `max(16px, ${safeAreaInsets.right}px)`
          }}
        >
          <div className="space-y-6 px-4">
            {/* Section Header */}
            <div className="flex items-center gap-3 py-2">
              <MobileNativeButton
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-10 w-10 p-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </MobileNativeButton>
              <div className="flex items-center gap-3">
                <section.icon className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">{section.title}</h1>
              </div>
            </div>

            {/* Settings List */}
            <div className="space-y-3">
              {section.items.map((item) => (
                <MobileFirstCard key={item.id} variant="default" padding="md">
                  <MobileFirstCardContent>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">{item.label}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        
                        {item.type === 'toggle' && (
                          <Switch
                            checked={settings[item.id] as boolean}
                            onCheckedChange={(checked) => handleSettingChange(item.id, checked)}
                            className="ml-3"
                          />
                        )}
                      </div>
                      
                      {item.type === 'slider' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Volume</span>
                            <span className="text-sm font-medium">{settings[item.id]}%</span>
                          </div>
                          <Slider
                            value={[settings[item.id] as number]}
                            onValueChange={([value]) => handleSettingChange(item.id, value)}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </MobileFirstCardContent>
                </MobileFirstCard>
              ))}
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <MobileNativeButton
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleSave}
              >
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </MobileNativeButton>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Mobile main settings view
  return (
    <UnifiedLayout>
      <div 
        className="min-h-screen bg-background"
        style={{
          paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`,
          paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
          paddingRight: `max(16px, ${safeAreaInsets.right}px)`
        }}
      >
        <div className="space-y-6 px-4">
          {/* Header */}
          <div className="py-2">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customize your experience
            </p>
          </div>

          {/* Quick Toggles */}
          <MobileFirstCard variant="glass" padding="md">
            <MobileFirstCardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <MobileNativeButton
                    variant={settings.darkMode ? "primary" : "secondary"}
                    size="sm"
                    className="w-full h-16 flex-col"
                    onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
                  >
                    <Moon className="h-5 w-5 mb-1" />
                    <span className="text-xs">Dark</span>
                  </MobileNativeButton>
                </div>
                <div className="text-center">
                  <MobileNativeButton
                    variant={settings.pushNotifications ? "primary" : "secondary"}
                    size="sm"
                    className="w-full h-16 flex-col"
                    onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                  >
                    <Bell className="h-5 w-5 mb-1" />
                    <span className="text-xs">Notify</span>
                  </MobileNativeButton>
                </div>
                <div className="text-center">
                  <MobileNativeButton
                    variant={settings.hapticFeedback ? "primary" : "secondary"}
                    size="sm"
                    className="w-full h-16 flex-col"
                    onClick={() => handleSettingChange('hapticFeedback', !settings.hapticFeedback)}
                  >
                    <Vibrate className="h-5 w-5 mb-1" />
                    <span className="text-xs">Haptic</span>
                  </MobileNativeButton>
                </div>
              </div>
            </MobileFirstCardContent>
          </MobileFirstCard>

          {/* Settings Sections */}
          <div className="space-y-3">
            {settingSections.map((section) => (
              <MobileFirstCard
                key={section.id}
                variant="elevated"
                interactive
                padding="md"
                onClick={() => handleSectionTap(section.id)}
                className="transform-gpu active:scale-[0.98]"
              >
                <MobileFirstCardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {section.items.length} settings
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </MobileFirstCardContent>
              </MobileFirstCard>
            ))}
          </div>

          {/* Account Actions */}
          <div className="space-y-3 pt-4">
            <MobileFirstCard variant="default" padding="md">
              <MobileFirstCardContent>
                <div className="space-y-3">
                  <MobileNativeButton
                    variant="secondary"
                    fullWidth
                    size="lg"
                    onClick={() => feedback.tap()}
                  >
                    Export My Data
                  </MobileNativeButton>
                  <MobileNativeButton
                    variant="ghost"
                    fullWidth
                    size="lg"
                    onClick={() => feedback.tap()}
                    className="text-destructive"
                  >
                    Delete Account
                  </MobileNativeButton>
                </div>
              </MobileFirstCardContent>
            </MobileFirstCard>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
});

export default MobileSettingsPage;