import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStepTracking } from '@/hooks/useStepTracking';
import { Activity, Play, Square, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StepTrackingWidgetProps {
  challengeId?: string;
  compact?: boolean;
}

export const StepTrackingWidget: React.FC<StepTrackingWidgetProps> = ({ 
  challengeId, 
  compact = false 
}) => {
  const {
    isTracking,
    hasPermission,
    todaySteps,
    syncing,
    lastSyncTime,
    requestPermissions,
    startTracking,
    stopTracking,
    syncSteps
  } = useStepTracking();

  const handleToggleTracking = async () => {
    if (isTracking) {
      await stopTracking();
    } else {
      await startTracking();
    }
  };

  const handleSync = async () => {
    await syncSteps(challengeId);
  };

  const getPermissionStatus = () => {
    if (hasPermission === null) return { text: 'Unknown', variant: 'outline' as const };
    if (hasPermission === false) return { text: 'Denied', variant: 'destructive' as const };
    return { text: 'Granted', variant: 'secondary' as const };
  };

  const permissionStatus = getPermissionStatus();

  if (compact) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-semibold">{todaySteps.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">steps</span>
              </div>
              {isTracking && (
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Tracking
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1"
              >
                <RotateCcw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                size="sm"
                variant={isTracking ? "destructive" : "default"}
                onClick={handleToggleTracking}
                disabled={hasPermission === false}
              >
                {isTracking ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Step Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Device Permission:</span>
          <Badge variant={permissionStatus.variant}>
            {permissionStatus.text}
          </Badge>
        </div>

        {hasPermission === false && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium">Permission Required</p>
              <p className="text-xs text-muted-foreground">
                Enable motion tracking to participate in step challenges
              </p>
            </div>
            <Button size="sm" onClick={requestPermissions}>
              Enable
            </Button>
          </div>
        )}

        {/* Current Steps */}
        <div className="text-center py-4">
          <div className="text-3xl font-bold gradient-text">{todaySteps.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">steps today</div>
        </div>

        {/* Tracking Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tracking Status:</span>
          <div className="flex items-center gap-2">
            {isTracking ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600">Active</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-sm text-muted-foreground">Stopped</span>
              </>
            )}
          </div>
        </div>

        {/* Last Sync */}
        {lastSyncTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Sync:</span>
            <span className="text-sm">
              {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant={isTracking ? "destructive" : "default"}
            onClick={handleToggleTracking}
            disabled={hasPermission === false}
            className="flex-1"
          >
            {isTracking ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing || !isTracking}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {challengeId && (
          <div className="text-xs text-muted-foreground text-center">
            Steps will be automatically synced to your active challenges
          </div>
        )}
      </CardContent>
    </Card>
  );
};