import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageThread, DirectMessage } from '@/services/messaging/MessagingService';
import { MessageInput } from './MessageInput';
import { ArrowLeft, MessageCircle, Lock, MoreVertical, Phone, Video } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDistanceToNow } from 'date-fns';

interface MessageViewProps {
  thread: MessageThread | null;
  messages: DirectMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  sending?: boolean;
}

export const MessageView: React.FC<MessageViewProps> = ({
  thread,
  messages,
  onSendMessage,
  onBack,
  loading = false,
  sending = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useViewport();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch {
      return '';
    }
  };

  const groupMessagesByDate = (messages: DirectMessage[]) => {
    const groups: { [key: string]: DirectMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!thread) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
            <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={thread.other_user?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
              {thread.other_user?.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold">{thread.other_user?.full_name}</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Active now</span>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Messages */}
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading messages...</div>
            </div>
          ) : Object.keys(messageGroups).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h4 className="text-lg font-medium mb-2">Start the conversation</h4>
              <p className="text-muted-foreground mb-4">Send your first encrypted message to {thread.other_user?.full_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>All messages are end-to-end encrypted</span>
              </div>
            </div>
          ) : (
            Object.entries(messageGroups).map(([dateString, dayMessages]) => (
              <div key={dateString} className="space-y-4">
                {/* Date header */}
                <div className="flex justify-center">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {formatDateHeader(dateString)}
                  </div>
                </div>
                
                {/* Messages for this date */}
                {dayMessages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    dayMessages[index - 1]?.sender_id !== message.sender_id
                  );
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && (
                        <Avatar className={`h-6 w-6 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                          <AvatarImage src={thread.other_user?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {thread.other_user?.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[85%] ${isOwn ? 'order-1' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          } ${message.id.startsWith('temp-') ? 'opacity-60' : ''}`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatMessageTime(message.created_at)}
                          {message.id.startsWith('temp-') && ' • Sending...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={sending}
          placeholder={`Message ${thread.other_user?.full_name}...`}
        />
      </CardContent>
    </Card>
  );
};