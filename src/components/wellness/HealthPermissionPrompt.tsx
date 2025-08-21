import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ReliableHealthService } from '@/services/native/ReliableHealthService';
import { useToast } from '@/hooks/use-toast';

interface HealthPermissionPromptProps {
  onConnected?: () => void;
}

const HealthPermissionPrompt: React.FC<HealthPermissionPromptProps> = ({ onConnected }) => {
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAvailability = async () => {
      const isAvailable = await ReliableHealthService.isHealthAppAvailable();
      setAvailable(isAvailable);
    };
    checkAvailability();
  }, []);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const success = await ReliableHealthService.requestHealthAppPermissions();
      if (success) {
        toast({
          title: "Success!",
          description: "Health app connected successfully"
        });
        onConnected?.();
      } else {
        toast({
          title: "Connection failed",
          description: "Health app integration is temporarily unavailable",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Health connection error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to health app",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  }, [toast, onConnected]);

  if (!available) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span>Connect Health App</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your health app to automatically sync your steps and improve tracking accuracy.
        </p>
        <Button 
          onClick={handleConnect} 
          disabled={connecting}
          className="w-full"
        >
          {connecting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full" />
              <span>Connecting...</span>
            </div>
          ) : (
            'Connect Health App'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HealthPermissionPrompt;