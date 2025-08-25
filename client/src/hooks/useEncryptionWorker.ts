import { useCallback, useRef, useEffect } from 'react';
import type { EncryptionWorkerMessage, EncryptionWorkerResponse } from '../workers/encryptionWorker';

export const useEncryptionWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>>(new Map());
  
  useEffect(() => {
    // Initialize worker
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(new URL('../workers/encryptionWorker.ts', import.meta.url), {
          type: 'module'
        });
        
        workerRef.current.addEventListener('message', (event: MessageEvent<EncryptionWorkerResponse>) => {
          const { id, type, result, error } = event.data;
          const request = pendingRequests.current.get(id);
          
          if (request) {
            pendingRequests.current.delete(id);
            
            if (type === 'success') {
              request.resolve(result);
            } else {
              request.reject(new Error(error || 'Encryption operation failed'));
            }
          }
        });
        
        workerRef.current.addEventListener('error', (error) => {
          console.error('Encryption worker error:', error);
          // Reject all pending requests
          for (const [id, request] of pendingRequests.current.entries()) {
            request.reject(new Error('Worker encountered an error'));
            pendingRequests.current.delete(id);
          }
        });
      } catch (error) {
        console.warn('Failed to initialize encryption worker:', error);
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequests.current.clear();
    };
  }, []);
  
  const postMessage = useCallback(async <T>(type: string, payload: any): Promise<T> => {
    if (!workerRef.current) {
      throw new Error('Encryption worker not available');
    }
    
    const id = `${Date.now()}_${Math.random()}`;
    
    return new Promise((resolve, reject) => {
      pendingRequests.current.set(id, { resolve, reject });
      
      const message: EncryptionWorkerMessage = {
        id,
        type: type as any,
        payload
      };
      
      workerRef.current!.postMessage(message);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Encryption operation timed out'));
        }
      }, 30000);
    });
  }, []);
  
  const encryptMessage = useCallback(async (
    content: string,
    recipientPublicKey: Uint8Array | string,
    userPrivateKey: Uint8Array | string
  ) => {
    return postMessage('encrypt', {
      content,
      recipientPublicKey,
      userPrivateKey
    });
  }, [postMessage]);
  
  const decryptMessage = useCallback(async (
    encryptedContent: string,
    nonce: string,
    senderPublicKey: Uint8Array | string,
    userPrivateKey: Uint8Array | string
  ) => {
    return postMessage('decrypt', {
      encryptedContent,
      nonce,
      senderPublicKey,
      userPrivateKey
    });
  }, [postMessage]);
  
  const batchDecryptMessages = useCallback(async (
    messages: any[],
    userPrivateKey: Uint8Array | string,
    otherUserPublicKey: Uint8Array | string,
    currentUserId: string
  ) => {
    return postMessage('batchDecrypt', {
      messages,
      userPrivateKey,
      otherUserPublicKey,
      currentUserId
    });
  }, [postMessage]);
  
  const generateKeyPair = useCallback(async () => {
    return postMessage('generateKeys', {});
  }, [postMessage]);
  
  const isWorkerAvailable = workerRef.current !== null;
  
  return {
    encryptMessage,
    decryptMessage,
    batchDecryptMessages,
    generateKeyPair,
    isWorkerAvailable
  };
};