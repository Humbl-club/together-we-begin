import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, CheckCircle, XCircle, AlertTriangle, Settings, Activity } from 'lucide-react';
import { useStepTracking } from '@/hooks/useStepTracking';
import { StepDataSourceSelector } from './StepDataSourceSelector';
import { pedometerService } from '@/services/PedometerService';

interface StepTrackingWidgetProps {
  challengeId?: string;
  compact?: boolean;
}

export const StepTrackingWidget: React.FC<StepTrackingWidgetProps> = ({ 
  challengeId, 
  compact = false 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [dataSource, setDataSource] = useState<'motion' | 'health_app' | 'merged'>('motion');
  
  const {
    isTracking,
    hasPermission,
    currentSteps,
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
    if (hasPermission === null) return { 
      text: 'Checking...', 
      variant: 'outline' as const, 
      icon: <AlertTriangle className="w-3 h-3" /> 
    };
    if (hasPermission === false) return { 
      text: 'Denied', 
      variant: 'destructive' as const, 
      icon: <XCircle className="w-3 h-3" /> 
    };
    return { 
      text: 'Granted', 
      variant: 'default' as const, 
      icon: <CheckCircle className="w-3 h-3" /> 
    };
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-primary">
                {todaySteps.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                steps today
                <div className="flex items-center space-x-1 mt-1">
                  <Activity className="w-3 h-3" />
                  <span className="text-xs">Motion Sensor</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={isTracking ? "default" : "secondary"}>
                {isTracking ? "Tracking" : "Paused"}
              </Badge>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
                    <span>Sync</span>
                  </div>
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
              </Button>
              
              <Button
                size="sm"
                onClick={handleToggleTracking}
                disabled={hasPermission === false}
              >
                {isTracking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calibrationStatus = pedometerService.getCalibrationStatus();

  if (showSettings) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Step Tracking Settings</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Back
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StepDataSourceSelector
              currentSource={dataSource}
              onSourceChange={setDataSource}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Step Tracking</span>
          <div className="flex items-center space-x-2">
            <Badge variant={getPermissionStatus().variant}>
              {getPermissionStatus().icon}
              <span className="ml-1">{getPermissionStatus().text}</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasPermission === false && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  Motion permissions required
                </p>
                <p className="text-yellow-700 mt-1">
                  Enable motion & fitness permissions in your device settings to track steps.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {todaySteps.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Today's Steps
              <div className="flex items-center justify-center space-x-1 mt-1">
                <Activity className="w-3 h-3" />
                <span className="text-xs">Motion Sensor</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-semibold text-muted-foreground">
              {isTracking ? "Active" : "Paused"}
            </div>
            <div className="text-sm text-muted-foreground">
              Tracking Status
              {calibrationStatus.isCalibrated && (
                <div className="text-xs text-green-600 mt-1">
                  Calibrated ({calibrationStatus.samples} samples)
                </div>
              )}
            </div>
          </div>
        </div>

        {lastSyncTime && (
          <div className="text-xs text-muted-foreground text-center">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}

        {challengeId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Challenge Active:</strong> Your steps will automatically sync every 5 minutes
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={handleSync}
            disabled={syncing || hasPermission === false}
            variant="outline"
            className="flex-1"
          >
            {syncing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Syncing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4" />
                <span>Sync Now</span>
              </div>
            )}
          </Button>
          
          <Button
            onClick={handleToggleTracking}
            disabled={hasPermission === false}
            className="flex-1"
          >
            {isTracking ? (
              <div className="flex items-center space-x-2">
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Start</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};