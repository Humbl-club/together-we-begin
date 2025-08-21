import { supabase } from '@/integrations/supabase/client';

class ConnectionService {
  private static instance: ConnectionService;
  private isOnline: boolean = navigator.onLine;
  private connectionStatus: 'connected' | 'disconnected' | 'checking' = 'checking';
  private listeners: ((status: { isOnline: boolean; connectionStatus: string }) => void)[] = [];

  private constructor() {
    this.setupNetworkListeners();
    this.checkConnection();
  }

  static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.checkConnection();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionStatus = 'disconnected';
      this.notifyListeners();
    });
  }

  async checkConnection(): Promise<boolean> {
    if (!this.isOnline) {
      this.connectionStatus = 'disconnected';
      this.notifyListeners();
      return false;
    }

    this.connectionStatus = 'checking';
    this.notifyListeners();

    try {
      // Quick health check with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );

      const healthCheck = supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      await Promise.race([healthCheck, timeoutPromise]);
      
      this.connectionStatus = 'connected';
      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('Connection check failed:', error);
      this.connectionStatus = 'disconnected';
      this.notifyListeners();
      return false;
    }
  }

  async retryConnection(maxRetries: number = 3): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const isConnected = await this.checkConnection();
      if (isConnected) return true;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
    return false;
  }

  subscribe(callback: (status: { isOnline: boolean; connectionStatus: string }) => void) {
    this.listeners.push(callback);
    // Immediately notify with current status
    callback({ isOnline: this.isOnline, connectionStatus: this.connectionStatus });
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    const status = { isOnline: this.isOnline, connectionStatus: this.connectionStatus };
    this.listeners.forEach(listener => listener(status));
  }

  getStatus() {
    return { isOnline: this.isOnline, connectionStatus: this.connectionStatus };
  }
}

export default ConnectionService;