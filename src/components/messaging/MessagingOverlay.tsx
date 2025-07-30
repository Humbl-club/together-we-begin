import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Search, MessageCircle, Plus, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { UserSearch } from './UserSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MessagingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessagingOverlay: React.FC<MessagingOverlayProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'threads' | 'messages' | 'new'>('threads');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isMobile } = useViewport();
  const haptics = useHapticFeedback();
  
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (view === 'messages' && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  // Close overlay with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    
    const selectedThreadData = threads.find(t => t.id === selectedThread);
    if (!selectedThreadData) return;
    
    const recipientId = selectedThreadData.participant_1 === user?.id 
      ? selectedThreadData.participant_2 
      : selectedThreadData.participant_1;
    
    await sendMessage(recipientId, newMessage.trim());
    setNewMessage('');
    haptics.tap();
  };

  const handleThreadSelect = (threadId: string) => {
    selectThread(threadId);
    setView('messages');
    haptics.tap();
  };

  const handleNewConversation = async (recipientId: string, initialMessage: string) => {
    await createNewThread(recipientId, initialMessage);
    setView('messages');
    haptics.impact('medium');
  };

  const handleBack = () => {
    if (view === 'messages') {
      setView('threads');
      setSelectedThread(null);
    } else if (view === 'new') {
      setView('threads');
    }
    haptics.tap();
  };

  const filteredThreads = threads.filter(thread => 
    thread.other_user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Overlay Content */}
      <div className={`
        relative w-full max-w-2xl mx-auto
        ${isMobile 
          ? 'h-[85vh] rounded-t-3xl' 
          : 'h-[600px] rounded-2xl m-4'
        }
        glass-modal-enhanced border border-border/40 shadow-2xl
        flex flex-col overflow-hidden
        animate-in duration-300 ease-out
        ${isMobile ? 'slide-in-from-bottom-full' : 'fade-in scale-in'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {(view === 'messages' || view === 'new') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="h-8 w-8 p-0 hover:bg-background/60"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {view === 'threads' && 'Messages'}
                {view === 'messages' && selectedThreadData?.other_user?.full_name}
                {view === 'new' && 'New Conversation'}
              </h2>
              {view === 'threads' && totalUnreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                  {totalUnreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {view === 'threads' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setView('new')}
                className="h-8 bg-background/60 hover:bg-background/80"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-background/60"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Threads View */}
          {view === 'threads' && (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-border/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-background/60 border-border/40"
                  />
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading conversations...</p>
                    </div>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setView('new')}
                        className="bg-background/60 hover:bg-background/80"
                      >
                        Start a conversation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="p-3 rounded-xl hover:bg-background/60 cursor-pointer transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary/50"
                        onClick={() => handleThreadSelect(thread.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-background/60">
                            <AvatarImage src={thread.other_user?.avatar_url} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {thread.other_user?.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate text-foreground">
                                {thread.other_user?.full_name || 'Unknown User'}
                              </p>
                              {thread.unread_count > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-5 text-xs">
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages View */}
          {view === 'messages' && selectedThreadData && (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
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
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background/80 border border-border/40'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
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
              <div className="border-t border-border/40 p-4 bg-background/80 backdrop-blur-xl">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type an encrypted message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 bg-background/60 border-border/40"
                    maxLength={500}
                    disabled={sending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sending} 
                    size="sm"
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Messages are end-to-end encrypted
                </p>
              </div>
            </div>
          )}

          {/* New Conversation View */}
          {view === 'new' && (
            <div className="h-full p-4">
              <UserSearch onSelectUser={handleNewConversation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};