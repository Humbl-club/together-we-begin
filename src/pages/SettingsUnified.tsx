import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { PageLoading } from '@/components/ui/enhanced-loading';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  Palette,
  ChevronRight,
  Save,
  Mail,
  Lock,
  Heart,
  Users,
  MessageCircle
} from 'lucide-react';

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = memo(() => {
  const { isMobile } = useViewport();
  const haptics = useHapticFeedback();
  const [loading, setLoading] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);

  const settingsGroups = [
    {
      id: 'account',
      title: 'Account',
      icon: User,
      description: 'Profile and account management',
      items: [
        { name: 'Profile Information', description: 'Update your personal details', enabled: true },
        { name: 'Privacy Controls', description: 'Manage who can see your content', enabled: true },
        { name: 'Account Security', description: 'Password and authentication', enabled: true },
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Manage how you receive updates',
      items: [
        { name: 'Push Notifications', description: 'Event updates and messages', enabled: true },
        { name: 'Email Preferences', description: 'Weekly digests and announcements', enabled: false },
        { name: 'Community Updates', description: 'New posts and activities', enabled: true },
      ]
    },
    {
      id: 'messaging',
      title: 'Messaging',
      icon: MessageCircle,
      description: 'Communication preferences',
      items: [
        { name: 'Direct Messages', description: 'Allow direct messaging', enabled: true },
        { name: 'Read Receipts', description: 'Show when messages are read', enabled: true },
        { name: 'Message Preview', description: 'Show message previews', enabled: false },
      ]
    },
    {
      id: 'wellness',
      title: 'Wellness',
      icon: Heart,
      description: 'Health and activity tracking',
      items: [
        { name: 'Activity Tracking', description: 'Monitor daily steps and activities', enabled: true },
        { name: 'Health Data Sync', description: 'Sync with Apple Health/Google Fit', enabled: false },
        { name: 'Wellness Reminders', description: 'Daily wellness check-ins', enabled: true },
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Customize your interface',
      items: [
        { name: 'Dark Mode', description: 'Switch to dark theme', enabled: false },
        { name: 'Animations', description: 'Enable smooth animations', enabled: true },
        { name: 'Accessibility', description: 'High contrast and larger text', enabled: false },
      ]
    }
  ];

  const handleToggle = (groupId: string, itemName: string) => {
    haptics.tap();
    // Toggle logic here
  };

  const renderSectionContent = (sectionId: string) => {
    const section = settingsGroups.find(s => s.id === sectionId);
    if (!section) return null;

    return (
      <Card className="card-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg card-accent">
              <section.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="editorial-heading">{section.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-mobile">
          {section.items.map((item, index) => (
            <div key={item.name}>
              <div className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{item.name}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
                <Switch
                  checked={item.enabled}
                  onCheckedChange={() => handleToggle(sectionId, item.name)}
                  className="ml-4"
                />
              </div>
              {index < section.items.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <PageLoading title="Loading settings..." />;
  }

  return (
    <div className="container mx-auto p-mobile space-mobile max-w-4xl">
      {/* Header */}
      <Card className="card-primary">
        <CardContent className="p-mobile">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl card-accent">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold editorial-heading">Settings</h1>
              <p className="text-muted-foreground">Customize your app experience</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isMobile ? (
        activeMobileSection ? (
          <div className="space-mobile">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => {
                setActiveMobileSection(null);
                haptics.tap();
              }}
              className="w-full justify-start"
            >
              ← Back to Settings
            </Button>
            {renderSectionContent(activeMobileSection)}
          </div>
        ) : (
          /* Mobile sections list */
          <div className="space-mobile">
            {settingsGroups.map((group) => {
              const IconComponent = group.icon;
              return (
                <Card 
                  key={group.id} 
                  className="card-secondary cursor-pointer touch-feedback"
                  onClick={() => {
                    setActiveMobileSection(group.id);
                    haptics.tap();
                  }}
                >
                  <CardContent className="p-mobile">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg card-accent">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium editorial-heading">{group.title}</h3>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Desktop grid layout */
        <div className="responsive-grid lg:grid-cols-2">
          {settingsGroups.map((group) => renderSectionContent(group.id))}
        </div>
      )}

      {/* Save Changes Button */}
      <Card className="card-accent">
        <CardContent className="p-mobile">
          <Button 
            className="w-full" 
            onClick={() => {
              haptics.impact('medium');
              setLoading(true);
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

export default SettingsPage;