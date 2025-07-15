import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MessagingService, MessageThread, DirectMessage } from '@/services/messaging/MessagingService';
import { useToast } from '@/hooks/use-toast';

export const useMessaging = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagingService = MessagingService.getInstance();

  // Initialize messaging service when user is available
  useEffect(() => {
    if (user?.id) {
      messagingService.initialize(user.id);
      loadThreads();
    }
  }, [user?.id]);

  const loadThreads = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userThreads = await messagingService.getThreads();
      setThreads(userThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setLoadingMessages(true);
      const threadMessages = await messagingService.getMessages(threadId);
      setMessages(threadMessages);
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
  }, [toast]);

  const sendMessage = useCallback(async (recipientId: string, content: string): Promise<DirectMessage | null> => {
    if (!user?.id || !content.trim()) return null;

    try {
      setSending(true);
      const sentMessage = await messagingService.sendMessage(recipientId, content);
      
      // Add message to current messages if viewing the thread
      setMessages(prev => [...prev, sentMessage]);
      
      // Refresh threads to update last message
      await loadThreads();
      
      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return null;
    } finally {
      setSending(false);
    }
  }, [user?.id, toast, loadThreads]);

  const createNewThread = useCallback(async (recipientId: string, initialMessage: string) => {
    const sentMessage = await sendMessage(recipientId, initialMessage);
    if (sentMessage) {
      await loadThreads();
      // Find the new thread and select it
      const newThread = threads.find(t => 
        (t.participant_1 === user?.id && t.participant_2 === recipientId) ||
        (t.participant_1 === recipientId && t.participant_2 === user?.id)
      );
      if (newThread) {
        setSelectedThread(newThread.id);
        await loadMessages(newThread.id);
      }
    }
  }, [sendMessage, loadThreads, loadMessages, threads, user?.id]);

  const selectThread = useCallback((threadId: string) => {
    setSelectedThread(threadId);
    loadMessages(threadId);
  }, [loadMessages]);

  return {
    threads,
    messages,
    selectedThread,
    loading,
    loadingMessages,
    sending,
    loadThreads,
    loadMessages,
    sendMessage,
    createNewThread,
    selectThread,
    setSelectedThread
  };
};