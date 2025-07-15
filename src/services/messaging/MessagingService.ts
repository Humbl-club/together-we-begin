import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, decryptMessage, generateKeyPair, encodeKey, decodeKey } from '@/utils/encryption';
import { SecureStorage } from '@/utils/secureStorage';
import { MessageDecryption } from '@/utils/messageDecryption';

export interface MessageThread {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at?: string;
  last_message_id?: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  unread_count: number;
}

export interface DirectMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at?: string;
  media_url?: string; // Used as nonce for encryption
}

export class MessagingService {
  private static instance: MessagingService;
  private currentUserId: string | null = null;
  private userKeyPair: { publicKey: Uint8Array; secretKey: Uint8Array } | null = null;
  private rateLimiter: Map<string, number> = new Map();
  private readonly MESSAGE_RATE_LIMIT = 30; // messages per minute

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  async initialize(userId: string) {
    this.currentUserId = userId;
    await this.initializeEncryption(userId);
  }

  private async initializeEncryption(userId: string) {
    try {
      // Check if user has stored keys in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('public_key')
        .eq('id', userId)
        .single();

      if (!profile?.public_key) {
        // Generate new key pair
        const keyPair = generateKeyPair();
        this.userKeyPair = keyPair;

        // Store public key in profile
        await supabase
          .from('profiles')
          .update({ public_key: encodeKey(keyPair.publicKey) })
          .eq('id', userId);

        // Store private key securely
        await SecureStorage.storePrivateKey(userId, keyPair.secretKey);
      } else {
        // Load existing keys
        const privateKey = await SecureStorage.retrievePrivateKey(userId);
        if (privateKey) {
          this.userKeyPair = {
            publicKey: decodeKey(profile.public_key),
            secretKey: privateKey
          };
        }
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
    }
  }

  async getThreads(page = 0, limit = 20): Promise<MessageThread[]> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    try {
      const { data: threads, error } = await supabase
        .from('message_threads')
        .select('*')
        .or(`participant_1.eq.${this.currentUserId},participant_2.eq.${this.currentUserId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      // Get other user IDs for batch profile loading
      const otherUserIds = threads.map(thread => 
        thread.participant_1 === this.currentUserId 
          ? thread.participant_2 
          : thread.participant_1
      );

      // Batch load profiles to avoid N+1 queries
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', otherUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Get all unread counts in a single optimized query
      const { data: unreadCounts, error: countsError } = await supabase
        .rpc('get_unread_counts_for_user', { user_id_param: this.currentUserId });

      if (countsError) {
        console.warn('Error fetching unread counts:', countsError);
      }

      // Create a map for fast lookup
      const unreadMap = new Map(
        (unreadCounts || []).map(count => [count.thread_id, Number(count.unread_count)])
      );

      const threadsWithProfiles = threads.map((thread) => {
        const otherUserId = thread.participant_1 === this.currentUserId 
          ? thread.participant_2 
          : thread.participant_1;
        
        const profile = profilesMap.get(otherUserId);

        return {
          ...thread,
          other_user: profile || { id: otherUserId, full_name: 'Unknown User' },
          unread_count: unreadMap.get(thread.id) || 0
        };
      });

      return threadsWithProfiles;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }

  // Mark thread as read efficiently using database function
  async markThreadAsRead(threadId: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    try {
      const { error } = await supabase
        .rpc('mark_thread_messages_read', { 
          thread_id_param: threadId, 
          user_id_param: this.currentUserId 
        });

      if (error) {
        console.warn('Error marking thread as read:', error);
      }
    } catch (error) {
      console.error('Failed to mark thread as read:', error);
    }
  }

  async getMessages(threadId: string, page = 0, limit = 50): Promise<DirectMessage[]> {
    if (!this.currentUserId || !this.userKeyPair) throw new Error('Not authenticated or encryption not initialized');

    // First get the thread to find participants
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .select('participant_1, participant_2')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) throw new Error('Thread not found');

    // Get the other participant's public key
    const otherUserId = thread.participant_1 === this.currentUserId 
      ? thread.participant_2 
      : thread.participant_1;

    const { data: otherUserProfile } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', otherUserId)
      .single();

    if (!otherUserProfile?.public_key) {
      throw new Error('Other user public key not found');
    }

    // Get messages for this thread (between the two participants)
    const { data: encryptedMessages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${thread.participant_1},recipient_id.eq.${thread.participant_2}),and(sender_id.eq.${thread.participant_2},recipient_id.eq.${thread.participant_1})`)
      .order('created_at', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    // Decrypt messages
    const otherUserPublicKey = decodeKey(otherUserProfile.public_key);
    const decryptedMessages = await MessageDecryption.batchDecryptMessages(
      encryptedMessages || [],
      this.userKeyPair.secretKey,
      otherUserPublicKey,
      this.currentUserId
    );

    // Mark messages as read using optimized function
    if (encryptedMessages && encryptedMessages.length > 0) {
      const hasUnreadMessages = encryptedMessages.some(
        msg => msg.recipient_id === this.currentUserId && !msg.read_at
      );
      
      if (hasUnreadMessages) {
        await this.markThreadAsRead(threadId);
      }
    }

    return decryptedMessages;
  }

  async sendMessage(recipientId: string, content: string): Promise<DirectMessage> {
    if (!this.currentUserId || !this.userKeyPair) throw new Error('Not authenticated or encryption not initialized');

    // Validate and sanitize content
    if (!SecureStorage.validateMessageContent(content)) {
      throw new Error('Invalid message content');
    }
    const sanitizedContent = SecureStorage.sanitizeMessageContent(content);

    // Rate limiting check
    if (!this.checkRateLimit(this.currentUserId)) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }

    // Get recipient's public key
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', recipientId)
      .single();

    if (!recipientProfile?.public_key) {
      throw new Error('Recipient public key not found');
    }

    // Find or create thread
    let threadId = await this.findOrCreateThread(recipientId);

    // Encrypt message
    const { encrypted, nonce } = encryptMessage(
      sanitizedContent,
      decodeKey(recipientProfile.public_key),
      this.userKeyPair.secretKey
    );

    // Insert encrypted message
    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({
        content: encrypted,
        sender_id: this.currentUserId,
        recipient_id: recipientId,
        media_url: nonce, // Store nonce as string
        message_type: 'text'
      })
      .select()
      .single();

    if (error) throw error;

    // Update thread
    await supabase
      .from('message_threads')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_id: message.id
      })
      .eq('id', threadId);

    return { ...message, content: sanitizedContent }; // Return with decrypted content
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userKey = `${userId}_${Math.floor(now / 60000)}`; // Per minute window
    const currentCount = this.rateLimiter.get(userKey) || 0;
    
    if (currentCount >= this.MESSAGE_RATE_LIMIT) {
      return false;
    }
    
    this.rateLimiter.set(userKey, currentCount + 1);
    
    // Clean up old entries
    for (const [key] of this.rateLimiter) {
      const keyTime = parseInt(key.split('_')[1]);
      if (now - keyTime * 60000 > 120000) { // Keep 2 minutes of history
        this.rateLimiter.delete(key);
      }
    }
    
    return true;
  }

  private async findOrCreateThread(recipientId: string): Promise<string> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    // Try to find existing thread
    const { data: existingThread } = await supabase
      .from('message_threads')
      .select('id')
      .or(`and(participant_1.eq.${this.currentUserId},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${this.currentUserId})`)
      .single();

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

  subscribeToMessages(threadId: string, onMessage: (message: DirectMessage) => void) {
    if (!this.currentUserId || !this.userKeyPair) {
      console.error('Cannot subscribe to messages: not authenticated or encryption not initialized');
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
          
          // Check if this message belongs to the current thread
          if (!this.isMessageForThread(encryptedMessage, threadId)) {
            return;
          }
          
          // Skip if it's our own message (already decrypted)
          if (encryptedMessage.sender_id === this.currentUserId) {
            onMessage(encryptedMessage);
            return;
          }
          
          // Decrypt the message
          try {
            const senderProfile = await this.getUserProfile(encryptedMessage.sender_id);
            if (senderProfile?.public_key && this.userKeyPair) {
              const decryptedMessage = await MessageDecryption.decryptSingleMessage(
                encryptedMessage,
                this.userKeyPair.secretKey,
                decodeKey(senderProfile.public_key)
              );
              onMessage(decryptedMessage);
            } else {
              onMessage({
                ...encryptedMessage,
                content: '[Message could not be decrypted]',
                decrypted: false
              });
            }
          } catch (error) {
            console.error('Failed to decrypt real-time message:', error);
            onMessage({
              ...encryptedMessage,
              content: '[Message could not be decrypted]',
              decrypted: false
            });
          }
        }
      )
      .subscribe();
  }

  private async isMessageForThread(message: any, threadId: string): Promise<boolean> {
    // Get thread participants
    const { data: thread } = await supabase
      .from('message_threads')
      .select('participant_1, participant_2')
      .eq('id', threadId)
      .single();
    
    if (!thread) return false;
    
    // Check if message is between the thread participants
    return (
      (message.sender_id === thread.participant_1 && message.recipient_id === thread.participant_2) ||
      (message.sender_id === thread.participant_2 && message.recipient_id === thread.participant_1)
    );
  }

  private async getUserProfile(userId: string): Promise<{ public_key: string } | null> {
    const { data } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', userId)
      .single();
    
    return data;
  }

  async clearUserData(userId: string): Promise<void> {
    await SecureStorage.clearKeys(userId);
    this.currentUserId = null;
    this.userKeyPair = null;
    this.rateLimiter.clear();
  }
}