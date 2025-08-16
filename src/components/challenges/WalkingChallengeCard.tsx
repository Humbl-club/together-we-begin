import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Footprints, Trophy, Users, Calendar, Target } from 'lucide-react';
import { useHealthTracking } from '@/hooks/useHealthTracking';
import { useAuth } from '@/components/auth/AuthProvider';

interface WalkingChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    step_goal: number;
    challenge_type: 'one_time' | 'weekly_recurring' | 'monthly_recurring';
    start_date: string;
    end_date: string;
    winner_reward_points: number;
    runner_up_reward_points: number;
    participation_reward_points: number;
    status: 'draft' | 'active' | 'completed';
  };
  userProgress?: {
    total_steps: number;
    daily_steps: { [date: string]: number };
    is_participating: boolean;
  };
  leaderboard?: Array<{
    user_id: string;
    total_steps: number;
    profile: { full_name: string; avatar_url?: string };
  }>;
  onJoin?: (challengeId: string) => void;
  onLeave?: (challengeId: string) => void;
}

export const WalkingChallengeCard: React.FC<WalkingChallengeCardProps> = ({
  challenge,
  userProgress,
  leaderboard = [],
  onJoin,
  onLeave
}) => {
  const { healthData, syncChallengeProgress } = useHealthTracking();
  const { user } = useAuth();
  
  const isParticipating = userProgress?.is_participating || false;
  const userSteps = userProgress?.total_steps || 0;
  const progressPercentage = challenge.step_goal > 0 ? (userSteps / challenge.step_goal) * 100 : 0;
  
  const formatChallengeType = (type: string) => {
    switch (type) {
      case 'weekly_recurring':
        return 'Weekly Challenge';
      case 'monthly_recurring':
        return 'Monthly Challenge';
      default:
        return 'One-time Challenge';
    }
  };

  const getDaysRemaining = () => {
    const endDate = new Date(challenge.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleJoinChallenge = async () => {
    if (onJoin) {
      await onJoin(challenge.id);
      // Sync current steps
      await syncChallengeProgress(challenge.id);
    }
  };

  const handleSyncSteps = async () => {
    await syncChallengeProgress(challenge.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const userRank = leaderboard.findIndex(entry => entry.user_id === user?.id) + 1;
  const topThree = leaderboard.slice(0, 3);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-primary" />
              {challenge.title}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={getStatusColor(challenge.status)}>
                {challenge.status}
              </Badge>
              <Badge variant="outline">
                {formatChallengeType(challenge.challenge_type)}
              </Badge>
            </div>
          </div>
          {isParticipating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Rank #{userRank || '—'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Challenge Description */}
        <p className="text-muted-foreground">{challenge.description}</p>

        {/* Challenge Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-medium">{challenge.step_goal.toLocaleString()} steps</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{getDaysRemaining()} days left</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{leaderboard.length} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span>{challenge.winner_reward_points} pts winner</span>
          </div>
        </div>

        {/* User Progress */}
        {isParticipating && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-muted-foreground">
                {userSteps.toLocaleString()} / {challenge.step_goal.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span>{Math.max(0, challenge.step_goal - userSteps).toLocaleString()} steps to go</span>
            </div>
          </div>
        )}

        {/* Top 3 Leaderboard */}
        {topThree.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Top Performers</h4>
            <div className="space-y-1">
              {topThree.map((entry, index) => (
                <div key={entry.user_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className={entry.user_id === user?.id ? 'font-medium text-primary' : ''}>
                      {entry.profile.full_name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="font-medium">{entry.total_steps.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isParticipating ? (
            <Button onClick={handleJoinChallenge} className="flex-1" disabled={challenge.status !== 'active'}>
              <Footprints className="w-4 h-4 mr-2" />
              Join Challenge
            </Button>
          ) : (
            <>
              <Button onClick={handleSyncSteps} variant="outline" className="flex-1">
                Sync Steps
              </Button>
              {onLeave && (
                <Button onClick={() => onLeave(challenge.id)} variant="outline">
                  Leave
                </Button>
              )}
            </>
          )}
        </div>

        {/* Rewards Info */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="flex justify-between">
            <span>Winner: {challenge.winner_reward_points} pts</span>
            <span>Runner-up: {challenge.runner_up_reward_points} pts</span>
            <span>Participation: {challenge.participation_reward_points} pts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};