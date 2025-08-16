import { useState } from "react";
import { useHealthTracking } from "@/hooks/useHealthTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Heart, Footprints, Clock, Smartphone, SmartphoneNfc, Target, Droplets, Moon, TrendingUp } from "lucide-react";
import { HealthDataInput } from "./HealthDataInput";
import { WalkingChallengeWidget } from "./WalkingChallengeWidget";

interface WellnessWidgetProps {
  onChallengeSync?: (challengeId: string) => void;
}

const WellnessWidget: React.FC<WellnessWidgetProps> = ({ onChallengeSync }) => {
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
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const wellnessMetrics = [
    {
      label: 'Daily Steps',
      value: healthData.steps.toLocaleString(),
      goal: healthGoals.dailySteps.toLocaleString(),
      progress: getProgressPercentage('dailySteps'),
      icon: Activity,
      color: 'text-primary'
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Wellness Tracking
            {isConnected ? (
              <Badge className="bg-primary/15 text-primary border-0">Connected</Badge>
            ) : (
              <Badge variant="outline">Manual</Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isConnected && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Connect your health app for automatic tracking
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkHealthKitConnection}
              >
                Connect Health App
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {wellnessMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {metric.value} / {metric.goal}
                    </span>
                  </div>
                  <Progress 
                    value={metric.progress} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {metric.progress.toFixed(1)}% complete
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-muted/20">
            <p className="text-xs text-muted-foreground">
              Last updated: {healthData.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Walking Challenges Integration */}
      <WalkingChallengeWidget />
    </div>
  );
};

export default WellnessWidget;