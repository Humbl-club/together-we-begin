import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  glassmorphism_enabled: boolean;
  font_size: 'small' | 'medium' | 'large';
  high_contrast: boolean;
  animations_enabled: boolean;
}

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  event_reminders: boolean;
  challenge_updates: boolean;
  social_interactions: boolean;
  marketing_emails: boolean;
}

interface WellnessSettings {
  activity_reminders: boolean;
  daily_goal_steps: number;
  water_reminders: boolean;
  mindfulness_reminders: boolean;
  sleep_tracking: boolean;
  health_data_sharing: boolean;
}

interface SocialSettings {
  auto_follow_friends: boolean;
  content_suggestions: boolean;
  story_sharing: boolean;
  activity_visibility: 'public' | 'friends' | 'private';
  message_requests: boolean;
  group_invitations: boolean;
}

export interface UserSettings {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  wellness: WellnessSettings;
  social: SocialSettings;
}

const defaultSettings: UserSettings = {
  appearance: {
    theme: 'system',
    glassmorphism_enabled: true,
    font_size: 'medium',
    high_contrast: false,
    animations_enabled: true
  },
  notifications: {
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    event_reminders: true,
    challenge_updates: true,
    social_interactions: true,
    marketing_emails: false
  },
  wellness: {
    activity_reminders: true,
    daily_goal_steps: 8000,
    water_reminders: true,
    mindfulness_reminders: true,
    sleep_tracking: false,
    health_data_sharing: false
  },
  social: {
    auto_follow_friends: true,
    content_suggestions: true,
    story_sharing: true,
    activity_visibility: 'friends',
    message_requests: true,
    group_invitations: true
  }
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all settings tables
      const [appearance, notifications, wellness, social] = await Promise.all([
        supabase.from('user_appearance_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('user_notification_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('user_wellness_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('user_social_settings').select('*').eq('user_id', user.id).single()
      ]);

      const newSettings: UserSettings = {
        appearance: {
          theme: (appearance.data?.theme as 'light' | 'dark' | 'system') || defaultSettings.appearance.theme,
          glassmorphism_enabled: appearance.data?.glassmorphism_enabled ?? defaultSettings.appearance.glassmorphism_enabled,
          font_size: (appearance.data?.font_size as 'small' | 'medium' | 'large') || defaultSettings.appearance.font_size,
          high_contrast: appearance.data?.high_contrast ?? defaultSettings.appearance.high_contrast,
          animations_enabled: appearance.data?.animations_enabled ?? defaultSettings.appearance.animations_enabled
        },
        notifications: {
          push_enabled: notifications.data?.push_enabled ?? defaultSettings.notifications.push_enabled,
          email_enabled: notifications.data?.email_enabled ?? defaultSettings.notifications.email_enabled,
          sms_enabled: notifications.data?.sms_enabled ?? defaultSettings.notifications.sms_enabled,
          event_reminders: notifications.data?.event_reminders ?? defaultSettings.notifications.event_reminders,
          challenge_updates: notifications.data?.challenge_updates ?? defaultSettings.notifications.challenge_updates,
          social_interactions: notifications.data?.social_interactions ?? defaultSettings.notifications.social_interactions,
          marketing_emails: notifications.data?.marketing_emails ?? defaultSettings.notifications.marketing_emails
        },
        wellness: {
          activity_reminders: wellness.data?.activity_reminders ?? defaultSettings.wellness.activity_reminders,
          daily_goal_steps: wellness.data?.daily_goal_steps || defaultSettings.wellness.daily_goal_steps,
          water_reminders: wellness.data?.water_reminders ?? defaultSettings.wellness.water_reminders,
          mindfulness_reminders: wellness.data?.mindfulness_reminders ?? defaultSettings.wellness.mindfulness_reminders,
          sleep_tracking: wellness.data?.sleep_tracking ?? defaultSettings.wellness.sleep_tracking,
          health_data_sharing: wellness.data?.health_data_sharing ?? defaultSettings.wellness.health_data_sharing
        },
        social: {
          auto_follow_friends: social.data?.auto_follow_friends ?? defaultSettings.social.auto_follow_friends,
          content_suggestions: social.data?.content_suggestions ?? defaultSettings.social.content_suggestions,
          story_sharing: social.data?.story_sharing ?? defaultSettings.social.story_sharing,
          activity_visibility: (social.data?.activity_visibility as 'public' | 'friends' | 'private') || defaultSettings.social.activity_visibility,
          message_requests: social.data?.message_requests ?? defaultSettings.social.message_requests,
          group_invitations: social.data?.group_invitations ?? defaultSettings.social.group_invitations
        }
      };

      setSettings(newSettings);
      
      // Apply theme to document
      applyTheme(newSettings.appearance.theme);
      applyGlassmorphism(newSettings.appearance.glassmorphism_enabled);
      applyFontSize(newSettings.appearance.font_size);
      applyHighContrast(newSettings.appearance.high_contrast);
      applyAnimations(newSettings.appearance.animations_enabled);
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = [];

      if (newSettings.appearance) {
        updates.push(
          supabase.from('user_appearance_settings')
            .upsert({ user_id: user.id, ...newSettings.appearance })
        );
      }

      if (newSettings.notifications) {
        updates.push(
          supabase.from('user_notification_settings')
            .upsert({ user_id: user.id, ...newSettings.notifications })
        );
      }

      if (newSettings.wellness) {
        updates.push(
          supabase.from('user_wellness_settings')
            .upsert({ user_id: user.id, ...newSettings.wellness })
        );
      }

      if (newSettings.social) {
        updates.push(
          supabase.from('user_social_settings')
            .upsert({ user_id: user.id, ...newSettings.social })
        );
      }

      await Promise.all(updates);

      setSettings(prev => ({ ...prev, ...newSettings }));

      // Apply theme changes immediately
      if (newSettings.appearance?.theme) {
        applyTheme(newSettings.appearance.theme);
      }
      
      if (newSettings.appearance?.glassmorphism_enabled !== undefined) {
        applyGlassmorphism(newSettings.appearance.glassmorphism_enabled);
      }

      toast({
        title: "Success",
        description: "Settings saved successfully"
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Also set data attribute for consistency
    root.setAttribute('data-theme', theme);
  };

  const applyGlassmorphism = (enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('glassmorphism-enabled');
      root.style.setProperty('--glass-effects', 'enabled');
    } else {
      root.classList.remove('glassmorphism-enabled');
      root.style.setProperty('--glass-effects', 'disabled');
    }
  };

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${size}`);
  };

  const applyHighContrast = (enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  };

  const applyAnimations = (enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.remove('reduce-motion');
    } else {
      root.classList.add('reduce-motion');
    }
  };

  const updateSetting = <T extends keyof UserSettings>(
    section: T,
    key: keyof UserSettings[T],
    value: any
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    };
    
    setSettings(newSettings);
    
    // Apply appearance changes immediately
    if (section === 'appearance') {
      if (key === 'theme') {
        applyTheme(value);
      } else if (key === 'glassmorphism_enabled') {
        applyGlassmorphism(value);
      } else if (key === 'font_size') {
        applyFontSize(value);
      } else if (key === 'high_contrast') {
        applyHighContrast(value);
      } else if (key === 'animations_enabled') {
        applyAnimations(value);
      }
    }
    
    saveSettings({ [section]: newSettings[section] });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    saveSettings
  };
};