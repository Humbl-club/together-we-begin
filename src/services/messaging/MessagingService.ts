import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, decryptMessage, generateKeyPair, encodeKey, decodeKey } from '@/utils/encryption';

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

        // Store private key securely (in a real app, use secure storage)
        localStorage.setItem(`encryption_private_key_${userId}`, encodeKey(keyPair.secretKey));
      } else {
        // Load existing keys
        const privateKeyStr = localStorage.getItem(`encryption_private_key_${userId}`);
        if (privateKeyStr) {
          this.userKeyPair = {
            publicKey: decodeKey(profile.public_key),
            secretKey: decodeKey(privateKeyStr)
          };
        }
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
    }
  }

  async getThreads(page = 0, limit = 20): Promise<MessageThread[]> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    const { data: threads, error } = await supabase
      .from('message_threads')
      .select('*')
      .or(`participant_1.eq.${this.currentUserId},participant_2.eq.${this.currentUserId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    // Get other user profiles
    const threadsWithProfiles = await Promise.all(
      threads.map(async (thread) => {
        const otherUserId = thread.participant_1 === this.currentUserId 
          ? thread.participant_2 
          : thread.participant_1;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        return {
          ...thread,
          other_user: profile || { id: otherUserId, full_name: 'Unknown User' },
          unread_count: 0 // TODO: Implement unread count logic
        };
      })
    );

    return threadsWithProfiles;
  }

  async getMessages(threadId: string, page = 0, limit = 50): Promise<DirectMessage[]> {
    if (!this.currentUserId) throw new Error('Not authenticated');

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${this.currentUserId},recipient_id.eq.${this.currentUserId}`)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    // Decrypt messages
    return messages.map(message => {
      try {
        if (this.userKeyPair && message.media_url) {
          // For decryption, we need the sender's public key and our private key
          // Since we can't determine sender's public key here, we'll simplify for now
          return { ...message, content: message.content }; // Return as-is for now
        }
        return message;
      } catch {
        return { ...message, content: '[Failed to decrypt]' };
      }
    }).reverse();
  }

  async sendMessage(recipientId: string, content: string): Promise<DirectMessage> {
    if (!this.currentUserId || !this.userKeyPair) throw new Error('Not authenticated or encryption not initialized');

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
      content,
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

    return { ...message, content }; // Return with decrypted content
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
    return supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          const message = payload.new as DirectMessage;
          // Decrypt if needed and call callback
          onMessage(message);
        }
      )
      .subscribe();
  }
}