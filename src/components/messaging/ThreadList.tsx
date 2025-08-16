import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageThread } from '@/services/messaging/MessagingService';
import { UserSearch } from './UserSearch';
import { Search, MessageCircle, Lock, Users } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';

interface ThreadListProps {
  threads: MessageThread[];
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onStartConversation: (userId: string, userName: string) => void;
  loading?: boolean;
  totalUnreadCount?: number;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedThreadId,
  onThreadSelect,
  onStartConversation,
  loading = false,
  totalUnreadCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile } = useViewport();

  const filteredThreads = threads.filter(thread =>
    thread.other_user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-[20px] rounded-full text-xs">
                {totalUnreadCount}
              </Badge>
            )}
          </CardTitle>
          <UserSearch onSelectUser={(userId, message) => onStartConversation(userId, message)} />
        </div>
        
        {!isMobile && threads.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {threads.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="w-full h-full" />}
              title="Start Your First Conversation"
              description="Connect with amazing women in our community! Share experiences, support each other, and build meaningful friendships."
              action={{
                label: "Find Someone to Message",
                onClick: () => {
                  // Focus on the user search component if it exists
                  const userSearchButton = document.querySelector('[data-user-search-trigger]');
                  if (userSearchButton) {
                    (userSearchButton as HTMLElement).click();
                  }
                },
                variant: "default"
              }}
            />
            <div className="mt-4">
              <UserSearch onSelectUser={(userId, message) => onStartConversation(userId, message)} />
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={`p-3 hover:bg-muted/50 cursor-pointer border-l-4 transition-colors ${
                  selectedThreadId === thread.id 
                    ? 'border-l-primary bg-muted/30' 
                    : 'border-l-transparent'
                }`}
                onClick={() => onThreadSelect(thread.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.other_user?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        {thread.other_user?.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{thread.other_user?.full_name}</p>
                      <div className="flex items-center gap-2">
                        {thread.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-[20px] rounded-full text-xs">
                            {thread.unread_count}
                          </Badge>
                        )}
                        {thread.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatLastMessageTime(thread.last_message_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.last_message_at 
                        ? 'Tap to continue conversation'
                        : 'Start a conversation'
                      }
                    </p>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};