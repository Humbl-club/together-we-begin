import { supabase } from '@/integrations/supabase/client';
import { MobileEncryptionService } from './MobileEncryptionService';
import ConnectionService from '../ConnectionService';
import { MessageThread, DirectMessage } from './MessagingService';

export class MobileMessagingService {
  private static instance: MobileMessagingService;
  private currentUserId: string | null = null;
  private encryptionService: MobileEncryptionService | null = null;
  private connectionService: ConnectionService;
  private rateLimiter: Map<string, number> = new Map();
  private readonly MESSAGE_RATE_LIMIT = 30;

  // Simple caching for better performance
  private threadCache: MessageThread[] = [];
  private threadCacheTime = 0;
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  static getInstance(): MobileMessagingService {
    if (!MobileMessagingService.instance) {
      MobileMessagingService.instance = new MobileMessagingService();
    }
    return MobileMessagingService.instance;
  }

  constructor() {
    this.connectionService = ConnectionService.getInstance();
  }

  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    this.encryptionService = new MobileEncryptionService();
    await this.encryptionService.initialize(userId);
  }

  async getThreads(page = 0, limit = 20): Promise<MessageThread[]> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    // Use cache if available and fresh
    const now = Date.now();
    if (page === 0 && this.threadCache.length > 0 && (now - this.threadCacheTime) < this.CACHE_TTL) {
      return this.threadCache;
    }

    // Check connection before making request
    const connectionStatus = this.connectionService.getStatus();
    if (!connectionStatus.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      // Simplified query for better mobile compatibility
      const { data: threads, error } = await Promise.race([
        supabase
          .from('message_threads')
          .select(`
            id,
            participant_1,
            participant_2,
            last_message_at,
            last_message_id
          `)
          .or(`participant_1.eq.${this.currentUserId},participant_2.eq.${this.currentUserId}`)
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .limit(limit)
          .range(page * limit, (page + 1) * limit - 1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 10000))
      ]) as any;

      if (error) throw error;

      // Get other users' info
      const threadsWithUsers = await this.enrichThreadsWithUserData(threads || []);
      
      // Update cache for first page
      if (page === 0) {
        this.threadCache = threadsWithUsers;
        this.threadCacheTime = now;
      }

      return threadsWithUsers;
    } catch (error: any) {
      console.error('Error fetching threads:', error);
      
      // Return cached data if available, even if stale
      if (page === 0 && this.threadCache.length > 0) {
        console.log('Returning cached threads due to network error');
        return this.threadCache;
      }
      
      throw error;
    }
  }

  private async enrichThreadsWithUserData(threads: any[]): Promise<MessageThread[]> {
    if (threads.length === 0) return [];

    // Get all unique user IDs
    const userIds = new Set<string>();
    threads.forEach(thread => {
      const otherUserId = thread.participant_1 === this.currentUserId 
        ? thread.participant_2 
        : thread.participant_1;
      userIds.add(otherUserId);
    });

    // Fetch user profiles in batch
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(userIds));

    const profileMap = new Map();
    profiles?.forEach(profile => profileMap.set(profile.id, profile));

    // Get unread counts for each thread
    const unreadCounts = await this.getUnreadCountsForThreads(threads.map(t => t.id));

    return threads.map(thread => {
      const otherUserId = thread.participant_1 === this.currentUserId 
        ? thread.participant_2 
        : thread.participant_1;
      
      const otherUser = profileMap.get(otherUserId);
      
      return {
        id: thread.id,
        participant_1: thread.participant_1,
        participant_2: thread.participant_2,
        last_message_at: thread.last_message_at,
        last_message_id: thread.last_message_id,
        other_user: otherUser ? {
          id: otherUserId,
          full_name: otherUser.full_name || 'Unknown User',
          avatar_url: otherUser.avatar_url
        } : {
          id: otherUserId,
          full_name: 'Unknown User'
        },
        unread_count: unreadCounts.get(thread.id) || 0
      };
    });
  }

  private async getUnreadCountsForThreads(threadIds: string[]): Promise<Map<string, number>> {
    if (!this.currentUserId || threadIds.length === 0) return new Map();

    try {
      const { data } = await supabase
        .rpc('get_unread_counts_for_user', { user_id_param: this.currentUserId });
      
      const countMap = new Map();
      data?.forEach((row: any) => {
        if (threadIds.includes(row.thread_id)) {
          countMap.set(row.thread_id, Number(row.unread_count) || 0);
        }
      });
      
      return countMap;
    } catch (error) {
      console.warn('Failed to get unread counts:', error);
      return new Map();
    }
  }

  async getMessages(threadId: string, page = 0, limit = 50): Promise<DirectMessage[]> {
    if (!this.currentUserId || !this.encryptionService) {
      throw new Error('Not authenticated or encryption not initialized');
    }

    // Check connection
    const connectionStatus = this.connectionService.getStatus();
    if (!connectionStatus.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      // Get thread participants
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .select('participant_1, participant_2')
        .eq('id', threadId)
        .single();

      if (threadError || !thread) throw new Error('Thread not found');

      // Get messages with timeout
      const { data: encryptedMessages, error } = await Promise.race([
        supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${thread.participant_1},recipient_id.eq.${thread.participant_2}),and(sender_id.eq.${thread.participant_2},recipient_id.eq.${thread.participant_1})`)
          .order('created_at', { ascending: true })
          .range(page * limit, (page + 1) * limit - 1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000))
      ]) as any;

      if (error) throw error;

      if (!encryptedMessages || encryptedMessages.length === 0) {
        return [];
      }

      // Decrypt messages using main thread encryption
      const otherUserId = thread.participant_1 === this.currentUserId 
        ? thread.participant_2 
        : thread.participant_1;

      const decryptedMessages = await this.encryptionService.decryptMessages(
        encryptedMessages,
        otherUserId,
        this.currentUserId
      );

      // Mark as read asynchronously
      const hasUnreadMessages = encryptedMessages.some(
        msg => msg.recipient_id === this.currentUserId && !msg.read_at
      );
      
      if (hasUnreadMessages) {
        setTimeout(() => this.markThreadAsRead(threadId), 100);
      }

      return decryptedMessages;
    } catch (error: any) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async sendMessage(recipientId: string, content: string): Promise<DirectMessage> {
    if (!this.currentUserId || !this.encryptionService) {
      throw new Error('Not authenticated or encryption not initialized');
    }

    // Validate content
    if (!content.trim() || content.length > 500) {
      throw new Error('Invalid message content');
    }

    // Rate limiting
    if (!this.checkRateLimit(this.currentUserId)) {
      throw new Error('Rate limit exceeded');
    }

    // Check connection
    const connectionStatus = this.connectionService.getStatus();
    if (!connectionStatus.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      // Find or create thread
      const threadId = await this.findOrCreateThread(recipientId);

      // Encrypt message
      const { encrypted, nonce } = await this.encryptionService.encryptMessage(content, recipientId);

      // Insert message
      const { data: message, error } = await supabase
        .from('direct_messages')
        .insert({
          content: encrypted,
          sender_id: this.currentUserId,
          recipient_id: recipientId,
          media_url: nonce,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread timestamp
      await supabase
        .from('message_threads')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_id: message.id
        })
        .eq('id', threadId);

      // Clear thread cache to force refresh
      this.threadCache = [];
      this.threadCacheTime = 0;

      return { ...message, content };
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markThreadAsRead(threadId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await supabase.rpc('mark_thread_messages_read', {
        thread_id_param: threadId,
        user_id_param: this.currentUserId
      });
    } catch (error) {
      console.warn('Failed to mark thread as read:', error);
    }
  }

  private async findOrCreateThread(recipientId: string): Promise<string> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    // Check for existing thread
    const { data: existingThread } = await supabase
      .from('message_threads')
      .select('id')
      .or(`and(participant_1.eq.${this.currentUserId},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${this.currentUserId})`)
      .maybeSingle();

    if (existingThread) return existingThread.id;

    // Create new thread
    const { data: newThread, error } = await supabase
      .from('message_threads')
      .insert({
        participant_1: this.currentUserId,
        participant_2: recipientId
      })
      .select('id')
      .single();

    if (error) throw error;
    return newThread.id;
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userKey = `${userId}_${Math.floor(now / 60000)}`;
    const currentCount = this.rateLimiter.get(userKey) || 0;
    
    if (currentCount >= this.MESSAGE_RATE_LIMIT) {
      return false;
    }
    
    this.rateLimiter.set(userKey, currentCount + 1);
    return true;
  }

  subscribeToMessages(threadId: string, onMessage: (message: DirectMessage) => void) {
    if (!this.currentUserId || !this.encryptionService) {
      console.error('Cannot subscribe: not authenticated');
      return null;
    }

    return supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        async (payload) => {
          const encryptedMessage = payload.new as any;
          
          // Skip our own messages
          if (encryptedMessage.sender_id === this.currentUserId) {
            onMessage(encryptedMessage);
            return;
          }

          try {
            const decrypted = await this.encryptionService!.decryptSingleMessage(
              encryptedMessage,
              encryptedMessage.sender_id
            );
            onMessage(decrypted);
          } catch (error) {
            console.error('Failed to decrypt real-time message:', error);
            onMessage({
              ...encryptedMessage,
              content: '[Message could not be decrypted]'
            });
          }
        }
      )
      .subscribe();
  }

  async clearUserData(userId: string): Promise<void> {
    if (this.encryptionService) {
      await this.encryptionService.clearKeys(userId);
    }
    this.currentUserId = null;
    this.encryptionService = null;
    this.rateLimiter.clear();
    this.threadCache = [];
    this.threadCacheTime = 0;
  }
}