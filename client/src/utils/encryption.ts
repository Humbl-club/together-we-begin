import { box, randomBytes, secretbox } from 'tweetnacl';
import * as nacl_util from 'tweetnacl-util';

// Generate a key pair for encryption
export const generateKeyPair = () => {
  return box.keyPair();
};

// Generate a new random key for symmetric encryption
export const generateSecretKey = () => {
  return randomBytes(secretbox.keyLength);
};

// Encrypt a message using the recipient's public key and sender's private key
export const encryptMessage = (message: string, recipientPublicKey: Uint8Array, senderPrivateKey: Uint8Array) => {
  const nonce = randomBytes(box.nonceLength);
  const messageBytes = nacl_util.decodeUTF8(message);
  const encryptedBytes = box(messageBytes, nonce, recipientPublicKey, senderPrivateKey);
  
  if (!encryptedBytes) {
    throw new Error('Encryption failed');
  }
  
  return {
    encrypted: nacl_util.encodeBase64(encryptedBytes),
    nonce: nacl_util.encodeBase64(nonce)
  };
};

// Decrypt a message using the sender's public key and recipient's private key
export const decryptMessage = (encryptedMessage: string, nonce: string, senderPublicKey: Uint8Array, recipientPrivateKey: Uint8Array) => {
  try {
    const encryptedBytes = nacl_util.decodeBase64(encryptedMessage);
    const nonceBytes = nacl_util.decodeBase64(nonce);
    const decryptedBytes = box.open(encryptedBytes, nonceBytes, senderPublicKey, recipientPrivateKey);
    
    if (!decryptedBytes) {
      throw new Error('Decryption failed');
    }
    
    return nacl_util.encodeUTF8(decryptedBytes);
  } catch (error) {
    throw new Error('Failed to decrypt message');
  }
};

// Utility functions for key management
export const encodeKey = (key: Uint8Array): string => {
  return nacl_util.encodeBase64(key);
};

export const decodeKey = (encodedKey: string): Uint8Array => {
  return nacl_util.decodeBase64(encodedKey);
};

// Generate a unique thread ID for two users
export const generateThreadId = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
};