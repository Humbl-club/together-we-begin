import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, MessageCircle, Lock, Shield, Plus, ArrowLeft } from 'lucide-react';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { UserSearch } from './UserSearch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const DirectMessaging = () => {
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isMobile } = useMobileFirst();
  
  const {
    threads,
    messages,
    selectedThread,
    loading,
    loadingMessages,
    sending,
    sendMessage,
    createNewThread,
    selectThread,
    setSelectedThread,
    totalUnreadCount
  } = useMessaging();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    
    const selectedThreadData = threads.find(t => t.id === selectedThread);
    if (!selectedThreadData) return;
    
    const recipientId = selectedThreadData.participant_1 === user?.id 
      ? selectedThreadData.participant_2 
      : selectedThreadData.participant_1;
    
    await sendMessage(recipientId, newMessage.trim());
    setNewMessage('');
  };

  const handleNewConversation = async (recipientId: string, initialMessage: string) => {
    await createNewThread(recipientId, initialMessage);
    setShowNewMessageDialog(false);
  };

  const filteredThreads = threads.filter(thread => 
    thread.other_user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedThreadData = threads.find(t => t.id === selectedThread);

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
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Secure Messaging</h2>
            <p className="text-sm text-muted-foreground">End-to-end encrypted conversations</p>
          </div>
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {totalUnreadCount}
            </Badge>
          )}
        </div>
      </div>

      <div className={`grid gap-4 flex-1 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} min-h-[500px]`}>
        {/* Conversations List */}
        <Card className={`${isMobile ? (selectedThread ? 'hidden' : 'block') : 'col-span-1'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
                {threads.filter(t => t.unread_count > 0).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {threads.filter(t => t.unread_count > 0).length}
                  </Badge>
                )}
              </CardTitle>
              
              <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Start New Conversation</DialogTitle>
                    <DialogDescription>
                      Search for a user to start a new conversation
                    </DialogDescription>
                  </DialogHeader>
                  <UserSearch onSelectUser={handleNewConversation} />
                </DialogContent>
              </Dialog>
            </div>
            
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
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowNewMessageDialog(true)}
                  >
                    Start a conversation
                  </Button>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer border-l-4 transition-colors ${
                      selectedThread === thread.id 
                        ? 'border-l-primary bg-muted/30' 
                        : 'border-l-transparent'
                    }`}
                    onClick={() => selectThread(thread.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={thread.other_user?.avatar_url} />
                        <AvatarFallback>
                          {thread.other_user?.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{thread.other_user?.full_name || 'Unknown User'}</p>
                          {thread.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                              {thread.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {thread.last_message_at 
                            ? `Last message ${new Date(thread.last_message_at).toLocaleDateString()}`
                            : 'No messages yet'
                          }
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Encrypted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className={`${isMobile ? (selectedThread ? 'block' : 'hidden') : 'col-span-2'}`}>
          {selectedThreadData ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedThread(null)}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedThreadData.other_user?.avatar_url} />
                    <AvatarFallback>
                      {selectedThreadData.other_user?.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedThreadData.other_user?.full_name || 'Unknown User'}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Encrypted conversation</span>
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col h-[400px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                        <p className="text-xs text-muted-foreground">Start the conversation!</p>
                      </div>
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
                          }`}
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
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      maxLength={500}
                      disabled={sending}
                    />
                    <Button 
                      onClick={handleSendMessage} 
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
                <p className="text-muted-foreground mb-4">Choose a conversation from the list to start messaging</p>
                <Button onClick={() => setShowNewMessageDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};