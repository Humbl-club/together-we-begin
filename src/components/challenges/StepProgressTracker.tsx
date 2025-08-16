import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Footprints, TrendingUp, Target } from 'lucide-react';
import { useHealthTracking } from '@/hooks/useHealthTracking';
import { DailyStepData } from '@/services/PedometerService';

interface StepProgressTrackerProps {
  className?: string;
}

export const StepProgressTracker: React.FC<StepProgressTrackerProps> = ({ className }) => {
  const { healthData, healthGoals, isConnected } = useHealthTracking();
  
  const todaySteps = healthData.steps;
  const goalSteps = healthGoals.dailySteps;
  const progressPercentage = (todaySteps / goalSteps) * 100;
  
  const weeklySteps = healthData.weeklySteps || [];
  const weekTotal = weeklySteps.reduce((sum, day) => sum + day.steps, 0);
  const weeklyAverage = weekTotal / 7;

  const formatSteps = (steps: number) => {
    if (steps >= 1000) {
      return `${(steps / 1000).toFixed(1)}k`;
    }
    return steps.toLocaleString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-primary" />
          Step Progress
          {!isConnected && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
              Demo Mode
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Today's Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Today's Steps</span>
            <span className="text-2xl font-bold text-primary">
              {formatSteps(todaySteps)}
            </span>
          </div>
          
          <Progress 
            value={Math.min(progressPercentage, 100)} 
            className={`h-3 ${getProgressColor(progressPercentage)}`}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Goal: {formatSteps(goalSteps)}</span>
            <span>
              {progressPercentage >= 100 
                ? `${Math.round(progressPercentage - 100)}% over goal!` 
                : `${Math.round(100 - progressPercentage)}% to goal`
              }
            </span>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              This Week
            </h4>
            <span className="text-sm text-muted-foreground">
              Avg: {formatSteps(Math.round(weeklyAverage))}
            </span>
          </div>

          {/* Daily Steps Chart */}
          <div className="grid grid-cols-7 gap-1">
            {weeklySteps.map((day, index) => {
              const dayProgress = (day.steps / goalSteps) * 100;
              const isToday = new Date(day.date).toDateString() === new Date().toDateString();
              
              return (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })[0]}
                  </div>
                  <div 
                    className={`h-12 rounded ${
                      isToday ? 'ring-2 ring-primary' : ''
                    } ${
                      dayProgress >= 100 ? 'bg-success' :
                      dayProgress >= 75 ? 'bg-warning' :
                      dayProgress > 0 ? 'bg-primary' : 'bg-muted'
                    } relative overflow-hidden`}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-white/20 transition-all"
                      style={{ height: `${Math.min(dayProgress, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {formatSteps(day.steps)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">{formatSteps(weekTotal)}</div>
            <div className="text-xs text-muted-foreground">Week Total</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">
              {healthData.calories}
            </div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">
              {healthData.distance.toFixed(1)}km
            </div>
            <div className="text-xs text-muted-foreground">Distance</div>
          </div>
        </div>

        {/* Goal Achievement */}
        {progressPercentage >= 100 && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
            <Target className="w-6 h-6 text-success mx-auto mb-2" />
            <div className="text-sm font-medium text-success">
              Goal Achieved! 🎉
            </div>
            <div className="text-xs text-success/80">
              You've reached your daily step goal
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};