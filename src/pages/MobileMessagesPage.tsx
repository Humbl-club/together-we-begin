import React, { memo, useState, useRef, useEffect } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { MobileFirstCard, MobileFirstCardContent } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Paperclip,
  Smile,
  Mic,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice';
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
}

const MobileMessagesPage: React.FC = memo(() => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'Maya Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
      lastMessage: 'Looking forward to the wellness retreat!',
      timestamp: '2m ago',
      unreadCount: 2,
      online: true
    },
    {
      id: '2',
      name: 'Book Club',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      lastMessage: 'Emma: What did everyone think of chapter 5?',
      timestamp: '1h ago',
      unreadCount: 0,
      online: false
    },
    {
      id: '3',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
      lastMessage: 'Thanks for the motivation! 💪',
      timestamp: '3h ago',
      unreadCount: 1,
      online: true
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      content: 'Hey! How was your morning run?',
      senderId: 'other',
      timestamp: '10:30 AM',
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      content: 'It was amazing! Ran 5K in under 30 minutes 🏃‍♀️',
      senderId: 'me',
      timestamp: '10:32 AM',
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      content: 'That\'s incredible! You\'re getting so fast',
      senderId: 'other',
      timestamp: '10:33 AM',
      type: 'text',
      status: 'read'
    },
    {
      id: '4',
      content: 'Looking forward to the wellness retreat this weekend!',
      senderId: 'other',
      timestamp: '10:35 AM',
      type: 'text',
      status: 'delivered'
    }
  ];

  const handleConversationTap = (conversationId: string) => {
    feedback.tap();
    setActiveConversation(conversationId);
  };

  const handleBack = () => {
    feedback.tap();
    setActiveConversation(null);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    feedback.tap();
    console.log('Send message:', messageInput);
    setMessageInput('');
  };

  const handleVoiceRecord = () => {
    feedback.impact('medium');
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isMobile) {
    // Desktop version
    return (
      <UnifiedLayout>
        <div className="container mx-auto px-8 py-12 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Messages</h1>
          {/* Desktop messages layout */}
        </div>
      </UnifiedLayout>
    );
  }

  // Conversation view
  if (activeConversation) {
    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) return null;

    return (
      <UnifiedLayout>
        <div 
          className="flex flex-col h-screen bg-background"
          style={{
            paddingTop: `max(0px, ${safeAreaInsets.top}px)`,
            paddingBottom: `max(0px, ${safeAreaInsets.bottom}px)`,
            paddingLeft: `max(0px, ${safeAreaInsets.left}px)`,
            paddingRight: `max(0px, ${safeAreaInsets.right}px)`
          }}
        >
          {/* Chat Header */}
          <div className="bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MobileNativeButton
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-10 w-10 p-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </MobileNativeButton>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-foreground">{conversation.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {conversation.online ? 'Online' : 'Last seen 2h ago'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MobileNativeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => feedback.tap()}
                  className="h-10 w-10 p-0"
                >
                  <Phone className="h-5 w-5" />
                </MobileNativeButton>
                <MobileNativeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => feedback.tap()}
                  className="h-10 w-10 p-0"
                >
                  <Video className="h-5 w-5" />
                </MobileNativeButton>
                <MobileNativeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => feedback.tap()}
                  className="h-10 w-10 p-0"
                >
                  <MoreVertical className="h-5 w-5" />
                </MobileNativeButton>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.senderId === 'me' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.senderId === 'me'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    message.senderId === 'me' ? 'justify-end' : 'justify-start'
                  )}>
                    <span className={cn(
                      "text-xs opacity-70",
                      message.senderId === 'me' ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                      {message.timestamp}
                    </span>
                    {message.senderId === 'me' && (
                      <div className="text-xs opacity-70">
                        {message.status === 'sent' && '✓'}
                        {message.status === 'delivered' && '✓✓'}
                        {message.status === 'read' && <span className="text-blue-400">✓✓</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-background/95 backdrop-blur-xl border-t border-border p-4">
            <div className="flex items-end gap-2">
              <MobileNativeButton
                variant="ghost"
                size="sm"
                onClick={() => feedback.tap()}
                className="h-10 w-10 p-0 flex-shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </MobileNativeButton>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-secondary/50 border border-border rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <MobileNativeButton
                  variant="ghost"
                  size="sm"
                  onClick={() => feedback.tap()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </MobileNativeButton>
              </div>
              
              {messageInput.trim() ? (
                <MobileNativeButton
                  variant="primary"
                  size="sm"
                  onClick={handleSendMessage}
                  className="h-10 w-10 p-0 flex-shrink-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </MobileNativeButton>
              ) : (
                <MobileNativeButton
                  variant={isRecording ? "destructive" : "secondary"}
                  size="sm"
                  onClick={handleVoiceRecord}
                  className="h-10 w-10 p-0 flex-shrink-0 rounded-full"
                >
                  <Mic className="h-4 w-4" />
                </MobileNativeButton>
              )}
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Conversations list
  return (
    <UnifiedLayout>
      <div 
        className="min-h-screen bg-background"
        style={{
          paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`,
          paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
          paddingRight: `max(16px, ${safeAreaInsets.right}px)`
        }}
      >
        <div className="space-y-6 px-4">
          {/* Header */}
          <div className="flex items-center justify-between py-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <p className="text-sm text-muted-foreground">Stay connected with your community</p>
            </div>
            
            <div className="flex items-center gap-2">
              <MobileNativeButton
                variant="ghost"
                size="sm"
                onClick={() => feedback.tap()}
              >
                <Search className="h-5 w-5" />
              </MobileNativeButton>
              <MobileNativeButton
                variant="primary"
                size="sm"
                onClick={() => feedback.tap()}
                className="h-10 w-10 p-0 rounded-full"
              >
                <Camera className="h-5 w-5" />
              </MobileNativeButton>
            </div>
          </div>

          {/* Active Conversations */}
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <MobileFirstCard
                key={conversation.id}
                variant="elevated"
                interactive
                padding="md"
                onClick={() => handleConversationTap(conversation.id)}
                className="transform-gpu active:scale-[0.98]"
              >
                <MobileFirstCardContent>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {conversation.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {conversation.timestamp}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs rounded-full px-1.5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </MobileFirstCardContent>
              </MobileFirstCard>
            ))}
          </div>

          {/* Empty State */}
          {conversations.length === 0 && (
            <MobileFirstCard variant="default" padding="lg">
              <MobileFirstCardContent>
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start connecting with other members
                  </p>
                  <MobileNativeButton variant="primary" onClick={() => feedback.tap()}>
                    Find People to Connect
                  </MobileNativeButton>
                </div>
              </MobileFirstCardContent>
            </MobileFirstCard>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
});

export default MobileMessagesPage;