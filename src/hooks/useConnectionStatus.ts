import { useState, useEffect } from 'react';
import ConnectionService from '@/services/ConnectionService';

interface ConnectionStatus {
  isOnline: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  checkConnection: () => Promise<boolean>;
  retryConnection: () => Promise<boolean>;
}

export const useConnectionStatus = (): ConnectionStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const connectionService = ConnectionService.getInstance();
    
    const unsubscribe = connectionService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setConnectionStatus(status.connectionStatus as 'connected' | 'disconnected' | 'checking');
    });

    return unsubscribe;
  }, []);

  const checkConnection = async () => {
    const connectionService = ConnectionService.getInstance();
    return connectionService.checkConnection();
  };

  const retryConnection = async () => {
    const connectionService = ConnectionService.getInstance();
    return connectionService.retryConnection();
  };

  return {
    isOnline,
    connectionStatus,
    checkConnection,
    retryConnection
  };
};