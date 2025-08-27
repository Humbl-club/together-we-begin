import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { 
  Megaphone, 
  Pin, 
  Clock, 
  Eye,
  Heart,
  MessageSquare,
  Share2,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface AnnouncementsWidgetProps {
  configuration: {
    showPinned?: boolean;
    maxAnnouncements?: number;
    viewMode?: 'compact' | 'detailed' | 'cards';
    showInteractions?: boolean;
    announcementTypes?: string[];
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'system' | 'celebration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  expires_at?: string;
  author: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  interactions: {
    views_count: number;
    likes_count: number;
    comments_count: number;
    has_liked: boolean;
    has_viewed: boolean;
  };
  tags?: string[];
}

// Mock data for development - in production this would come from the database
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to Our New Community Platform! 🎉',
    content: 'We\'re excited to launch our new community platform with enhanced features for events, challenges, and social connections. Explore all the new features and let us know what you think!',
    type: 'general',
    priority: 'high',
    is_pinned: true,
    is_published: true,
    published_at: '2024-01-14T10:00:00Z',
    expires_at: '2024-02-14T10:00:00Z',
    author: {
      id: '1',
      full_name: 'Emma Wilson',
      avatar_url: undefined,
      role: 'admin'
    },
    interactions: {
      views_count: 156,
      likes_count: 42,
      comments_count: 18,
      has_liked: false,
      has_viewed: true
    },
    tags: ['platform', 'launch', 'features']
  },
  {
    id: '2',
    title: 'Monthly Wellness Challenge Starting Soon',
    content: 'Join us for February\'s wellness challenge focusing on mindful movement and self-care. Prizes available for top participants!',
    type: 'event',
    priority: 'medium',
    is_pinned: false,
    is_published: true,
    published_at: '2024-01-13T15:30:00Z',
    expires_at: '2024-01-31T23:59:59Z',
    author: {
      id: '2',
      full_name: 'Sarah Johnson',
      avatar_url: undefined,
      role: 'moderator'
    },
    interactions: {
      views_count: 89,
      likes_count: 27,
      comments_count: 12,
      has_liked: true,
      has_viewed: true
    },
    tags: ['wellness', 'challenge', 'february']
  },
  {
    id: '3',
    title: 'System Maintenance Tonight',
    content: 'We\'ll be performing scheduled maintenance tonight from 11 PM to 2 AM PST. Some features may be temporarily unavailable.',
    type: 'system',
    priority: 'urgent',
    is_pinned: false,
    is_published: true,
    published_at: '2024-01-12T09:00:00Z',
    expires_at: '2024-01-13T02:00:00Z',
    author: {
      id: '3',
      full_name: 'Tech Team',
      avatar_url: undefined,
      role: 'system'
    },
    interactions: {
      views_count: 234,
      likes_count: 5,
      comments_count: 3,
      has_liked: false,
      has_viewed: false
    },
    tags: ['maintenance', 'system', 'downtime']
  }
];

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    showPinned = true,
    maxAnnouncements = size === 'small' ? 2 : size === 'medium' ? 4 : 6,
    viewMode = size === 'small' ? 'compact' : 'detailed',
    showInteractions = size !== 'small',
    announcementTypes = ['general', 'urgent', 'event', 'system', 'celebration']
  } = configuration;

  useEffect(() => {
    loadAnnouncements();
  }, [currentOrganization?.id]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);

      // In production, this would load from the database
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 800));

      let filteredAnnouncements = MOCK_ANNOUNCEMENTS.filter(ann => 
        announcementTypes.includes(ann.type) && ann.is_published
      );

      // Sort by pinned status first, then by date
      filteredAnnouncements.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });

      // Filter expired announcements
      const now = new Date();
      filteredAnnouncements = filteredAnnouncements.filter(ann => 
        !ann.expires_at || new Date(ann.expires_at) > now
      );

      setAnnouncements(filteredAnnouncements.slice(0, maxAnnouncements));

    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'system':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'celebration':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'event':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const handleInteraction = async (announcementId: string, action: 'like' | 'view') => {
    // In production, this would call the API to update interactions
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id === announcementId) {
        if (action === 'like') {
          return {
            ...ann,
            interactions: {
              ...ann.interactions,
              has_liked: !ann.interactions.has_liked,
              likes_count: ann.interactions.has_liked 
                ? ann.interactions.likes_count - 1 
                : ann.interactions.likes_count + 1
            }
          };
        } else if (action === 'view') {
          return {
            ...ann,
            interactions: {
              ...ann.interactions,
              has_viewed: true,
              views_count: ann.interactions.has_viewed 
                ? ann.interactions.views_count 
                : ann.interactions.views_count + 1
            }
          };
        }
      }
      return ann;
    }));
  };

  const renderCompactView = () => (
    <div className="space-y-2">
      {announcements.map((announcement) => (
        <div 
          key={announcement.id} 
          className={`p-3 border-l-4 rounded-r-lg ${getPriorityColor(announcement.priority)}`}
          onClick={() => handleInteraction(announcement.id, 'view')}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {announcement.is_pinned && (
                <Pin className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
              )}
              {getAnnouncementIcon(announcement.type)}
              
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm line-clamp-1">
                  {announcement.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(announcement.published_at)}
                  </span>
                  {showInteractions && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {announcement.interactions.views_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {announcement.interactions.likes_count}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Badge 
              variant="outline" 
              className="ml-2 text-xs capitalize shrink-0"
            >
              {announcement.type}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailedView = () => (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={announcement.author.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {announcement.author.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {announcement.is_pinned && (
                      <Pin className="w-4 h-4 text-gray-500" />
                    )}
                    {getAnnouncementIcon(announcement.type)}
                    <h4 className="font-semibold text-sm line-clamp-1">
                      {announcement.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="font-medium">{announcement.author.full_name}</span>
                    <span>•</span>
                    <span className="capitalize">{announcement.author.role}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(announcement.published_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Badge 
                  variant="outline" 
                  className={`text-xs capitalize ${
                    announcement.priority === 'urgent' ? 'border-red-300 text-red-700' :
                    announcement.priority === 'high' ? 'border-orange-300 text-orange-700' :
                    'border-gray-300 text-gray-700'
                  }`}
                >
                  {announcement.type}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {announcement.content}
            </p>

            {announcement.tags && announcement.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {announcement.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {showInteractions && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto"
                    onClick={() => handleInteraction(announcement.id, 'like')}
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        announcement.interactions.has_liked 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-gray-600'
                      }`} 
                    />
                    <span className="ml-1 text-sm">
                      {announcement.interactions.likes_count}
                    </span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    <span className="ml-1 text-sm">
                      {announcement.interactions.comments_count}
                    </span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye className="w-3 h-3" />
                  {announcement.interactions.views_count} views
                </div>
              </div>
            )}

            {announcement.expires_at && (
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires {formatTimeAgo(announcement.expires_at)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCardsView = () => (
    <div className={`grid gap-3 ${
      size === 'large' || size === 'full' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
    }`}>
      {announcements.map((announcement) => (
        <Card 
          key={announcement.id} 
          className={`overflow-hidden border-l-4 ${
            announcement.priority === 'urgent' ? 'border-l-red-500' :
            announcement.priority === 'high' ? 'border-l-orange-500' :
            'border-l-blue-500'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {announcement.is_pinned && (
                <Pin className="w-4 h-4 text-gray-500" />
              )}
              {getAnnouncementIcon(announcement.type)}
              <Badge variant="outline" className="text-xs capitalize">
                {announcement.type}
              </Badge>
            </div>

            <h4 className="font-semibold text-sm mb-2 line-clamp-2">
              {announcement.title}
            </h4>

            <p className="text-xs text-gray-600 line-clamp-3 mb-3">
              {announcement.content}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>{announcement.author.full_name}</span>
                <span>{formatTimeAgo(announcement.published_at)}</span>
              </div>

              {showInteractions && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {announcement.interactions.likes_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {announcement.interactions.views_count}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8">
        <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">No announcements</div>
        <Button size="sm" variant="outline">
          Create Announcement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Announcements</h3>
          {announcements.filter(a => !a.interactions.has_viewed).length > 0 && (
            <Badge variant="default" className="text-xs">
              {announcements.filter(a => !a.interactions.has_viewed).length} new
            </Badge>
          )}
        </div>
        
        {showPinned && announcements.some(a => a.is_pinned) && (
          <Badge variant="outline" className="text-xs">
            <Pin className="w-3 h-3 mr-1" />
            Pinned
          </Badge>
        )}
      </div>

      {/* Announcements List */}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'detailed' && renderDetailedView()}
      {viewMode === 'cards' && renderCardsView()}

      {/* View All */}
      {announcements.length >= maxAnnouncements && (
        <Button variant="ghost" size="sm" className="w-full">
          View All Announcements
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};