import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Footprints, Trophy, Users, TrendingUp } from 'lucide-react';
import { useWalkingChallenges } from '@/hooks/useWalkingChallenges';
import { useHealthTracking } from '@/hooks/useHealthTracking';
import { WalkingChallengeCard } from '@/components/challenges/WalkingChallengeCard';

export const WalkingChallengeWidget: React.FC = () => {
  const { 
    challenges, 
    loading, 
    joinChallenge, 
    leaveChallenge,
    getUserProgressForChallenge,
    getLeaderboardForChallenge,
    fetchLeaderboard
  } = useWalkingChallenges();
  
  const { healthData } = useHealthTracking();

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

  if (challenges.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" />
            Walking Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Footprints className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active walking challenges</p>
            <p className="text-sm">Check back later for new challenges!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeChallenge = challenges[0]; // Show first active challenge
  const userProgress = getUserProgressForChallenge(activeChallenge.id);
  const leaderboard = getLeaderboardForChallenge(activeChallenge.id);

  const handleJoinChallenge = async (challengeId: string) => {
    await joinChallenge(challengeId);
    await fetchLeaderboard(challengeId);
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" />
            Walking Challenges
            <Badge variant="outline" className="ml-auto">
              {challenges.length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Steps Display */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Today's Steps</span>
              </div>
              <span className="text-lg font-bold">{healthData.steps.toLocaleString()}</span>
            </div>

            {/* Challenge Summary */}
            <div className="text-center space-y-2">
              <h3 className="font-semibold">{activeChallenge.title}</h3>
              <p className="text-sm text-muted-foreground">{activeChallenge.description}</p>
              
              {userProgress ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{userProgress.total_steps.toLocaleString()} / {activeChallenge.step_goal.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min((userProgress.total_steps / activeChallenge.step_goal) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              ) : (
                <Button onClick={() => handleJoinChallenge(activeChallenge.id)} size="sm">
                  Join Challenge
                </Button>
              )}
            </div>

            {/* Leaderboard Preview */}
            {leaderboard.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Top 3
                </h4>
                <div className="space-y-1">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span>{entry.profile.full_name}</span>
                      </div>
                      <span className="font-medium">{entry.total_steps.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Challenge Card */}
      <WalkingChallengeCard
        challenge={activeChallenge}
        userProgress={userProgress}
        leaderboard={leaderboard}
        onJoin={handleJoinChallenge}
        onLeave={leaveChallenge}
      />
    </div>
  );
};