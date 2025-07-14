// Global realtime connection optimization service
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionManager {
  channelName: string;
  subscriptions: Map<string, {
    table: string;
    event: string;
    filter?: string;
    callbacks: Set<(payload: any) => void>;
  }>;
  channel: any;
}

export class RealtimeOptimizationService {
  private static instance: RealtimeOptimizationService;
  private managers = new Map<string, SubscriptionManager>();
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 3;

  private constructor() {}

  static getInstance(): RealtimeOptimizationService {
    if (!RealtimeOptimizationService.instance) {
      RealtimeOptimizationService.instance = new RealtimeOptimizationService();
    }
    return RealtimeOptimizationService.instance;
  }

  // Subscribe with automatic connection pooling
  subscribe(
    userId: string,
    table: string,
    event: string,
    callback: (payload: any) => void,
    filter?: string
  ): () => void {
    const channelName = `optimized-${userId}`;
    let manager = this.managers.get(channelName);

    // Create manager if doesn't exist
    if (!manager) {
      manager = {
        channelName,
        subscriptions: new Map(),
        channel: null
      };
      this.managers.set(channelName, manager);
    }

    const subscriptionKey = `${table}-${event}-${filter || ''}`;
    let subscription = manager.subscriptions.get(subscriptionKey);

    // Create subscription if doesn't exist
    if (!subscription) {
      subscription = {
        table,
        event,
        filter,
        callbacks: new Set()
      };
      manager.subscriptions.set(subscriptionKey, subscription);
      
      // Re-setup channel with new subscription
      this.setupChannel(manager, userId);
    }

    // Add callback
    subscription.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      subscription!.callbacks.delete(callback);
      
      // Clean up if no more callbacks
      if (subscription!.callbacks.size === 0) {
        manager!.subscriptions.delete(subscriptionKey);
        
        // If no more subscriptions, cleanup manager
        if (manager!.subscriptions.size === 0) {
          this.cleanupManager(channelName);
        } else {
          // Re-setup channel without this subscription
          this.setupChannel(manager!, userId);
        }
      }
    };
  }

  private setupChannel(manager: SubscriptionManager, userId: string) {
    // Clean up existing channel
    if (manager.channel) {
      supabase.removeChannel(manager.channel);
    }

    // Create new optimized channel
    const channel = supabase
      .channel(manager.channelName, {
        config: {
          broadcast: { self: false }, // Don't echo back our own changes
          presence: { key: userId }
        }
      });

    // Add all subscriptions to single channel
    manager.subscriptions.forEach((subscription) => {
      channel.on('postgres_changes' as any, {
        event: subscription.event,
        schema: 'public',
        table: subscription.table,
        filter: subscription.filter || `user_id=eq.${userId}`
      }, (payload: any) => {
        // Broadcast to all callbacks for this subscription
        subscription.callbacks.forEach(callback => {
          try {
            callback(payload);
          } catch (error) {
            console.error('Realtime callback error:', error);
          }
        });
      });
    });

    // Subscribe with error handling
    channel.subscribe((status) => {
      const attempts = this.reconnectAttempts.get(manager.channelName) || 0;
      
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Realtime optimized for ${manager.subscriptions.size} tables`);
        this.reconnectAttempts.set(manager.channelName, 0);
      } else if (status === 'CHANNEL_ERROR' && attempts < this.maxReconnectAttempts) {
        console.warn(`🔄 Realtime reconnecting... (${attempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts.set(manager.channelName, attempts + 1);
        
        // Exponential backoff reconnection
        setTimeout(() => {
          this.setupChannel(manager, userId);
        }, Math.pow(2, attempts) * 1000);
      } else if (attempts >= this.maxReconnectAttempts) {
        console.error('❌ Realtime max reconnection attempts reached');
        this.cleanupManager(manager.channelName);
      }
    });

    manager.channel = channel;
  }

  private cleanupManager(channelName: string) {
    const manager = this.managers.get(channelName);
    if (manager?.channel) {
      supabase.removeChannel(manager.channel);
    }
    this.managers.delete(channelName);
    this.reconnectAttempts.delete(channelName);
  }

  // Get current subscription stats for monitoring
  getStats() {
    const stats = Array.from(this.managers.entries()).map(([name, manager]) => ({
      channelName: name,
      subscriptionCount: manager.subscriptions.size,
      totalCallbacks: Array.from(manager.subscriptions.values())
        .reduce((sum, sub) => sum + sub.callbacks.size, 0)
    }));

    return {
      totalChannels: this.managers.size,
      channels: stats,
      totalSubscriptions: stats.reduce((sum, s) => sum + s.subscriptionCount, 0)
    };
  }

  // Cleanup all connections (useful for logout)
  cleanup() {
    this.managers.forEach((manager) => {
      if (manager.channel) {
        supabase.removeChannel(manager.channel);
      }
    });
    this.managers.clear();
    this.reconnectAttempts.clear();
  }
}