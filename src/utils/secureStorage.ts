// Enhanced secure storage utilities for encryption keys with Web Crypto API
export class SecureStorage {
  private static readonly STORAGE_KEY_PREFIX = 'secure_messaging_';
  private static readonly KEY_DERIVATION_ITERATIONS = 100000;
  
  // Derive encryption key from user password/PIN using PBKDF2
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.KEY_DERIVATION_ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  // Generate random salt for key derivation
  private static generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }
  
  // Store encryption key using Web Crypto API with password-based encryption
  static async storePrivateKey(userId: string, privateKey: Uint8Array, userPassword?: string): Promise<void> {
    try {
      if (window.crypto && window.crypto.subtle && userPassword) {
        // Generate salt for this user
        const salt = this.generateSalt();
        
        // Derive encryption key from user password
        const derivedKey = await this.deriveKey(userPassword, salt);
        
        // Generate IV for AES-GCM
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the private key
        const encryptedKey = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          derivedKey,
          privateKey
        );
        
        // Store encrypted key with salt and IV
        const storageData = {
          encryptedKey: Array.from(new Uint8Array(encryptedKey)),
          salt: Array.from(salt),
          iv: Array.from(iv),
          timestamp: Date.now()
        };
        
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`, JSON.stringify(storageData));
      } else {
        // Fallback: Store with basic obfuscation (not secure, but better than plain text)
        const obfuscated = Array.from(privateKey).map(byte => byte ^ 0xAA);
        const storageData = {
          obfuscatedKey: obfuscated,
          timestamp: Date.now(),
          insecure: true
        };
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`, JSON.stringify(storageData));
        console.warn('Storing private key with basic obfuscation. Use password-based encryption for production.');
      }
    } catch (error) {
      console.error('Failed to store private key:', error);
      throw new Error('Failed to securely store encryption key');
    }
  }
  
  // Retrieve private key with password-based decryption
  static async retrievePrivateKey(userId: string, userPassword?: string): Promise<Uint8Array | null> {
    try {
      const storedData = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`);
      if (!storedData) return null;
      
      const parsedData = JSON.parse(storedData);
      
      if (parsedData.insecure) {
        // Handle fallback obfuscated storage
        const deobfuscated = parsedData.obfuscatedKey.map((byte: number) => byte ^ 0xAA);
        return new Uint8Array(deobfuscated);
      }
      
      if (!userPassword || !window.crypto || !window.crypto.subtle) {
        console.error('Password required for encrypted private key retrieval');
        return null;
      }
      
      // Reconstruct salt and IV
      const salt = new Uint8Array(parsedData.salt);
      const iv = new Uint8Array(parsedData.iv);
      const encryptedKey = new Uint8Array(parsedData.encryptedKey);
      
      // Derive the same key using the password and salt
      const derivedKey = await this.deriveKey(userPassword, salt);
      
      // Decrypt the private key
      const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encryptedKey
      );
      
      return new Uint8Array(decryptedKeyBuffer);
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }
  
  // Check if password is required for key retrieval
  static requiresPassword(userId: string): boolean {
    try {
      const storedData = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`);
      if (!storedData) return false;
      
      const parsedData = JSON.parse(storedData);
      return !parsedData.insecure;
    } catch {
      return false;
    }
  }
  
  // Clear stored keys (for logout)
  static async clearKeys(userId: string): Promise<void> {
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`);
  }
  
  // Validate message content
  static validateMessageContent(content: string): boolean {
    if (!content || content.trim().length === 0) return false;
    if (content.length > 4000) return false; // Reasonable message limit
    
    // Basic content validation - no script tags, etc.
    const forbiddenPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
    return !forbiddenPatterns.some(pattern => pattern.test(content));
  }
  
  // Sanitize message content
  static sanitizeMessageContent(content: string): string {
    return content
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .substring(0, 4000); // Truncate if too long
  }
}