import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, AlertCircle, Smartphone } from 'lucide-react';
import { useHealthTracking } from '@/hooks/useHealthTracking';
import { Skeleton } from '@/components/ui/skeleton';
import { WalkingChallengeWidget } from './WalkingChallengeWidget';
import { WellnessCalibrationWidget } from './WellnessCalibrationWidget';

interface WellnessWidgetProps {
  onChallengeSync?: (challengeId: string) => void;
}

export const WellnessWidget: React.FC<WellnessWidgetProps> = ({ onChallengeSync }) => {
  const { 
    healthData, 
    healthGoals, 
    isConnected, 
    loading, 
    getProgressPercentage,
    checkHealthKitConnection
  } = useHealthTracking();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const wellnessMetrics = [
    {
      label: 'Daily Steps',
      current: healthData.steps.toLocaleString(),
      goal: healthGoals.dailySteps.toLocaleString(),
      progress: getProgressPercentage('dailySteps'),
      icon: Activity,
      color: '#10b981'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Wellness</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                <Smartphone className="w-3 h-3 mr-1" />
                {isConnected ? "Motion Tracking" : "Disconnected"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Step tracking unavailable</p>
                  <p className="text-yellow-700 mt-1">
                    Motion sensor tracking is only available on mobile devices.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={checkHealthKitConnection}
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {wellnessMetrics.map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                    <span className="text-sm font-medium">{metric.label}</span>
                    <Badge variant="outline" className="text-xs">
                      Motion Sensor
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.current} / {metric.goal}
                  </div>
                </div>
                <Progress 
                  value={metric.progress} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {metric.progress.toFixed(0)}% complete
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <WellnessCalibrationWidget />
      <WalkingChallengeWidget />
    </div>
  );
};