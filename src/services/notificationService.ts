import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  type: 'message' | 'like' | 'comment' | 'event' | 'challenge' | 'friend_request';
  title: string;
  content?: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPush(userId: string): Promise<boolean> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLat3eAALLswE3xKqOZZQWiIyBWF8WaGPM8VUEEVxd7YN1OJokzJ8Q'
        )
      });

      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return false;
    }
   }
 
   async ensurePushSubscription(userId: string): Promise<boolean> {
     try {
       if (!this.registration) {
         await this.initialize();
       }
       if (!this.registration) return false;
 
       const { data: settings } = await supabase
         .from('user_notification_settings')
         .select('push_enabled')
         .eq('user_id', userId)
         .maybeSingle();
 
       const currentSub = await this.registration.pushManager.getSubscription();
 
       if (settings?.push_enabled) {
         if (!currentSub) {
           return await this.subscribeToPush(userId);
         }
         return true;
       } else {
         if (currentSub) {
           try { await currentSub.unsubscribe(); } catch (e) { console.warn('Unsubscribe failed', e); }
         }
         await supabase.from('push_subscriptions').delete().eq('user_id', userId);
         return true;
       }
     } catch (error) {
       console.error('ensurePushSubscription failed:', error);
       return false;
     }
   }

  async createNotification(userId: string, notification: NotificationData) {
    try {
      // Load user notification preferences
      const { data: settings } = await supabase
        .from('user_notification_settings')
        .select('social_interactions, event_reminders, challenge_updates, quiet_hours_start, quiet_hours_end')
        .eq('user_id', userId)
        .maybeSingle();

      // Map notification types to user preferences
      const typeAllowed = (() => {
        if (!settings) return true; // default allow
        switch (notification.type) {
          case 'event':
            return settings.event_reminders;
          case 'challenge':
            return settings.challenge_updates;
          case 'message':
          case 'like':
          case 'comment':
          case 'friend_request':
            return settings.social_interactions;
          default:
            return true;
        }
      })();

      if (!typeAllowed) return;

      // Quiet hours enforcement (local time)
      const inQuietHours = (() => {
        if (!settings?.quiet_hours_start || !settings?.quiet_hours_end) return false;
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const start = settings.quiet_hours_start;
        const end = settings.quiet_hours_end;
        if (start === end) return false; // disabled
        // Normal window (e.g., 22:00 -> 07:00 crosses midnight)
        if (start <= end) {
          return current >= start && current < end;
        }
        // Overnight window
        return current >= start || current < end;
      })();

      if (inQuietHours) return;

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          data: notification.data
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data || [];
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default NotificationService;