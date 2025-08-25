import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StepTrackingWidget } from '@/components/wellness/StepTrackingWidget';
import { EnhancedLeaderboard } from '@/components/challenges/EnhancedLeaderboard';
import { useWalkingChallenges } from '@/hooks/useWalkingChallenges';
import { useProgressManagement } from '@/hooks/useProgressManagement';
import { useAuth } from '@/components/auth/AuthProvider';
import { Calendar, Trophy, Users, Target, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface StepChallengeCardProps {
  challengeId: string;
  title: string;
  description?: string;
  stepGoal: number;
  startDate: string;
  endDate: string;
  status: string;
  participationRewardPoints?: number;
  compact?: boolean;
}

export const StepChallengeCard: React.FC<StepChallengeCardProps> = ({
  challengeId,
  title,
  description,
  stepGoal,
  startDate,
  endDate,
  status,
  participationRewardPoints,
  compact = false
}) => {
  const { user } = useAuth();
  const {
    joinChallenge,
    leaveChallenge,
    getUserProgressForChallenge,
    getLeaderboardForChallenge,
    syncStepsForChallenge,
    loading
  } = useWalkingChallenges();
  
  const { getProgressForChallenge } = useProgressManagement();

  const userProgress = getUserProgressForChallenge(challengeId);
  const progressData = getProgressForChallenge(challengeId);
  const leaderboard = getLeaderboardForChallenge(challengeId);
  const isParticipating = !!userProgress;

  const currentSteps = userProgress?.total_steps || 0;
  const progressPercent = stepGoal > 0 ? Math.min((currentSteps / stepGoal) * 100, 100) : 0;
  const isCompleted = currentSteps >= stepGoal;
  const isActive = status === 'active';
  const timeLeft = isActive ? formatDistanceToNow(new Date(endDate), { addSuffix: true }) : null;

  const handleJoinLeave = async () => {
    if (isParticipating) {
      await leaveChallenge(challengeId);
    } else {
      await joinChallenge(challengeId);
    }
  };

  const handleSyncSteps = async () => {
    await syncStepsForChallenge(challengeId);
  };

  if (compact) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">{title}</h3>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {status}
              </Badge>
            </div>
            
            {isParticipating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentSteps.toLocaleString()} steps</span>
                  <span>{stepGoal.toLocaleString()} goal</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {progressPercent.toFixed(1)}% complete
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isParticipating ? "outline" : "default"}
                onClick={handleJoinLeave}
                disabled={loading}
                className="flex-1"
              >
                {isParticipating ? 'Leave' : 'Join'}
              </Button>
              {isParticipating && (
                <Button size="sm" variant="outline" onClick={handleSyncSteps}>
                  Sync
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {title}
          </CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Challenge Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span>{stepGoal.toLocaleString()} steps</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{leaderboard.length} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d')}</span>
          </div>
          {participationRewardPoints && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span>{participationRewardPoints} points</span>
            </div>
          )}
        </div>

        {timeLeft && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Challenge ends</div>
            <div className="font-semibold">{timeLeft}</div>
          </div>
        )}

        {/* User Progress */}
        {isParticipating && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {currentSteps.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                of {stepGoal.toLocaleString()} steps
              </div>
            </div>
            
            <Progress value={progressPercent} className="h-3" />
            
            <div className="flex justify-between text-sm">
              <span>{progressPercent.toFixed(1)}% complete</span>
              {isCompleted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Completed! 🎉
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Step Tracking Widget */}
        {isParticipating && (
          <StepTrackingWidget challengeId={challengeId} compact />
        )}

        {/* Join/Leave Button */}
        <div className="flex gap-2">
          <Button
            variant={isParticipating ? "outline" : "default"}
            onClick={handleJoinLeave}
            disabled={loading || !isActive}
            className="flex-1"
          >
            {isParticipating ? 'Leave Challenge' : 'Join Challenge'}
          </Button>
          {isParticipating && (
            <Button variant="outline" onClick={handleSyncSteps}>
              Sync Steps
            </Button>
          )}
        </div>

        {/* Leaderboard Preview */}
        {isParticipating && leaderboard.length > 0 && (
          <EnhancedLeaderboard
            challengeId={challengeId}
            challengeTitle={title}
            stepGoal={stepGoal}
            showValidationStatus={false}
            compact
          />
        )}
      </CardContent>
    </Card>
  );
};