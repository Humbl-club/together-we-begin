import { useState, useEffect, useCallback } from 'react';
import { generateKeyPair, encodeKey, decodeKey } from '@/utils/encryption';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export const useEncryption = (userId: string) => {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate or retrieve key pair from localStorage
  useEffect(() => {
    const initializeKeys = async () => {
      setIsLoading(true);
      
      try {
        const storedKeys = localStorage.getItem(`encryption_keys_${userId}`);
        
        if (storedKeys) {
          // Use existing keys
          const parsedKeys = JSON.parse(storedKeys);
          setKeyPair(parsedKeys);
        } else {
          // Generate new keys
          const newKeyPair = generateKeyPair();
          const keyPairData = {
            publicKey: encodeKey(newKeyPair.publicKey),
            privateKey: encodeKey(newKeyPair.secretKey)
          };
          
          // Store in localStorage
          localStorage.setItem(`encryption_keys_${userId}`, JSON.stringify(keyPairData));
          setKeyPair(keyPairData);
        }
      } catch (error) {
        console.error('Failed to initialize encryption keys:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      initializeKeys();
    }
  }, [userId]);

  // Get public key as Uint8Array
  const getPublicKey = useCallback(() => {
    if (!keyPair) return null;
    return decodeKey(keyPair.publicKey);
  }, [keyPair]);

  // Get private key as Uint8Array
  const getPrivateKey = useCallback(() => {
    if (!keyPair) return null;
    return decodeKey(keyPair.privateKey);
  }, [keyPair]);

  // Clear keys (for logout)
  const clearKeys = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`encryption_keys_${userId}`);
      setKeyPair(null);
    }
  }, [userId]);

  return {
    keyPair,
    isLoading,
    getPublicKey,
    getPrivateKey,
    clearKeys
  };
};