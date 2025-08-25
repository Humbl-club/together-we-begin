// Web Worker for handling encryption/decryption operations
// This prevents UI blocking during message processing

import { encryptMessage, decryptMessage, generateKeyPair, encodeKey, decodeKey } from '../utils/encryption';
import { MessageDecryption } from '../utils/messageDecryption';

export interface EncryptionWorkerMessage {
  id: string;
  type: 'encrypt' | 'decrypt' | 'batchDecrypt' | 'generateKeys';
  payload: any;
}

export interface EncryptionWorkerResponse {
  id: string;
  type: 'success' | 'error';
  result?: any;
  error?: string;
}

// Cache for user keys to avoid repeated key processing
const keyCache = new Map<string, { publicKey: Uint8Array; secretKey: Uint8Array }>();

self.addEventListener('message', async (event: MessageEvent<EncryptionWorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'encrypt':
        const { content, recipientPublicKey, userPrivateKey } = payload;
        const recipientKey = typeof recipientPublicKey === 'string' ? decodeKey(recipientPublicKey) : recipientPublicKey;
        const userKey = typeof userPrivateKey === 'string' ? decodeKey(userPrivateKey) : userPrivateKey;
        result = encryptMessage(content, recipientKey, userKey);
        break;
        
      case 'decrypt':
        const { encryptedContent, nonce, senderPublicKey, userPrivateKey: userPrivKey } = payload;
        const senderKey = typeof senderPublicKey === 'string' ? decodeKey(senderPublicKey) : senderPublicKey;
        const userPrivateKeyDecoded = typeof userPrivKey === 'string' ? decodeKey(userPrivKey) : userPrivKey;
        result = decryptMessage(encryptedContent, nonce, senderKey, userPrivateKeyDecoded);
        break;
        
      case 'batchDecrypt':
        const { messages, userPrivateKey: batchUserPrivKey, otherUserPublicKey, currentUserId } = payload;
        const batchUserKey = typeof batchUserPrivKey === 'string' ? decodeKey(batchUserPrivKey) : batchUserPrivKey;
        const otherKey = typeof otherUserPublicKey === 'string' ? decodeKey(otherUserPublicKey) : otherUserPublicKey;
        
        // Process messages in chunks to avoid blocking
        const CHUNK_SIZE = 10;
        const chunks = [];
        for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
          chunks.push(messages.slice(i, i + CHUNK_SIZE));
        }
        
        const decryptedMessages = [];
        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map(async (message: any) => {
              try {
                return await MessageDecryption.decryptSingleMessage(
                  message,
                  batchUserKey,
                  otherKey
                );
              } catch (error) {
                console.warn('Failed to decrypt message in worker:', message.id, error);
                return {
                  ...message,
                  content: '[Message could not be decrypted]',
                  decrypted: false,
                  decryptionError: error instanceof Error ? error.message : 'Unknown error'
                };
              }
            })
          );
          decryptedMessages.push(...chunkResults);
          
          // Yield control to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        result = decryptedMessages;
        break;
        
      case 'generateKeys':
        result = generateKeyPair();
        // Encode for storage
        result = {
          publicKey: encodeKey(result.publicKey),
          secretKey: encodeKey(result.secretKey)
        };
        break;
        
      default:
        throw new Error(`Unknown encryption operation: ${type}`);
    }
    
    const response: EncryptionWorkerResponse = {
      id,
      type: 'success',
      result
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: EncryptionWorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(response);
  }
});

export {}; // Make this a module