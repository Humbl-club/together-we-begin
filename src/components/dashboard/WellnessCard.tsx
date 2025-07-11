import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Trophy, Target, TrendingUp } from 'lucide-react';

interface WellnessCardProps {
  steps: number;
  goalSteps: number;
  leaderboardPosition: number;
  totalParticipants: number;
  challengeName: string;
  weeklyProgress: number;
}

const WellnessCard: React.FC<WellnessCardProps> = ({
  steps,
  goalSteps,
  leaderboardPosition,
  totalParticipants,
  challengeName,
  weeklyProgress
}) => {
  const progressPercentage = Math.min((steps / goalSteps) * 100, 100);
  
  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Today's Movement</CardTitle>
          <Badge variant="outline" className="bg-background/50">
            <Trophy className="w-3 h-3 mr-1" />
            #{leaderboardPosition}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Steps Today</span>
            </div>
            <span className="text-2xl font-light">{steps.toLocaleString()}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{steps.toLocaleString()} / {goalSteps.toLocaleString()}</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
        </div>

        {/* Challenge Info */}
        <div className="pt-3 border-t border-border/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Active Challenge</span>
            <Badge variant="secondary" className="text-xs">
              {challengeName}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Rank:</span>
              <span className="font-medium">#{leaderboardPosition} of {totalParticipants}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500 font-medium">+{weeklyProgress}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellnessCard;