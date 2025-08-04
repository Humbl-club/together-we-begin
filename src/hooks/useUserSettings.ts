import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  appearance: {
    theme: string;
    font_size: string;
    glassmorphism_enabled: boolean;
    high_contrast: boolean;
    animations_enabled: boolean;
  };
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    event_reminders: boolean;
    challenge_updates: boolean;
    social_interactions: boolean;
    notification_frequency: string;
    quiet_hours_start: string;
    quiet_hours_end: string;
  };
  wellness: {
    activity_reminders: boolean;
    daily_goal_steps: number;
    water_reminders: boolean;
    mindfulness_reminders: boolean;
    sleep_tracking: boolean;
    health_data_sharing: boolean;
  };
  social: {
    activity_visibility: string;
    auto_follow_friends: boolean;
    content_suggestions: boolean;
    story_sharing: boolean;
    message_requests: boolean;
    group_invitations: boolean;
  };
  privacy: {
    profile_visibility: string;
    allow_messages: string;
    show_activity_status: boolean;
    allow_location_sharing: boolean;
    allow_friend_requests: boolean;
  };
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize default settings
  const initializeUserSettings = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user already has settings, if not create them
      const { data: existingSettings } = await supabase
        .from('user_appearance_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingSettings) {
        // Create default settings for new user
        await Promise.all([
          supabase.from('user_appearance_settings').insert({ user_id: user.id }),
          supabase.from('user_notification_settings').insert({ user_id: user.id }),
          supabase.from('user_wellness_settings').insert({ user_id: user.id }),
          supabase.from('user_social_settings').insert({ user_id: user.id }),
          supabase.from('privacy_settings').insert({ user_id: user.id })
        ]);
      }
    } catch (error) {
      console.error('Error initializing user settings:', error);
    }
  }, [user]);

  // Fetch all user settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [
        { data: appearance },
        { data: notifications },
        { data: wellness },
        { data: social },
        { data: privacy }
      ] = await Promise.all([
        supabase.from('user_appearance_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('user_notification_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('user_wellness_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('user_social_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('privacy_settings').select('*').eq('user_id', user.id).single()
      ]);

      setSettings({
        appearance: {
          theme: appearance?.theme || 'system',
          font_size: appearance?.font_size || 'medium',
          glassmorphism_enabled: appearance?.glassmorphism_enabled ?? true,
          high_contrast: appearance?.high_contrast ?? false,
          animations_enabled: appearance?.animations_enabled ?? true,
        },
        notifications: {
          push_enabled: notifications?.push_enabled ?? true,
          email_enabled: notifications?.email_enabled ?? true,
          event_reminders: notifications?.event_reminders ?? true,
          challenge_updates: notifications?.challenge_updates ?? true,
          social_interactions: notifications?.social_interactions ?? true,
          notification_frequency: notifications?.notification_frequency || 'immediate',
          quiet_hours_start: notifications?.quiet_hours_start || '22:00',
          quiet_hours_end: notifications?.quiet_hours_end || '07:00',
        },
        wellness: {
          activity_reminders: wellness?.activity_reminders ?? true,
          daily_goal_steps: wellness?.daily_goal_steps || 8000,
          water_reminders: wellness?.water_reminders ?? true,
          mindfulness_reminders: wellness?.mindfulness_reminders ?? true,
          sleep_tracking: wellness?.sleep_tracking ?? false,
          health_data_sharing: wellness?.health_data_sharing ?? false,
        },
        social: {
          activity_visibility: social?.activity_visibility || 'friends',
          auto_follow_friends: social?.auto_follow_friends ?? true,
          content_suggestions: social?.content_suggestions ?? true,
          story_sharing: social?.story_sharing ?? true,
          message_requests: social?.message_requests ?? true,
          group_invitations: social?.group_invitations ?? true,
        },
        privacy: {
          profile_visibility: privacy?.profile_visibility || 'public',
          allow_messages: privacy?.allow_messages || 'everyone',
          show_activity_status: privacy?.show_activity_status ?? true,
          allow_location_sharing: privacy?.allow_location_sharing ?? false,
          allow_friend_requests: privacy?.allow_friend_requests ?? true,
        }
      });
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Update specific settings category
  const updateSettings = useCallback(async (category: keyof UserSettings, updatedValues: any) => {
    if (!user || !settings) return;

    try {
      const tableMap = {
        appearance: 'user_appearance_settings',
        notifications: 'user_notification_settings',
        wellness: 'user_wellness_settings',
        social: 'user_social_settings',
        privacy: 'privacy_settings'
      };

      const { error } = await supabase
        .from(tableMap[category])
        .update(updatedValues)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev!,
        [category]: { ...prev![category], ...updatedValues }
      }));

      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  }, [user, settings, toast]);

  // Initialize settings on user login
  useEffect(() => {
    if (user) {
      initializeUserSettings().then(() => {
        fetchSettings();
      });
    }
  }, [user, initializeUserSettings, fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refetchSettings: fetchSettings
  };
};