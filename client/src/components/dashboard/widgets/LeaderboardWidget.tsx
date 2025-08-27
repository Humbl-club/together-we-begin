import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { Progress } from '../../ui/progress';
import { 
  Trophy, 
  Medal, 
  Star, 
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface LeaderboardWidgetProps {
  configuration: {
    leaderboardType?: 'steps' | 'points' | 'challenges' | 'events' | 'overall';
    timeframe?: 'weekly' | 'monthly' | 'yearly' | 'all-time';
    maxEntries?: number;
    showCurrentUser?: boolean;
    showProgress?: boolean;
    viewMode?: 'compact' | 'detailed' | 'podium';
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  rank: number;
  previous_rank?: number;
  score: number;
  progress_percentage?: number;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  additional_stats?: {
    challenges_completed?: number;
    events_attended?: number;
    days_active?: number;
  };
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  current_user_entry?: LeaderboardEntry;
  total_participants: number;
  leaderboard_type: string;
  timeframe: string;
  last_updated: string;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    leaderboardType = 'steps',
    timeframe = 'weekly',
    maxEntries = size === 'small' ? 5 : size === 'medium' ? 8 : 12,
    showCurrentUser = true,
    showProgress = size !== 'small',
    viewMode = size === 'small' ? 'compact' : 'detailed'
  } = configuration;

  useEffect(() => {
    loadLeaderboard();
  }, [currentOrganization?.id, leaderboardType, timeframe]);

  const loadLeaderboard = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // In production, this would query the walking_leaderboards table
      // For now, we'll create mock data
      const mockData: LeaderboardData = {
        entries: [
          {
            id: '1',
            user_id: 'user-1',
            rank: 1,
            previous_rank: 2,
            score: 89500,
            progress_percentage: 95,
            user: {
              id: 'user-1',
              full_name: 'Sarah Johnson',
              avatar_url: undefined
            },
            additional_stats: {
              challenges_completed: 12,
              events_attended: 8,
              days_active: 28
            }
          },
          {
            id: '2',
            user_id: 'user-2',
            rank: 2,
            previous_rank: 1,
            score: 87200,
            progress_percentage: 92,
            user: {
              id: 'user-2',
              full_name: 'Emma Wilson',
              avatar_url: undefined
            },
            additional_stats: {
              challenges_completed: 11,
              events_attended: 6,
              days_active: 26
            }
          },
          {
            id: '3',
            user_id: 'user-3',
            rank: 3,
            previous_rank: 4,
            score: 82100,
            progress_percentage: 87,
            user: {
              id: 'user-3',
              full_name: 'Lisa Chen',
              avatar_url: undefined
            },
            additional_stats: {
              challenges_completed: 10,
              events_attended: 7,
              days_active: 25
            }
          },
          {
            id: '4',
            user_id: 'user-4',
            rank: 4,
            previous_rank: 3,
            score: 78900,
            progress_percentage: 84,
            user: {
              id: 'user-4',
              full_name: 'Maria Rodriguez',
              avatar_url: undefined
            },
            additional_stats: {
              challenges_completed: 9,
              events_attended: 5,
              days_active: 24
            }
          },
          {
            id: '5',
            user_id: 'user-5',
            rank: 5,
            previous_rank: 6,
            score: 75600,
            progress_percentage: 80,
            user: {
              id: 'user-5',
              full_name: 'Jennifer Lee',
              avatar_url: undefined
            },
            additional_stats: {
              challenges_completed: 8,
              events_attended: 4,
              days_active: 22
            }
          }
        ],
        current_user_entry: userId ? {
          id: 'current',
          user_id: userId,
          rank: 8,
          previous_rank: 9,
          score: 65400,
          progress_percentage: 70,
          user: {
            id: userId,
            full_name: 'You',
            avatar_url: undefined
          },
          additional_stats: {
            challenges_completed: 6,
            events_attended: 3,
            days_active: 18
          }
        } : undefined,
        total_participants: 156,
        leaderboard_type: leaderboardType,
        timeframe: timeframe,
        last_updated: new Date().toISOString()
      };

      setLeaderboardData(mockData);

    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number, type: string) => {
    switch (type) {
      case 'steps':
        if (score >= 1000) {
          return `${(score / 1000).toFixed(1)}K steps`;
        }
        return `${score.toLocaleString()} steps`;
      case 'points':
        return `${score.toLocaleString()} pts`;
      case 'challenges':
        return `${score} completed`;
      case 'events':
        return `${score} attended`;
      default:
        return score.toLocaleString();
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return <Minus className="w-3 h-3 text-gray-400" />;
    
    if (current < previous) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (current > previous) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    }
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'steps':
        return <Target className="w-4 h-4" />;
      case 'points':
        return <Star className="w-4 h-4" />;
      case 'challenges':
        return <Trophy className="w-4 h-4" />;
      case 'events':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Medal className="w-4 h-4" />;
    }
  };

  const renderCompactView = () => {
    if (!leaderboardData) return null;

    return (
      <div className="space-y-2">
        {leaderboardData.entries.slice(0, maxEntries).map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getRankIcon(entry.rank)}
              {showProgress && getRankChange(entry.rank, entry.previous_rank)}
            </div>

            <Avatar className="w-8 h-8">
              <AvatarImage src={entry.user.avatar_url} />
              <AvatarFallback className="text-xs">
                {entry.user.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {entry.user.full_name}
              </div>
              <div className="text-xs text-gray-600">
                {formatScore(entry.score, leaderboardType)}
              </div>
            </div>

            {showProgress && entry.progress_percentage !== undefined && (
              <div className="text-xs text-gray-500">
                {entry.progress_percentage}%
              </div>
            )}
          </div>
        ))}

        {showCurrentUser && leaderboardData.current_user_entry && 
         !leaderboardData.entries.some(e => e.user_id === leaderboardData.current_user_entry?.user_id) && (
          <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-blue-600">
                {leaderboardData.current_user_entry.rank}
              </span>
              {getRankChange(leaderboardData.current_user_entry.rank, leaderboardData.current_user_entry.previous_rank)}
            </div>

            <Avatar className="w-8 h-8 border-2 border-blue-300">
              <AvatarImage src={leaderboardData.current_user_entry.user.avatar_url} />
              <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                You
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-blue-900">Your Position</div>
              <div className="text-xs text-blue-700">
                {formatScore(leaderboardData.current_user_entry.score, leaderboardType)}
              </div>
            </div>

            {showProgress && leaderboardData.current_user_entry.progress_percentage !== undefined && (
              <div className="text-xs text-blue-600 font-medium">
                {leaderboardData.current_user_entry.progress_percentage}%
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDetailedView = () => {
    if (!leaderboardData) return null;

    return (
      <div className="space-y-3">
        {leaderboardData.entries.slice(0, maxEntries).map((entry) => (
          <Card key={entry.id} className={`overflow-hidden ${entry.rank <= 3 ? 'border-yellow-200' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  {getRankIcon(entry.rank)}
                  {showProgress && getRankChange(entry.rank, entry.previous_rank)}
                </div>

                <Avatar className={`w-12 h-12 ${entry.rank === 1 ? 'border-2 border-yellow-400' : ''}`}>
                  <AvatarImage src={entry.user.avatar_url} />
                  <AvatarFallback>
                    {entry.user.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {entry.user.full_name}
                    </h4>
                    {entry.rank === 1 && (
                      <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                        Leader
                      </Badge>
                    )}
                  </div>

                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {formatScore(entry.score, leaderboardType)}
                  </div>

                  {showProgress && entry.progress_percentage !== undefined && (
                    <div className="mb-2">
                      <Progress value={entry.progress_percentage} className="h-2" />
                      <div className="text-xs text-gray-600 mt-1">
                        {entry.progress_percentage}% of goal
                      </div>
                    </div>
                  )}

                  {entry.additional_stats && (
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                      {entry.additional_stats.challenges_completed !== undefined && (
                        <div>
                          <div className="font-medium">Challenges</div>
                          <div>{entry.additional_stats.challenges_completed}</div>
                        </div>
                      )}
                      {entry.additional_stats.events_attended !== undefined && (
                        <div>
                          <div className="font-medium">Events</div>
                          <div>{entry.additional_stats.events_attended}</div>
                        </div>
                      )}
                      {entry.additional_stats.days_active !== undefined && (
                        <div>
                          <div className="font-medium">Active Days</div>
                          <div>{entry.additional_stats.days_active}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {showCurrentUser && leaderboardData.current_user_entry && 
         !leaderboardData.entries.some(e => e.user_id === leaderboardData.current_user_entry?.user_id) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {leaderboardData.current_user_entry.rank}
                  </span>
                  {getRankChange(leaderboardData.current_user_entry.rank, leaderboardData.current_user_entry.previous_rank)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-blue-900">Your Position</h4>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      #{leaderboardData.current_user_entry.rank} of {leaderboardData.total_participants}
                    </Badge>
                  </div>

                  <div className="text-lg font-bold text-blue-900 mb-1">
                    {formatScore(leaderboardData.current_user_entry.score, leaderboardType)}
                  </div>

                  {showProgress && leaderboardData.current_user_entry.progress_percentage !== undefined && (
                    <div className="mb-2">
                      <Progress value={leaderboardData.current_user_entry.progress_percentage} className="h-2" />
                      <div className="text-xs text-blue-700 mt-1">
                        {leaderboardData.current_user_entry.progress_percentage}% of goal
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderPodiumView = () => {
    if (!leaderboardData || leaderboardData.entries.length < 3) {
      return renderDetailedView();
    }

    const [first, second, third] = leaderboardData.entries;

    return (
      <div className="space-y-4">
        {/* Podium */}
        <div className="flex items-end justify-center gap-4 p-6 bg-gradient-to-t from-yellow-50 to-white rounded-lg">
          {/* Second Place */}
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-gray-300">
              <AvatarImage src={second.user.avatar_url} />
              <AvatarFallback>{second.user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-sm">{second.user.full_name}</div>
            <div className="text-xs text-gray-600 mb-2">
              {formatScore(second.score, leaderboardType)}
            </div>
            <div className="w-16 h-12 bg-gray-300 rounded-t flex items-center justify-center">
              <Medal className="w-6 h-6 text-gray-600" />
            </div>
            <div className="text-xs font-bold text-gray-600">2nd</div>
          </div>

          {/* First Place */}
          <div className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-2 border-4 border-yellow-400">
              <AvatarImage src={first.user.avatar_url} />
              <AvatarFallback>{first.user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-bold text-lg">{first.user.full_name}</div>
            <div className="text-sm text-gray-600 mb-3">
              {formatScore(first.score, leaderboardType)}
            </div>
            <div className="w-20 h-16 bg-yellow-400 rounded-t flex items-center justify-center">
              <Crown className="w-8 h-8 text-yellow-700" />
            </div>
            <div className="text-sm font-bold text-yellow-700">1st</div>
          </div>

          {/* Third Place */}
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-orange-300">
              <AvatarImage src={third.user.avatar_url} />
              <AvatarFallback>{third.user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-sm">{third.user.full_name}</div>
            <div className="text-xs text-gray-600 mb-2">
              {formatScore(third.score, leaderboardType)}
            </div>
            <div className="w-16 h-10 bg-orange-400 rounded-t flex items-center justify-center">
              <Medal className="w-5 h-5 text-orange-700" />
            </div>
            <div className="text-xs font-bold text-orange-700">3rd</div>
          </div>
        </div>

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {leaderboardData.entries.slice(3, maxEntries).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">
                {entry.rank}
              </span>
              
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.user.avatar_url} />
                <AvatarFallback className="text-xs">
                  {entry.user.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="font-medium text-sm">{entry.user.full_name}</div>
                <div className="text-xs text-gray-600">
                  {formatScore(entry.score, leaderboardType)}
                </div>
              </div>

              {showProgress && getRankChange(entry.rank, entry.previous_rank)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">No leaderboard data</div>
        <Button size="sm" variant="outline">
          <Target className="w-4 h-4 mr-2" />
          Start Tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTypeIcon(leaderboardType)}
          <h3 className="font-semibold text-sm capitalize">
            {leaderboardType} Leaderboard
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">
            {timeframe}
          </Badge>
          {(size === 'large' || size === 'full') && (
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Leaderboard Content */}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'detailed' && renderDetailedView()}
      {viewMode === 'podium' && renderPodiumView()}

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {leaderboardData.total_participants} participants
        </div>
        <div>
          Updated {new Date(leaderboardData.last_updated).toLocaleDateString()}
        </div>
      </div>

      {/* View Full Leaderboard */}
      {leaderboardData.entries.length >= maxEntries && (
        <Button variant="ghost" size="sm" className="w-full">
          View Full Leaderboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};