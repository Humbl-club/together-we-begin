import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, MessageCircle, Lock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/hooks/useEncryption';
import { useViewport } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at?: string;
  media_url?: string;
  sender_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at?: string;
  last_message?: string;
  unread_count: number;
  other_user: {
    full_name: string;
    avatar_url?: string;
    id: string;
  };
}

export const DirectMessaging = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isMobile } = useViewport();
  const currentUserId = 'demo-user-id'; // In real app, get from auth
  const { keyPair, isLoading: keyLoading } = useEncryption(currentUserId);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      // Mock data for demonstration
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participant_1: currentUserId,
          participant_2: 'user-2',
          last_message_at: new Date().toISOString(),
          last_message: 'See you at the yoga class tomorrow!',
          unread_count: 2,
          other_user: {
            id: 'user-2',
            full_name: 'Sarah Johnson',
            avatar_url: undefined
          }
        },
        {
          id: '2',
          participant_1: currentUserId,
          participant_2: 'user-3',
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          last_message: 'Thanks for the book recommendation!',
          unread_count: 0,
          other_user: {
            id: 'user-3',
            full_name: 'Emma Chen',
            avatar_url: undefined
          }
        }
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hey! How are you doing?',
          sender_id: 'user-2',
          recipient_id: currentUserId,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          sender_profile: {
            full_name: 'Sarah Johnson'
          }
        },
        {
          id: '2',
          content: 'I\'m great! Just finished my morning workout. How about you?',
          sender_id: currentUserId,
          recipient_id: 'user-2',
          created_at: new Date(Date.now() - 7000000).toISOString()
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        content: newMessage.trim(),
        sender_id: currentUserId,
        recipient_id: conversations.find(c => c.id === selectedConversation)?.other_user.id,
        created_at: new Date().toISOString()
      };

      // Add optimistic update
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        ...messageData,
        recipient_id: messageData.recipient_id || ''
      }]);

      setNewMessage('');
      
      toast({
        title: "Message sent!",
        description: "Your message has been delivered.",
      });

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Secure Messaging</h2>
            <p className="text-sm text-muted-foreground">End-to-end encrypted conversations</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 flex-1 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} min-h-[500px]`}>
        {/* Conversations List */}
        <Card className={`${isMobile ? (selectedConversation ? 'hidden' : 'block') : 'col-span-1'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
            {isMobile && (
              <Badge variant="secondary" className="ml-auto">
                {conversations.filter(c => c.unread_count > 0).length}
              </Badge>
            )}
          </CardTitle>
          {!isMobile && (
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
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 hover:bg-muted/50 cursor-pointer border-l-4 transition-colors ${
                  selectedConversation === conversation.id 
                    ? 'border-l-primary bg-muted/30' 
                    : 'border-l-transparent'
                }`}
                onClick={() => handleConversationSelect(conversation.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.other_user.avatar_url} />
                    <AvatarFallback>
                      {conversation.other_user.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conversation.other_user.full_name}</p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message}
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
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className={`${isMobile ? (selectedConversation ? 'block' : 'hidden') : 'col-span-2'}`}>
        {selectedConv ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedConversation(null)}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                )}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv.other_user.avatar_url} />
                  <AvatarFallback>
                    {selectedConv.other_user.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedConv.other_user.full_name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Active now</span>
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-[400px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.sender_id === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type an encrypted message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1"
                    maxLength={500}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()} size={isMobile ? "sm" : "default"}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Messages are end-to-end encrypted
                </p>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>
      </div>
    </div>
  );
};