import React from 'react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className, 
  showText = false 
}) => {
  const { isOnline, connectionStatus } = useConnectionStatus();

  if (connectionStatus === 'connected') {
    return null; // Don't show anything when connected
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10'
      };
    }
    
    if (connectionStatus === 'checking') {
      return {
        icon: Loader2,
        text: 'Connecting...',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        animate: 'animate-spin'
      };
    }
    
    return {
      icon: WifiOff,
      text: 'Connection Error',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    };
  };

  const { icon: Icon, text, color, bgColor, animate } = getStatusInfo();

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium',
      bgColor,
      color,
      className
    )}>
      <Icon className={cn('w-3 h-3', animate)} />
      {showText && <span>{text}</span>}
    </div>
  );
};