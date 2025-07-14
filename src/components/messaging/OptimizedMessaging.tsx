import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, MessageCircle, Lock, Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useViewport } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { MessagingService, MessageThread, DirectMessage } from '@/services/messaging/MessagingService';

export const OptimizedMessaging = () => {
  const [conversations, setConversations] = useState<MessageThread[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isMobile } = useViewport();
  const { user, isAuthenticated } = useAuth();

  const messagingService = MessagingService.getInstance();

  // Initialize messaging service
  useEffect(() => {
    if (user?.id) {
      messagingService.initialize(user.id);
      loadConversations();
    }
  }, [user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const threads = await messagingService.getThreads();
      setConversations(threads);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      setLoadingMessages(true);
      const threadMessages = await messagingService.getMessages(threadId);
      setMessages(threadMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id || sending) return;

    const selectedConv = conversations.find(c => c.id === selectedConversation);
    if (!selectedConv) return;

    const recipientId = selectedConv.participant_1 === user.id 
      ? selectedConv.participant_2 
      : selectedConv.participant_1;

    try {
      setSending(true);
      
      // Optimistic update
      const optimisticMessage: DirectMessage = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender_id: user.id,
        recipient_id: recipientId,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      scrollToBottom();

      // Send actual message
      const sentMessage = await messagingService.sendMessage(recipientId, newMessage);
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      setNewMessage(newMessage); // Restore message text
      
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    loadMessages(conversationId);
  }, []);

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Please sign in to access messaging</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Security Header */}
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
              {isMobile && conversations.filter(c => c.unread_count > 0).length > 0 && (
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
              {filteredConversations.map((conversation) => (
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
                      <AvatarImage src={conversation.other_user?.avatar_url} />
                      <AvatarFallback>
                        {conversation.other_user?.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conversation.other_user?.full_name}</p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message_at 
                          ? `Last message ${new Date(conversation.last_message_at).toLocaleDateString()}`
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
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConv.other_user?.avatar_url} />
                    <AvatarFallback>
                      {selectedConv.other_user?.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedConv.other_user?.full_name}</h3>
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
                  {loadingMessages ? (
                    <div className="flex justify-center">
                      <div className="animate-pulse text-muted-foreground">Loading messages...</div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } ${message.id.startsWith('temp-') ? 'opacity-60' : ''}`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
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
                      disabled={sending}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sending} 
                      size={isMobile ? "sm" : "default"}
                    >
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