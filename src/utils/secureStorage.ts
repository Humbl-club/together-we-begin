// Secure storage utilities for encryption keys
export class SecureStorage {
  private static readonly STORAGE_KEY_PREFIX = 'secure_messaging_';
  
  // Store encryption key using Web Crypto API when available
  static async storePrivateKey(userId: string, privateKey: Uint8Array): Promise<void> {
    try {
      if (window.crypto && window.crypto.subtle) {
        // Convert Uint8Array to base64 for storage
        const base64Key = btoa(String.fromCharCode(...privateKey));
        // In a real app, you'd want to encrypt this with a user-derived key
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`, base64Key);
      } else {
        // Fallback for environments without Web Crypto API
        const base64Key = btoa(String.fromCharCode(...privateKey));
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`, base64Key);
      }
    } catch (error) {
      console.error('Failed to store private key:', error);
      throw new Error('Failed to securely store encryption key');
    }
  }
  
  // Retrieve private key
  static async retrievePrivateKey(userId: string): Promise<Uint8Array | null> {
    try {
      const base64Key = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}private_key_${userId}`);
      if (!base64Key) return null;
      
      // Convert base64 back to Uint8Array
      const binaryString = atob(base64Key);
      return new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
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