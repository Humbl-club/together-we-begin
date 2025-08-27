import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Phone, 
  Video,
  MoreHorizontal,
  Pin,
  Archive,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface MessagesWidgetProps {
  configuration: {
    showUnreadOnly?: boolean;
    maxThreads?: number;
    showPreview?: boolean;
    viewMode?: 'compact' | 'detailed' | 'list';
    showActions?: boolean;
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface MessageThread {
  id: string;
  title?: string;
  participants: Participant[];
  last_message: {
    content: string;
    sent_at: string;
    sender_id: string;
    sender_name: string;
  };
  unread_count: number;
  is_group_chat: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  updated_at: string;
}

interface Participant {
  id: string;
  full_name: string;
  avatar_url?: string;
  is_online: boolean;
}

export const MessagesWidget: React.FC<MessagesWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    showUnreadOnly = false,
    maxThreads = size === 'small' ? 3 : size === 'medium' ? 5 : 8,
    showPreview = size !== 'small',
    viewMode = size === 'small' ? 'compact' : 'detailed',
    showActions = size === 'large' || size === 'full'
  } = configuration;

  useEffect(() => {
    loadThreads();
  }, [currentOrganization?.id, showUnreadOnly]);

  const loadThreads = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) return;

      // Get user's message threads
      const { data: threadsData, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          direct_messages!inner (
            id,
            content,
            sent_at,
            sender_id,
            profiles:sender_id (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .contains('participant_ids', [userId])
        .order('updated_at', { ascending: false })
        .limit(maxThreads);

      if (error) throw error;

      if (!threadsData || threadsData.length === 0) {
        setThreads([]);
        return;
      }

      // Get participant details for each thread
      const participantIds = [...new Set(
        threadsData.flatMap(thread => thread.participant_ids.filter((id: string) => id !== userId))
      )];

      const { data: participantsData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, last_seen_at')
        .in('id', participantIds);

      // Calculate online status (last seen within 15 minutes)
      const now = new Date();
      const onlineThreshold = new Date(now.getTime() - 15 * 60 * 1000);

      const participantsMap = new Map(
        participantsData?.map(p => [
          p.id, 
          {
            ...p,
            is_online: p.last_seen_at ? new Date(p.last_seen_at) > onlineThreshold : false
          }
        ]) || []
      );

      // Get unread counts (simplified - in real app this would be more complex)
      const formattedThreads = threadsData.map(thread => {
        const lastMessage = thread.direct_messages?.[0];
        const participants = thread.participant_ids
          .filter((id: string) => id !== userId)
          .map((id: string) => participantsMap.get(id))
          .filter(Boolean);

        return {
          id: thread.id,
          title: thread.thread_name,
          participants,
          last_message: lastMessage ? {
            content: lastMessage.content,
            sent_at: lastMessage.sent_at,
            sender_id: lastMessage.sender_id,
            sender_name: lastMessage.profiles?.full_name || 'Unknown'
          } : null,
          unread_count: Math.floor(Math.random() * 5), // Placeholder
          is_group_chat: participants.length > 1,
          is_pinned: false, // Placeholder
          is_archived: false,
          updated_at: thread.updated_at
        };
      });

      // Filter unread only if requested
      const filteredThreads = showUnreadOnly 
        ? formattedThreads.filter(t => t.unread_count > 0)
        : formattedThreads;

      setThreads(filteredThreads);

    } catch (error) {
      console.error('Error loading message threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    
    return date.toLocaleDateString();
  };

  const getThreadTitle = (thread: MessageThread) => {
    if (thread.title) return thread.title;
    if (thread.is_group_chat) {
      return thread.participants.map(p => p.full_name.split(' ')[0]).join(', ');
    }
    return thread.participants[0]?.full_name || 'Unknown';
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const renderCompactView = () => (
    <div className="space-y-2">
      {threads.map((thread) => (
        <div key={thread.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
          <div className="relative">
            {thread.is_group_chat ? (
              <div className="flex -space-x-2">
                {thread.participants.slice(0, 2).map((participant) => (
                  <Avatar key={participant.id} className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={participant.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {participant.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <Avatar className="w-8 h-8">
                <AvatarImage src={thread.participants[0]?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {thread.participants[0]?.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            
            {!thread.is_group_chat && thread.participants[0]?.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">
                {getThreadTitle(thread)}
              </span>
              <span className="text-xs text-gray-500 shrink-0">
                {thread.last_message && formatTimeAgo(thread.last_message.sent_at)}
              </span>
            </div>
            
            {showPreview && thread.last_message && (
              <div className="text-xs text-gray-600 truncate">
                {thread.last_message.sender_name}: {truncateMessage(thread.last_message.content, 30)}
              </div>
            )}
          </div>

          {thread.unread_count > 0 && (
            <Badge variant="default" className="bg-blue-500 text-white text-xs">
              {thread.unread_count}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  const renderDetailedView = () => (
    <div className="space-y-3">
      {threads.map((thread) => (
        <Card key={thread.id} className="overflow-hidden hover:shadow-md cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="relative">
                {thread.is_group_chat ? (
                  <div className="flex -space-x-2">
                    {thread.participants.slice(0, 3).map((participant) => (
                      <Avatar key={participant.id} className="w-10 h-10 border-2 border-white">
                        <AvatarImage src={participant.avatar_url} />
                        <AvatarFallback>
                          {participant.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                ) : (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={thread.participants[0]?.avatar_url} />
                    <AvatarFallback>
                      {thread.participants[0]?.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {!thread.is_group_chat && thread.participants[0]?.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    {getThreadTitle(thread)}
                  </h4>
                  <div className="flex items-center gap-1">
                    {thread.is_pinned && <Pin className="w-3 h-3 text-gray-400" />}
                    {thread.last_message && (
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(thread.last_message.sent_at)}
                      </span>
                    )}
                  </div>
                </div>

                {thread.is_group_chat && (
                  <div className="text-xs text-gray-600 mb-1">
                    {thread.participants.length + 1} participants
                  </div>
                )}

                {showPreview && thread.last_message && (
                  <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                    <span className="font-medium">{thread.last_message.sender_name}:</span>{' '}
                    {thread.last_message.content}
                  </div>
                )}

                {showActions && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      {!thread.is_group_chat && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Video className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {thread.unread_count > 0 && (
                      <Badge variant="default" className="bg-blue-500 text-white">
                        {thread.unread_count} new
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-1">
      {threads.map((thread) => (
        <div 
          key={thread.id} 
          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={thread.participants[0]?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {thread.participants[0]?.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {thread.participants[0]?.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {getThreadTitle(thread)}
              </div>
              {thread.last_message && (
                <div className="text-xs text-gray-600 truncate">
                  {truncateMessage(thread.last_message.content, 40)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {thread.last_message && (
              <span className="text-xs text-gray-500">
                {formatTimeAgo(thread.last_message.sent_at)}
              </span>
            )}
            {thread.unread_count > 0 && (
              <Badge variant="default" className="bg-blue-500 text-white text-xs">
                {thread.unread_count}
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
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

  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">
          {showUnreadOnly ? 'No unread messages' : 'No conversations yet'}
        </div>
        <Button size="sm" variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Start Conversation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {(size === 'large' || size === 'full') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Messages</h3>
            <Badge variant="outline">
              {threads.reduce((sum, t) => sum + t.unread_count, 0)} unread
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {showActions && (
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages List */}
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'detailed' && renderDetailedView()}
      {viewMode === 'list' && renderListView()}

      {/* View All */}
      {threads.length >= maxThreads && (
        <Button variant="ghost" size="sm" className="w-full">
          View All Messages
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};