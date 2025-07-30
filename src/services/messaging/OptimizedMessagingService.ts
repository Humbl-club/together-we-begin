import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, decryptMessage, generateKeyPair, encodeKey, decodeKey } from '@/utils/encryption';
import { SecureStorage } from '@/utils/secureStorage';
import { MessageDecryption } from '@/utils/messageDecryption';

import { MessageThread, DirectMessage } from './MessagingService';

export class OptimizedMessagingService {
  private static instance: OptimizedMessagingService;
  private currentUserId: string | null = null;
  private userKeyPair: { publicKey: Uint8Array; secretKey: Uint8Array } | null = null;
  private rateLimiter: Map<string, number> = new Map();
  private readonly MESSAGE_RATE_LIMIT = 30; // messages per minute
  
  // Cache for frequently accessed data
  private profileCache = new Map<string, { full_name: string; avatar_url?: string; public_key?: string }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();
  
  // Worker for encryption tasks
  private encryptionWorker: Worker | null = null;

  static getInstance(): OptimizedMessagingService {
    if (!OptimizedMessagingService.instance) {
      OptimizedMessagingService.instance = new OptimizedMessagingService();
    }
    return OptimizedMessagingService.instance;
  }

  async initialize(userId: string) {
    this.currentUserId = userId;
    await this.initializeEncryption(userId);
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      this.encryptionWorker = new Worker('/src/workers/encryptionWorker.ts', { type: 'module' });
    } catch (error) {
      console.warn('Web Worker not available, falling back to main thread encryption:', error);
    }
  }

  private async initializeEncryption(userId: string) {
    try {
      // Check if user has stored keys in profile
      const profile = await this.getCachedProfile(userId);

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
        
        // Update cache
        this.profileCache.set(userId, {
          ...profile,
          public_key: encodeKey(keyPair.publicKey)
        });
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

  private async getCachedProfile(userId: string) {
    const cached = this.profileCache.get(userId);
    const timestamp = this.cacheTimestamps.get(userId);
    
    if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      return cached;
    }

    // Fetch from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, public_key')
      .eq('id', userId)
      .single();

    if (profile) {
      this.profileCache.set(userId, profile);
      this.cacheTimestamps.set(userId, Date.now());
    }

    return profile;
  }

  async getThreads(page = 0, limit = 20): Promise<MessageThread[]> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    try {
      // Use the highly optimized single-query function
      const startTime = performance.now();
      
      const { data: threadsData, error } = await supabase
        .rpc('get_user_threads_optimized', {
          user_id_param: this.currentUserId,
          page_limit: limit,
          page_offset: page * limit
        });

      const queryTime = performance.now() - startTime;
      console.log(`Thread loading took ${queryTime.toFixed(2)}ms`);

      if (error) {
        console.error('Error in optimized threads query:', error);
        throw error;
      }

      // Transform and cache profile data
      const threads = (threadsData || []).map((row: any) => {
        // Cache the profile data we received
        if (row.other_user_id && row.other_user_name) {
          this.profileCache.set(row.other_user_id, {
            full_name: row.other_user_name,
            avatar_url: row.other_user_avatar
          });
          this.cacheTimestamps.set(row.other_user_id, Date.now());
        }

        return {
          id: row.thread_id,
          participant_1: row.participant_1,
          participant_2: row.participant_2,
          last_message_at: row.last_message_at,
          last_message_id: row.last_message_id,
          other_user: {
            id: row.other_user_id,
            full_name: row.other_user_name,
            avatar_url: row.other_user_avatar
          },
          unread_count: Number(row.unread_count) || 0
        };
      });

      return threads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }

  // Optimized mark as read with batching
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

    const startTime = performance.now();

    // Get thread participants using index-optimized query
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .select('participant_1, participant_2')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) throw new Error('Thread not found');

    const otherUserId = thread.participant_1 === this.currentUserId 
      ? thread.participant_2 
      : thread.participant_1;

    // Get other user's profile from cache first
    let otherUserProfile = await this.getCachedProfile(otherUserId);
    
    if (!otherUserProfile?.public_key) {
      throw new Error('Other user public key not found');
    }

    // Optimized message query using new indexes
    const { data: encryptedMessages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${thread.participant_1},recipient_id.eq.${thread.participant_2}),and(sender_id.eq.${thread.participant_2},recipient_id.eq.${thread.participant_1})`)
      .order('created_at', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    const dbTime = performance.now() - startTime;
    console.log(`Message DB query took ${dbTime.toFixed(2)}ms`);

    if (!encryptedMessages || encryptedMessages.length === 0) {
      return [];
    }

    // Use Web Worker for decryption if available
    const decryptionStartTime = performance.now();
    
    const otherUserPublicKey = decodeKey(otherUserProfile.public_key);
    
    let decryptedMessages: DirectMessage[];
    
    if (this.encryptionWorker && encryptedMessages.length > 5) {
      // Use Web Worker for larger batches
      try {
        decryptedMessages = await this.batchDecryptWithWorker(
          encryptedMessages,
          this.userKeyPair.secretKey,
          otherUserPublicKey,
          this.currentUserId
        );
      } catch (error) {
        console.warn('Worker decryption failed, falling back to main thread:', error);
        decryptedMessages = await MessageDecryption.batchDecryptMessages(
          encryptedMessages,
          this.userKeyPair.secretKey,
          otherUserPublicKey,
          this.currentUserId
        );
      }
    } else {
      // Use main thread for small batches or if worker unavailable
      decryptedMessages = await MessageDecryption.batchDecryptMessages(
        encryptedMessages,
        this.userKeyPair.secretKey,
        otherUserPublicKey,
        this.currentUserId
      );
    }

    const decryptionTime = performance.now() - decryptionStartTime;
    console.log(`Message decryption took ${decryptionTime.toFixed(2)}ms for ${encryptedMessages.length} messages`);

    // Mark messages as read efficiently
    const hasUnreadMessages = encryptedMessages.some(
      msg => msg.recipient_id === this.currentUserId && !msg.read_at
    );
    
    if (hasUnreadMessages) {
      // Do this asynchronously to not block the UI
      setTimeout(() => this.markThreadAsRead(threadId), 100);
    }

    const totalTime = performance.now() - startTime;
    console.log(`Total message loading took ${totalTime.toFixed(2)}ms`);

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

    // Get recipient's public key from cache
    const recipientProfile = await this.getCachedProfile(recipientId);
    
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

    // Update thread asynchronously
    (async () => {
      try {
        await supabase
          .from('message_threads')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_id: message.id
          })
          .eq('id', threadId);
        console.log('Thread updated successfully');
      } catch (error) {
        console.warn('Failed to update thread:', error);
      }
    })();

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

  async findOrCreateThread(recipientId: string): Promise<string> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    // Try to find existing thread using optimized query
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

  private async batchDecryptWithWorker(
    messages: any[],
    userPrivateKey: Uint8Array,
    otherUserPublicKey: Uint8Array,
    currentUserId: string
  ): Promise<DirectMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.encryptionWorker) {
        reject(new Error('Worker not available'));
        return;
      }

      const requestId = Math.random().toString(36).substr(2, 9);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.requestId === requestId) {
          this.encryptionWorker!.removeEventListener('message', handleMessage);
          
          if (event.data.type === 'success') {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };

      this.encryptionWorker.addEventListener('message', handleMessage);
      
      this.encryptionWorker.postMessage({
        type: 'batchDecrypt',
        requestId,
        payload: {
          messages,
          userPrivateKey: Array.from(userPrivateKey),
          otherUserPublicKey: Array.from(otherUserPublicKey),
          currentUserId
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        this.encryptionWorker!.removeEventListener('message', handleMessage);
        reject(new Error('Worker timeout'));
      }, 10000);
    });
  }

  async clearUserData(userId: string): Promise<void> {
    await SecureStorage.clearKeys(userId);
    this.currentUserId = null;
    this.userKeyPair = null;
    this.rateLimiter.clear();
    this.profileCache.clear();
    this.cacheTimestamps.clear();
    
    if (this.encryptionWorker) {
      this.encryptionWorker.terminate();
      this.encryptionWorker = null;
    }
  }

  // Get cache stats for debugging
  getCacheStats() {
    return {
      profileCacheSize: this.profileCache.size,
      rateLimiterSize: this.rateLimiter.size,
      cacheTimestamps: this.cacheTimestamps.size
    };
  }
}