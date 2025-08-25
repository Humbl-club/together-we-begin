import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Smartphone, Heart, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { ReliableHealthService, HealthDataSource } from '@/services/native/ReliableHealthService';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StepDataSourceSelectorProps {
  onSourceChange?: (source: 'motion' | 'health_app' | 'merged') => void;
  currentSource?: 'motion' | 'health_app' | 'merged';
}

export const StepDataSourceSelector: React.FC<StepDataSourceSelectorProps> = ({
  onSourceChange,
  currentSource = 'motion'
}) => {
  const [dataSources, setDataSources] = useState<HealthDataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingHealthApp, setConnectingHealthApp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      const sources = await ReliableHealthService.getAvailableDataSources();
      setDataSources(sources);
    } catch (error) {
      console.error('Error loading data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectHealthApp = async () => {
    setConnectingHealthApp(true);
    try {
      const success = await ReliableHealthService.requestHealthAppPermissions();
      if (success) {
        toast({
          title: "Health App Connected",
          description: "Your health data will now sync automatically!"
        });
        await loadDataSources();
      } else {
        toast({
          title: "Connection Failed",
          description: "Health app integration is temporarily unavailable",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to health app",
        variant: "destructive"
      });
    } finally {
      setConnectingHealthApp(false);
    }
  };

  const getSourceIcon = (type: 'motion' | 'health_app') => {
    return type === 'motion' ? Smartphone : Heart;
  };

  const getSourceStatus = (source: HealthDataSource) => {
    if (!source.available) return { icon: AlertCircle, color: 'destructive', text: 'Unavailable' };
    if (source.connected) return { icon: CheckCircle, color: 'default', text: 'Connected' };
    return { icon: AlertCircle, color: 'secondary', text: 'Not Connected' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>Checking data sources...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Step Data Sources</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose how you want to track your steps. Motion sensor is always reliable.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataSources.map((source) => {
          const Icon = getSourceIcon(source.type);
          const status = getSourceStatus(source);
          const StatusIcon = status.icon;
          
          return (
            <div key={source.type} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {source.todaySteps !== null ? `${source.todaySteps} steps today` : 'No data'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={status.color as any} className="flex items-center space-x-1">
                  <StatusIcon className="w-3 h-3" />
                  <span className="text-xs">{status.text}</span>
                </Badge>
                
                {source.type === 'health_app' && source.available && !source.connected && (
                  <Button 
                    size="sm" 
                    onClick={handleConnectHealthApp}
                    disabled={connectingHealthApp}
                  >
                    {connectingHealthApp ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
                
                {source.connected && (
                  <Switch
                    checked={currentSource === source.type || currentSource === 'merged'}
                    onCheckedChange={(checked) => {
                      if (onSourceChange) {
                        onSourceChange(checked ? source.type : 'motion');
                      }
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Why connect your health app?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>More accurate step counting with multiple sensors</li>
              <li>Historical data from other fitness apps</li>
              <li>Backup in case motion sensor fails</li>
              <li>Sync steps recorded when app is closed</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};