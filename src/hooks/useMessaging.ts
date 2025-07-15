import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { MessagingService, MessageThread, DirectMessage } from '@/services/messaging/MessagingService';
import { useToast } from '@/hooks/use-toast';
import { useMessageCache } from './useMessageCache';
import { useMessagePerformance } from './useMessagePerformance';

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
  const { measureDatabase, measureEncryption } = useMessagePerformance();
  
  const {
    cacheMessages,
    getCachedMessages,
    addMessageToCache,
    cacheThreads,
    getCachedThreads,
    updateUnreadCount,
    getUnreadCount,
    markThreadAsRead,
    totalUnreadCount,
    clearCache
  } = useMessageCache();

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
      
      // Try to get cached threads first
      const cachedThreads = getCachedThreads();
      if (cachedThreads) {
        setThreads(cachedThreads);
        setLoading(false);
        return;
      }
      
      const userThreads = await measureDatabase(
        'load_threads',
        () => messagingService.getThreads(),
        0 // Will be updated with actual count
      );
      setThreads(userThreads);
      cacheThreads(userThreads);
      
      // Update unread counts in cache
      userThreads.forEach(thread => {
        updateUnreadCount(thread.id, thread.unread_count);
      });
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
  }, [user?.id, toast, getCachedThreads, cacheThreads, updateUnreadCount]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setLoadingMessages(true);
      
      // Try to get cached messages first
      const cachedMessages = getCachedMessages(threadId);
      if (cachedMessages) {
        setMessages(cachedMessages);
        setLoadingMessages(false);
        // Mark as read
        markThreadAsRead(threadId);
        return;
      }
      
      const threadMessages = await messagingService.getMessages(threadId);
      setMessages(threadMessages);
      cacheMessages(threadId, threadMessages);
      
      // Mark as read
      markThreadAsRead(threadId);
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
  }, [toast, getCachedMessages, cacheMessages, markThreadAsRead]);

  const sendMessage = useCallback(async (recipientId: string, content: string): Promise<DirectMessage | null> => {
    if (!user?.id || !content.trim()) return null;

    try {
      setSending(true);
      
      // Add optimistic message to UI immediately
      const tempMessage: DirectMessage = {
        id: `temp-${Date.now()}`,
        content: content.trim(),
        sender_id: user.id,
        recipient_id: recipientId,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      const sentMessage = await messagingService.sendMessage(recipientId, content);
      
      // Replace temp message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? sentMessage : msg
        )
      );
      
      // Update cache
      if (selectedThread) {
        addMessageToCache(selectedThread, sentMessage);
      }
      
      // Refresh threads to update last message
      await loadThreads();
      
      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setSending(false);
    }
  }, [user?.id, toast, loadThreads, selectedThread, addMessageToCache]);

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

  // Cleanup on logout
  useEffect(() => {
    if (!user?.id) {
      clearCache();
      messagingService.clearUserData(user?.id || '');
    }
  }, [user?.id, clearCache]);

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
    setSelectedThread,
    totalUnreadCount,
    getUnreadCount
  };
};