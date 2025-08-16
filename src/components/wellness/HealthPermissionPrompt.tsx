import React, { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HealthIntegrationService } from '@/services/native/HealthIntegrationService';
import { HeartPulse, Activity } from 'lucide-react';

interface HealthPermissionPromptProps {
  onConnected?: () => void;
}

const HealthPermissionPrompt: React.FC<HealthPermissionPromptProps> = ({ onConnected }) => {
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await HealthIntegrationService.isAvailable();
      if (mounted) setAvailable(ok);
    })();
    return () => { mounted = false; };
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);
      const granted = await HealthIntegrationService.requestPermissions();
      if (!granted) {
        toast({ title: 'Permission required', description: 'We could not access health data. Please grant permissions in system settings.', variant: 'destructive' });
        return;
      }
      // Attempt a read to confirm
      const steps = await HealthIntegrationService.getTodaySteps();
      toast({ title: 'Health connected', description: steps != null ? `Imported ${steps} steps today.` : 'Connection successful.' });
      onConnected?.();
    } catch (e) {
      console.error('Health connect error', e);
      toast({ title: 'Connection failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  }, [onConnected, toast]);

  if (!available) return null;

  const platform = Capacitor.getPlatform();
  const label = platform === 'ios' ? 'Connect Apple Health' : 'Connect Health Connect';

  return (
    <Card className="card-secondary">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-primary" />
          Sync your steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Grant permission to securely read today’s steps from your device and sync with challenges.
        </p>
        <Button onClick={handleConnect} disabled={connecting} className="w-full">
          <Activity className="w-4 h-4 mr-2" />
          {connecting ? 'Connecting…' : label}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HealthPermissionPrompt;
