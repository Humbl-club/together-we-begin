import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Trophy, Target, Clock, Users, Medal, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface ChallengesWidgetProps {
  configuration: {
    showProgress?: boolean;
    showLeaderboard?: boolean;
    maxChallenges?: number;
    viewMode?: 'list' | 'card' | 'progress';
    showRewards?: boolean;
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'community';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  target_value: number;
  target_unit: string;
  reward_points: number;
  participant_count: number;
  user_participation?: {
    current_value: number;
    is_completed: boolean;
    rank?: number;
  };
}

export const ChallengesWidget: React.FC<ChallengesWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    showProgress = true,
    showLeaderboard = size !== 'small',
    maxChallenges = size === 'small' ? 2 : size === 'medium' ? 3 : 6,
    viewMode = size === 'small' ? 'progress' : 'card',
    showRewards = true
  } = configuration;

  useEffect(() => {
    loadChallenges();
  }, [currentOrganization?.id]);

  const loadChallenges = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Load active challenges
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_participations!inner(count)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(maxChallenges);

      if (error) throw error;

      if (!challengesData) {
        setChallenges([]);
        return;
      }

      // Get user participation data
      let userParticipations: any[] = [];
      if (userId && challengesData.length > 0) {
        const { data: participationsData } = await supabase
          .from('challenge_participations')
          .select(`
            challenge_id,
            current_value,
            is_completed,
            walking_leaderboards (rank)
          `)
          .eq('user_id', userId)
          .in('challenge_id', challengesData.map(c => c.id));
        
        userParticipations = participationsData || [];
      }

      // Format challenges
      const formattedChallenges = challengesData.map(challenge => {
        const participation = userParticipations.find(p => p.challenge_id === challenge.id);
        
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          status: challenge.status,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          target_value: challenge.target_value,
          target_unit: challenge.target_unit,
          reward_points: challenge.reward_points,
          participant_count: challenge.challenge_participations?.[0]?.count || 0,
          user_participation: participation ? {
            current_value: participation.current_value,
            is_completed: participation.is_completed,
            rank: participation.walking_leaderboards?.[0]?.rank
          } : undefined
        };
      });

      setChallenges(formattedChallenges);

    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'steps' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <Target className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'community': return <Trophy className="w-4 h-4" />;
      default: return <Medal className="w-4 h-4" />;
    }
  };

  const renderProgressView = () => (
    <div className="space-y-3">
      {challenges.map((challenge) => {
        const participation = challenge.user_participation;
        const progress = participation ? 
          calculateProgress(participation.current_value, challenge.target_value) : 0;
        
        return (
          <div key={challenge.id} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getChallengeIcon(challenge.type)}
                <span className="font-medium text-sm">{challenge.title}</span>
              </div>
              {participation?.is_completed && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Trophy className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            {showProgress && participation && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {formatValue(participation.current_value, challenge.target_unit)} / {formatValue(challenge.target_value, challenge.target_unit)} {challenge.target_unit}
                  </span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getDaysRemaining(challenge.end_date)} days left
              </div>
              {showRewards && (
                <div className="flex items-center gap-1">
                  <Medal className="w-3 h-3" />
                  {challenge.reward_points} pts
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {challenges.map((challenge) => {
        const participation = challenge.user_participation;
        const progress = participation ? 
          calculateProgress(participation.current_value, challenge.target_value) : 0;
        
        return (
          <div key={challenge.id} className="p-4 bg-white border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getChallengeIcon(challenge.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                  <p className="text-sm text-gray-600 capitalize">{challenge.type} challenge</p>
                </div>
              </div>
              
              {participation?.is_completed && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Trophy className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {challenge.description}
            </p>

            {showProgress && participation && (
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-gray-600 mt-1">
                  {formatValue(participation.current_value, challenge.target_unit)} / {formatValue(challenge.target_value, challenge.target_unit)} {challenge.target_unit}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {challenge.participant_count}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getDaysRemaining(challenge.end_date)}d left
                </div>
              </div>

              {showRewards && (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <Medal className="w-4 h-4" />
                  {challenge.reward_points} points
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCardView = () => (
    <div className={`grid gap-4 ${
      size === 'large' || size === 'full' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
    }`}>
      {challenges.map((challenge) => {
        const participation = challenge.user_participation;
        const progress = participation ? 
          calculateProgress(participation.current_value, challenge.target_value) : 0;
        
        return (
          <Card key={challenge.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getChallengeIcon(challenge.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{challenge.title}</CardTitle>
                    <p className="text-sm text-gray-600 capitalize">{challenge.type}</p>
                  </div>
                </div>
                
                {participation?.is_completed && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Trophy className="w-3 h-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                {challenge.description}
              </p>

              {showProgress && participation && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Your Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={`h-3 ${participation.is_completed ? 'bg-green-100' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>
                      {formatValue(participation.current_value, challenge.target_unit)}
                    </span>
                    <span>
                      {formatValue(challenge.target_value, challenge.target_unit)} {challenge.target_unit}
                    </span>
                  </div>
                </div>
              )}

              {showLeaderboard && participation?.rank && (
                <div className="mb-4 p-2 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-800">
                      You're ranked #{participation.rank}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {challenge.participant_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getDaysRemaining(challenge.end_date)}d
                  </div>
                </div>

                {showRewards && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Medal className="w-3 h-3 mr-1" />
                    {challenge.reward_points} pts
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">No active challenges</div>
        <Button size="sm" variant="outline">
          Join a Challenge
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === 'progress' && renderProgressView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'card' && renderCardView()}

      {challenges.length >= maxChallenges && (
        <Button variant="ghost" size="sm" className="w-full">
          View All Challenges
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};