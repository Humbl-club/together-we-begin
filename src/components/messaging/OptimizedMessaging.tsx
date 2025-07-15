import { useState } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { ThreadList } from './ThreadList';
import { MessageView } from './MessageView';
import { MessageErrorBoundary } from './MessageErrorBoundary';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewport } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle } from 'lucide-react';

export const OptimizedMessaging = () => {
  const { user } = useAuth();
  const { isMobile } = useViewport();
  const { toast } = useToast();
  
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

  const handleSendMessage = async (content: string) => {
    if (!selectedThread) return;

    const thread = threads.find(t => t.id === selectedThread);
    if (!thread) return;

    const recipientId = thread.participant_1 === user?.id 
      ? thread.participant_2 
      : thread.participant_1;

    const sentMessage = await sendMessage(recipientId, content);
    if (!sentMessage) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleStartConversation = async (userId: string, userName: string) => {
    // For now, just show a toast. In a real app, you might want to create the thread
    // when the first message is sent
    toast({
      title: "New Conversation",
      description: `Starting conversation with ${userName}. Send your first message!`,
    });
    
    // You could implement auto-thread creation here if desired
    // await createNewThread(userId, "Hello!");
  };

  const handleBackToList = () => {
    setSelectedThread(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Please sign in to access messaging</p>
        </div>
      </div>
    );
  }

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  return (
    <MessageErrorBoundary
      onError={(error, errorInfo) => {
        // Log error for monitoring
        console.error('Messaging system error:', error, errorInfo);
        toast({
          title: "Messaging Error",
          description: "There was an issue with the messaging system. Please try again.",
          variant: "destructive"
        });
      }}
    >
      <div className="flex flex-col h-full min-h-[600px]">
        <div className={`grid gap-4 flex-1 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {/* Thread List */}
          <div className={`${isMobile ? (selectedThread ? 'hidden' : 'block') : 'col-span-1'}`}>
              <ThreadList
                threads={threads}
                selectedThreadId={selectedThread}
                onThreadSelect={selectThread}
                onStartConversation={handleStartConversation}
                loading={loading}
                totalUnreadCount={totalUnreadCount}
              />
          </div>

          {/* Message View */}
          <div className={`${isMobile ? (selectedThread ? 'block' : 'hidden') : 'col-span-2'}`}>
            <MessageView
              thread={selectedThreadData || null}
              messages={messages}
              onSendMessage={handleSendMessage}
              onBack={isMobile ? handleBackToList : undefined}
              loading={loadingMessages}
              sending={sending}
            />
          </div>
        </div>
      </div>
    </MessageErrorBoundary>
  );
};