import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, AlertCircle, Smartphone } from 'lucide-react';
import { useIntegratedStepTracking } from '@/hooks/useIntegratedStepTracking';
import { Skeleton } from '@/components/ui/skeleton';
import { WalkingChallengeWidget } from './WalkingChallengeWidget';
import { WellnessCalibrationWidget } from './WellnessCalibrationWidget';
import { StepHistoryChart } from './StepHistoryChart';

interface WellnessWidgetProps {
  onChallengeSync?: (challengeId: string) => void;
}

export const WellnessWidget: React.FC<WellnessWidgetProps> = ({ onChallengeSync }) => {
  const { 
    todaySteps,
    weeklyStepTotal,
    dailyStepAverage,
    weeklyStepData,
    isTracking,
    hasPermission,
    syncing,
    startTracking,
    requestPermissions
  } = useIntegratedStepTracking();

  if (syncing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const dailyGoal = 8000; // Default step goal
  const progress = Math.min((todaySteps / dailyGoal) * 100, 100);

  const wellnessMetrics = [
    {
      label: 'Daily Steps',
      current: todaySteps.toLocaleString(),
      goal: dailyGoal.toLocaleString(),
      progress,
      icon: Activity,
      color: '#10b981'
    },
    {
      label: 'Weekly Total',
      current: weeklyStepTotal.toLocaleString(),
      goal: (dailyGoal * 7).toLocaleString(),
      progress: Math.min((weeklyStepTotal / (dailyGoal * 7)) * 100, 100),
      icon: TrendingUp,
      color: '#3b82f6'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Wellness</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isTracking ? "default" : "secondary"}>
                <Smartphone className="w-3 h-3 mr-1" />
                {isTracking ? "Motion Tracking" : "Disconnected"}
              </Badge>
              {dailyStepAverage > 0 && (
                <Badge variant="outline" className="text-xs">
                  Avg: {dailyStepAverage.toLocaleString()}/day
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isTracking && hasPermission !== null && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Step tracking unavailable</p>
                  <p className="text-yellow-700 mt-1">
                    {hasPermission === false 
                      ? "Motion permissions required to track steps."
                      : "Motion sensor tracking is only available on mobile devices."
                    }
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={hasPermission === false ? requestPermissions : startTracking}
                  >
                    {hasPermission === false ? "Enable Permissions" : "Start Tracking"}
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
      
      {weeklyStepData.length > 0 && (
        <StepHistoryChart data={weeklyStepData} />
      )}
      
      <WalkingChallengeWidget />
    </div>
  );
};