import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  Footprints,
  Clock,
  Award,
  TrendingUp,
  ChevronRight,
  Medal
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ChallengeParticipant {
  user_id: string;
  total_steps: number;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

interface EnhancedChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    step_goal: number;
    challenge_type: 'one_time' | 'weekly' | 'monthly';
    start_date: string;
    end_date: string;
    winner_reward_points: number;
    runner_up_reward_points: number;
    participation_reward_points: number;
    status: 'draft' | 'active' | 'completed';
    badge_name?: string;
    badge_image_url?: string;
  };
  userProgress?: {
    total_steps: number;
    daily_steps: { [date: string]: number };
    is_participating: boolean;
    last_updated: string;
  };
  leaderboard?: ChallengeParticipant[];
  participantCount?: number;
  onJoin?: (challengeId: string) => void;
  onLeave?: (challengeId: string) => void;
  onViewDetails?: (challengeId: string) => void;
  className?: string;
}

export const EnhancedChallengeCard: React.FC<EnhancedChallengeCardProps> = ({
  challenge,
  userProgress,
  leaderboard = [],
  participantCount = 0,
  onJoin,
  onLeave,
  onViewDetails,
  className
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isParticipating = userProgress?.is_participating || false;
  const userSteps = userProgress?.total_steps || 0;
  const progressPercentage = challenge.step_goal > 0 ? (userSteps / challenge.step_goal) * 100 : 0;
  
  const getDaysRemaining = () => {
    const endDate = new Date(challenge.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getChallengeTypeIcon = () => {
    switch (challenge.challenge_type) {
      case 'weekly':
        return <Calendar className="w-4 h-4" />;
      case 'monthly':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (challenge.status) {
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatSteps = (steps: number) => {
    if (steps >= 1000) {
      return `${(steps / 1000).toFixed(1)}k`;
    }
    return steps.toLocaleString();
  };

  const getUserRank = () => {
    if (!isParticipating || !leaderboard.length || !user?.id) return null;
    const userEntry = leaderboard.find(entry => entry.user_id === user.id);
    if (!userEntry) return null;
    return leaderboard.indexOf(userEntry) + 1;
  };

  const topThree = leaderboard.slice(0, 3);
  const userRank = getUserRank();

  const handleJoinChallenge = () => {
    if (onJoin) {
      onJoin(challenge.id);
      toast({
        title: 'Challenge Joined!',
        description: `You've joined ${challenge.title}. Start walking to track your progress!`,
      });
    }
  };

  return (
    <Card className={`glass-card hover:scale-102 transition-transform duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getChallengeTypeIcon()}
              <CardTitle className="text-lg">{challenge.title}</CardTitle>
              <Badge className={getStatusColor()}>
                {challenge.status}
              </Badge>
            </div>
            
            {challenge.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {challenge.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {formatSteps(challenge.step_goal)} steps
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participantCount} joined
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getDaysRemaining()} days left
              </div>
            </div>
          </div>

          {challenge.badge_name && (
            <div className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded">
              <Award className="w-3 h-3" />
              {challenge.badge_name}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        {isParticipating ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Progress</span>
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">
                  {formatSteps(userSteps)}
                </span>
              </div>
            </div>
            
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-2"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              {userRank && (
                <span className="flex items-center gap-1">
                  <Medal className="w-3 h-3" />
                  Rank #{userRank}
                </span>
              )}
            </div>
            
            {progressPercentage >= 100 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-2 text-center">
                <div className="text-sm font-medium text-success">
                  Goal Achieved! 🎉
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <Footprints className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Join this challenge to start tracking your progress
            </p>
          </div>
        )}

        {/* Mini Leaderboard */}
        {topThree.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Top Performers</h4>
              <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>{challenge.title} Leaderboard</DialogTitle>
                    <DialogDescription>
                      Current standings for this challenge
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {leaderboard.map((participant, index) => (
                      <div key={participant.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={participant.profile.avatar_url} />
                          <AvatarFallback>
                            {participant.profile.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {participant.profile.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSteps(participant.total_steps)} steps
                          </p>
                        </div>
                        
                        {index < 3 && (
                          <div className="text-right">
                            {index === 0 && <Medal className="w-4 h-4 text-yellow-500" />}
                            {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                            {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-1">
              {topThree.map((participant, index) => (
                <div key={participant.user_id} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {index + 1}
                  </div>
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={participant.profile.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {participant.profile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{participant.profile.full_name}</span>
                  <span className="font-medium">{formatSteps(participant.total_steps)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Info */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="space-y-1">
            <div className="font-bold text-primary">{challenge.winner_reward_points}</div>
            <div className="text-muted-foreground">Winner</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-primary">{challenge.runner_up_reward_points}</div>
            <div className="text-muted-foreground">Runner-up</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-primary">{challenge.participation_reward_points}</div>
            <div className="text-muted-foreground">Participation</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isParticipating ? (
            <Button 
              onClick={handleJoinChallenge} 
              className="flex-1"
              disabled={challenge.status !== 'active'}
            >
              Join Challenge
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onLeave?.(challenge.id)}
                className="flex-1"
              >
                Leave
              </Button>
              <Button 
                variant="outline"
                onClick={() => onViewDetails?.(challenge.id)}
                className="flex-1"
              >
                View Details
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};