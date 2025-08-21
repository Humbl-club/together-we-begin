import { supabase } from '@/integrations/supabase/client';
import { generateKeyPair, encryptMessage, decryptMessage, encodeKey, decodeKey } from '@/utils/encryption';
import { DirectMessage } from './MessagingService';

export class MobileEncryptionService {
  private userKeyPair: { publicKey: Uint8Array; secretKey: Uint8Array } | null = null;
  private profileCache = new Map<string, { public_key: string }>();

  async initialize(userId: string): Promise<void> {
    try {
      // Check if user has stored keys
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

        // Store private key in secure storage (browser secure storage)
        await this.storePrivateKeySecurely(userId, keyPair.secretKey);
      } else {
        // Load existing keys
        const privateKey = await this.retrievePrivateKeySecurely(userId);
        if (privateKey) {
          this.userKeyPair = {
            publicKey: decodeKey(profile.public_key),
            secretKey: privateKey
          };
        }
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  private async storePrivateKeySecurely(userId: string, privateKey: Uint8Array): Promise<void> {
    try {
      // For mobile compatibility, use localStorage with base64 encoding
      // In a real production app, you'd use Capacitor's secure storage
      const encoded = encodeKey(privateKey);
      localStorage.setItem(`enc_key_${userId}`, encoded);
    } catch (error) {
      console.error('Failed to store private key:', error);
      throw error;
    }
  }

  private async retrievePrivateKeySecurely(userId: string): Promise<Uint8Array | null> {
    try {
      const stored = localStorage.getItem(`enc_key_${userId}`);
      if (!stored) return null;
      return decodeKey(stored);
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  async encryptMessage(content: string, recipientId: string): Promise<{ encrypted: string; nonce: string }> {
    if (!this.userKeyPair) {
      throw new Error('Encryption not initialized');
    }

    // Get recipient's public key
    const recipientProfile = await this.getRecipientProfile(recipientId);
    if (!recipientProfile?.public_key) {
      throw new Error('Recipient public key not found');
    }

    try {
      const result = encryptMessage(
        content,
        decodeKey(recipientProfile.public_key),
        this.userKeyPair.secretKey
      );
      
      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  async decryptSingleMessage(encryptedMessage: any, senderUserId: string): Promise<DirectMessage> {
    if (!this.userKeyPair) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Get sender's public key
      const senderProfile = await this.getRecipientProfile(senderUserId);
      if (!senderProfile?.public_key) {
        return {
          ...encryptedMessage,
          content: '[Message could not be decrypted - missing key]'
        };
      }

      const decryptedContent = decryptMessage(
        encryptedMessage.content,
        encryptedMessage.media_url, // nonce
        decodeKey(senderProfile.public_key),
        this.userKeyPair.secretKey
      );

      return {
        ...encryptedMessage,
        content: decryptedContent
      };
    } catch (error) {
      console.warn('Failed to decrypt message:', error);
      return {
        ...encryptedMessage,
        content: '[Message could not be decrypted]'
      };
    }
  }

  async decryptMessages(encryptedMessages: any[], otherUserId: string, currentUserId: string): Promise<DirectMessage[]> {
    if (!this.userKeyPair) {
      throw new Error('Encryption not initialized');
    }

    // Get other user's public key
    const otherUserProfile = await this.getRecipientProfile(otherUserId);
    if (!otherUserProfile?.public_key) {
      throw new Error('Other user public key not found');
    }

    const otherUserPublicKey = decodeKey(otherUserProfile.public_key);
    const decryptedMessages: DirectMessage[] = [];

    // Process messages in batches to avoid blocking the main thread
    const batchSize = 10;
    for (let i = 0; i < encryptedMessages.length; i += batchSize) {
      const batch = encryptedMessages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (message) => {
        try {
          // Determine sender's public key
          const senderPublicKey = message.sender_id === currentUserId 
            ? this.userKeyPair!.publicKey // Our own message
            : otherUserPublicKey; // Other user's message

          const decryptedContent = decryptMessage(
            message.content,
            message.media_url, // nonce
            otherUserPublicKey, // Always decrypt with other user's public key
            this.userKeyPair!.secretKey
          );

          return {
            ...message,
            content: decryptedContent
          };
        } catch (error) {
          console.warn('Failed to decrypt message:', message.id, error);
          return {
            ...message,
            content: '[Message could not be decrypted]'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      decryptedMessages.push(...batchResults);

      // Yield control to prevent blocking
      if (i + batchSize < encryptedMessages.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return decryptedMessages;
  }

  private async getRecipientProfile(userId: string): Promise<{ public_key: string } | null> {
    // Check cache first
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('public_key')
        .eq('id', userId)
        .single();

      if (profile) {
        this.profileCache.set(userId, profile);
      }

      return profile;
    } catch (error) {
      console.error('Failed to get recipient profile:', error);
      return null;
    }
  }

  async clearKeys(userId: string): Promise<void> {
    try {
      localStorage.removeItem(`enc_key_${userId}`);
      this.userKeyPair = null;
      this.profileCache.clear();
    } catch (error) {
      console.error('Failed to clear keys:', error);
    }
  }
}