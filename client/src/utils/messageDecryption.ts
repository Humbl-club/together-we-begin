import { decryptMessage, decodeKey } from './encryption';

export interface DecryptedMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at?: string;
  decrypted: boolean;
  decryptionError?: string;
}

export class MessageDecryption {
  // Decrypt a single message
  static async decryptSingleMessage(
    encryptedMessage: any,
    userPrivateKey: Uint8Array,
    senderPublicKey: Uint8Array
  ): Promise<DecryptedMessage> {
    try {
      const decryptedContent = decryptMessage(
        encryptedMessage.content,
        encryptedMessage.media_url, // nonce stored in media_url
        senderPublicKey,
        userPrivateKey
      );
      
      return {
        ...encryptedMessage,
        content: decryptedContent,
        decrypted: true
      };
    } catch (error) {
      console.warn('Failed to decrypt message:', encryptedMessage.id, error);
      return {
        ...encryptedMessage,
        content: '[Message could not be decrypted]',
        decrypted: false,
        decryptionError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Batch decrypt multiple messages
  static async batchDecryptMessages(
    encryptedMessages: any[],
    userPrivateKey: Uint8Array,
    otherUserPublicKey: Uint8Array,
    currentUserId: string
  ): Promise<DecryptedMessage[]> {
    const decryptionPromises = encryptedMessages.map(async (message) => {
      // Determine which public key to use based on sender
      const senderPublicKey = message.sender_id === currentUserId 
        ? userPrivateKey // We encrypted with our private key, so we need the other's public key
        : otherUserPublicKey;
      
      return this.decryptSingleMessage(message, userPrivateKey, otherUserPublicKey);
    });
    
    return Promise.all(decryptionPromises);
  }
}