import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { BarChart3, Users, Trophy, Calendar, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface StatsWidgetProps {
  configuration: {
    showMembers?: boolean;
    showEvents?: boolean;
    showChallenges?: boolean;
    showActivity?: boolean;
    timeframe?: '7d' | '30d' | '90d';
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface StatsData {
  totalMembers: number;
  activeMembers: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
  memberGrowth: number;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  const {
    showMembers = true,
    showEvents = true,
    showChallenges = true,
    showActivity = true,
    timeframe = '30d'
  } = configuration;

  useEffect(() => {
    loadStats();
  }, [currentOrganization?.id, timeframe]);

  const loadStats = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Get timeframe dates
      const days = parseInt(timeframe.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total members
      const { data: membersData } = await supabase
        .from('organization_members')
        .select('id, created_at')
        .eq('organization_id', currentOrganization.id);

      // Get active members (logged in last 30 days)
      const { data: activeData } = await supabase
        .from('profiles')
        .select('id')
        .gt('last_seen_at', startDate.toISOString())
        .in('id', membersData?.map(m => m.id) || []);

      // Get upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .gt('start_date', new Date().toISOString())
        .eq('status', 'published');

      // Get active challenges
      const { data: challengesData } = await supabase
        .from('challenges')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active');

      // Get posts in timeframe
      const { data: postsData } = await supabase
        .from('social_posts')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .gt('created_at', startDate.toISOString());

      // Calculate member growth
      const membersInTimeframe = membersData?.filter(
        m => new Date(m.created_at) >= startDate
      ).length || 0;

      const totalMembers = membersData?.length || 0;
      const memberGrowth = totalMembers > 0 
        ? ((membersInTimeframe / totalMembers) * 100) 
        : 0;

      setStats({
        totalMembers,
        activeMembers: activeData?.length || 0,
        upcomingEvents: eventsData?.length || 0,
        activeChallenges: challengesData?.length || 0,
        totalPosts: postsData?.length || 0,
        memberGrowth: Math.round(memberGrowth * 10) / 10
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!stats) return null;

    const items = [];

    if (showMembers) {
      items.push({
        label: 'Members',
        value: stats.totalMembers,
        subtitle: `${stats.activeMembers} active`,
        icon: <Users className="w-4 h-4 text-blue-600" />,
        trend: stats.memberGrowth > 0 ? `+${stats.memberGrowth}%` : null
      });
    }

    if (showEvents) {
      items.push({
        label: 'Events',
        value: stats.upcomingEvents,
        subtitle: 'upcoming',
        icon: <Calendar className="w-4 h-4 text-purple-600" />
      });
    }

    if (showChallenges) {
      items.push({
        label: 'Challenges',
        value: stats.activeChallenges,
        subtitle: 'active',
        icon: <Trophy className="w-4 h-4 text-orange-600" />
      });
    }

    if (showActivity) {
      items.push({
        label: 'Posts',
        value: stats.totalPosts,
        subtitle: `last ${timeframe}`,
        icon: <BarChart3 className="w-4 h-4 text-green-600" />
      });
    }

    // Responsive grid based on size
    const gridCols = size === 'small' ? 'grid-cols-1' : 
                    size === 'medium' ? 'grid-cols-2' :
                    'grid-cols-2 lg:grid-cols-4';

    return (
      <div className={`grid ${gridCols} gap-3`}>
        {items.map((item, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              {item.icon}
              {item.trend && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {item.trend}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <div className="text-xs text-gray-600 capitalize">{item.label}</div>
            <div className="text-xs text-gray-500">{item.subtitle}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailed = () => {
    if (!stats) return null;

    return (
      <div className="space-y-4">
        {/* Member Stats */}
        {showMembers && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">Members</div>
                <div className="text-sm text-blue-700">
                  {stats.activeMembers} of {stats.totalMembers} active
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              {Math.round((stats.activeMembers / stats.totalMembers) * 100)}% active
            </Badge>
          </div>
        )}

        {/* Event Stats */}
        {showEvents && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-semibold text-purple-900">Events</div>
                <div className="text-sm text-purple-700">
                  {stats.upcomingEvents} upcoming events
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Challenge Stats */}
        {showChallenges && (
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-semibold text-orange-900">Challenges</div>
                <div className="text-sm text-orange-700">
                  {stats.activeChallenges} active challenges
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Stats */}
        {showActivity && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">Activity</div>
                <div className="text-sm text-green-700">
                  {stats.totalPosts} posts in last {timeframe}
                </div>
              </div>
            </div>
          </div>
        )}
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

  const canToggleView = size !== 'small';

  return (
    <div className="space-y-3">
      {canToggleView && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last {timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : '90 days'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
            className="h-7 px-2"
          >
            <Eye className="w-3 h-3 mr-1" />
            {viewMode === 'overview' ? 'Details' : 'Overview'}
          </Button>
        </div>
      )}

      {viewMode === 'overview' || size === 'small' ? renderOverview() : renderDetailed()}
    </div>
  );
};