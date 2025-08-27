import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { Users, UserPlus, Crown, Activity, MapPin, ArrowRight, MessageCircle } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface MembersWidgetProps {
  configuration: {
    showRecentJoins?: boolean;
    showActiveMembers?: boolean;
    maxMembers?: number;
    viewMode?: 'list' | 'grid' | 'compact';
    showRoles?: boolean;
    showActivity?: boolean;
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  joined_at: string;
  last_seen_at?: string;
  role: 'owner' | 'admin' | 'member';
  is_online: boolean;
  activity_score?: number;
  mutual_connections?: number;
}

export const MembersWidget: React.FC<MembersWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [recentJoins, setRecentJoins] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'all' | 'recent' | 'active'>('all');

  const {
    showRecentJoins = true,
    showActiveMembers = true,
    maxMembers = size === 'small' ? 4 : size === 'medium' ? 8 : 12,
    viewMode = size === 'small' ? 'compact' : 'grid',
    showRoles = size !== 'small',
    showActivity = size === 'large' || size === 'full'
  } = configuration;

  useEffect(() => {
    loadMembers();
  }, [currentOrganization?.id, activeView]);

  const loadMembers = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Get organization members with profiles
      const { data: membersData, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            location,
            last_seen_at
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('joined_at', { ascending: false })
        .limit(maxMembers * 2); // Get more to filter

      if (error) throw error;

      if (!membersData) {
        setMembers([]);
        return;
      }

      // Calculate online status (last seen within 15 minutes)
      const now = new Date();
      const onlineThreshold = new Date(now.getTime() - 15 * 60 * 1000);

      const formattedMembers = membersData
        .filter(member => member.profiles) // Filter out members without profiles
        .map(member => {
          const profile = member.profiles;
          const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at) : null;
          const isOnline = lastSeen ? lastSeen > onlineThreshold : false;

          return {
            id: profile.id,
            full_name: profile.full_name || 'Unknown User',
            email: profile.email,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            location: profile.location,
            joined_at: member.joined_at,
            last_seen_at: profile.last_seen_at,
            role: member.role,
            is_online: isOnline,
            activity_score: Math.floor(Math.random() * 100), // Placeholder
            mutual_connections: Math.floor(Math.random() * 20) // Placeholder
          };
        });

      // Filter based on active view
      let filteredMembers = formattedMembers;
      
      if (activeView === 'recent') {
        // Members who joined in the last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredMembers = formattedMembers.filter(
          member => new Date(member.joined_at) > thirtyDaysAgo
        );
        setRecentJoins(filteredMembers.slice(0, maxMembers));
      } else if (activeView === 'active') {
        // Members who were active in the last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredMembers = formattedMembers.filter(
          member => member.last_seen_at && new Date(member.last_seen_at) > sevenDaysAgo
        );
      }

      setMembers(filteredMembers.slice(0, maxMembers));

    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const joinDate = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - joinDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Joined today';
    if (diffDays === 1) return 'Joined yesterday';
    if (diffDays < 7) return `Joined ${diffDays}d ago`;
    if (diffDays < 30) return `Joined ${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `Joined ${Math.floor(diffDays / 30)}mo ago`;
    
    return joinDate.toLocaleDateString();
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Never active';
    
    const lastSeen = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Active now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Crown className="w-3 h-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const renderCompactView = () => (
    <div className="space-y-2">
      {members.slice(0, size === 'small' ? 6 : 8).map((member) => (
        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="text-xs">
                  {member.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {member.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm truncate">{member.full_name}</span>
                {showRoles && getRoleIcon(member.role)}
              </div>
              <div className="text-xs text-gray-500">
                {member.is_online ? 'Online' : formatLastSeen(member.last_seen_at)}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="p-1 shrink-0">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className={`grid gap-3 ${
      size === 'large' || size === 'full' 
        ? 'grid-cols-2 lg:grid-cols-3' 
        : size === 'medium' 
          ? 'grid-cols-2' 
          : 'grid-cols-1'
    }`}>
      {members.map((member) => (
        <Card key={member.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {member.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <h4 className="font-semibold text-sm truncate">{member.full_name}</h4>
                  {showRoles && getRoleIcon(member.role)}
                </div>
                
                {showRoles && (
                  <Badge 
                    variant="outline" 
                    className="text-xs capitalize"
                  >
                    {member.role}
                  </Badge>
                )}
              </div>
            </div>

            {member.bio && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {member.bio}
              </p>
            )}

            {member.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{member.location}</span>
              </div>
            )}

            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className={member.is_online ? 'text-green-600' : ''}>
                  {member.is_online ? 'Online' : formatLastSeen(member.last_seen_at)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Joined:</span>
                <span>{formatJoinDate(member.joined_at)}</span>
              </div>

              {showActivity && member.activity_score !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Activity:</span>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>{member.activity_score}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1">
                <MessageCircle className="w-3 h-3 mr-1" />
                Message
              </Button>
              <Button size="sm" variant="ghost">
                <UserPlus className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback>
                  {member.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {member.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{member.full_name}</span>
                {showRoles && getRoleIcon(member.role)}
                {showRoles && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {member.role}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {member.is_online ? 'Online now' : formatLastSeen(member.last_seen_at)}
                </span>
                <span>{formatJoinDate(member.joined_at)}</span>
                {member.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {member.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">
          No {activeView === 'recent' ? 'recent' : activeView === 'active' ? 'active' : ''} members found
        </div>
        <Button size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      {(size === 'large' || size === 'full') && showRecentJoins && showActiveMembers && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'all' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView('all')}
            >
              All
            </Button>
            <Button
              variant={activeView === 'active' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView('active')}
            >
              Active
            </Button>
            <Button
              variant={activeView === 'recent' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView('recent')}
            >
              Recent
            </Button>
          </div>
          
          <Badge variant="outline">
            {members.length} members
          </Badge>
        </div>
      )}

      {/* Members Display */}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'list' && renderListView()}

      {members.length >= maxMembers && (
        <Button variant="ghost" size="sm" className="w-full">
          View All Members
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};