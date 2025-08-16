import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedMessagingService } from '@/services/messaging/OptimizedMessagingService';
import { MessageThread, DirectMessage } from '@/services/messaging/MessagingService';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedMessageCache } from './useOptimizedMessageCache';
import { useMessagePerformance } from './useMessagePerformance';
import { useRequestDeduplication } from './useOptimizedRequests';

export const useMessaging = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagingService = OptimizedMessagingService.getInstance();
  const { measureDatabase, measureEncryption } = useMessagePerformance();
  const { deduplicate, clearCache: clearRequestCache } = useRequestDeduplication();
  
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
  } = useOptimizedMessageCache();

  // Initialize messaging service when user is available
  useEffect(() => {
    if (user?.id) {
      messagingService.initialize(user.id);
      loadThreads();
      
      // Set up global real-time subscription for all threads
      const subscription = supabase
        .channel('user_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
          },
          async (payload) => {
            console.log('New message received:', payload);
            
            try {
              const newMessage = payload.new as any;
              
              // Smart update: only refresh if this is the first new message or affects current view
              const needsRefresh = threads.length === 0 || 
                (selectedThread && threads.find(t => t.id === selectedThread));
              
              if (needsRefresh) {
                // Use cached threads first, then background refresh
                const cachedThreads = getCachedThreads();
                if (cachedThreads) {
                  setThreads(cachedThreads);
                  // Background refresh without blocking UI
                  setTimeout(() => loadThreadsFromDatabase(), 500);
                } else {
                  await loadThreadsFromDatabase();
                }
              }
              
              // If this message is for the currently selected thread, add it to messages
              if (selectedThread) {
                const selectedThreadData = threads.find(t => t.id === selectedThread);
                if (selectedThreadData) {
                  const isMessageForCurrentThread = (
                    (newMessage.sender_id === selectedThreadData.participant_1 && newMessage.recipient_id === selectedThreadData.participant_2) ||
                    (newMessage.sender_id === selectedThreadData.participant_2 && newMessage.recipient_id === selectedThreadData.participant_1)
                  );
                  
                  if (isMessageForCurrentThread) {
                    // For received messages, show encrypted content placeholder for now
                    // Real decryption happens when messages are reloaded
                    const displayMessage = {
                      ...newMessage,
                      content: newMessage.sender_id === user.id 
                        ? newMessage.content 
                        : '[New message - refresh to decrypt]'
                    };
                    
                    setMessages(prev => {
                      // Avoid duplicates
                      if (prev.some(msg => msg.id === displayMessage.id)) {
                        return prev;
                      }
                      return [...prev, displayMessage];
                    });
                    
                    // Mark as read if user is viewing the thread
                    if (newMessage.recipient_id === user.id) {
                      setTimeout(() => {
                        messagingService.markThreadAsRead(selectedThread);
                      }, 1000);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error handling real-time message:', error);
              // Fallback: just refresh threads
              await loadThreads();
            }
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, selectedThread, threads]);

  const loadThreads = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Try to get cached threads first
      const cachedThreads = getCachedThreads();
      if (cachedThreads && cachedThreads.length > 0) {
        setThreads(cachedThreads);
        
        // Only do background refresh if cache is getting stale (>5 minutes)
        const cacheAge = Date.now() - (cachedThreads[0]?.last_message_at ? new Date(cachedThreads[0].last_message_at).getTime() : 0);
        if (cacheAge > 5 * 60 * 1000) {
          setTimeout(() => {
            loadThreadsFromDatabase();
          }, 5000); // Delayed background refresh to avoid UI blocking
        }
        return;
      }
      
      setLoading(true);
      await loadThreadsFromDatabase();
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
  }, [user?.id, toast, getCachedThreads]);

  const loadThreadsFromDatabase = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Use request deduplication to prevent multiple simultaneous calls
      const userThreads = await deduplicate(
        `threads-${user.id}`,
        () => measureDatabase(
          'load_threads',
          () => messagingService.getThreads(),
          0
        )
      );
      
      setThreads(userThreads);
      cacheThreads(userThreads);
      
      // Update unread counts in cache
      userThreads.forEach(thread => {
        updateUnreadCount(thread.id, thread.unread_count);
      });
    } catch (error) {
      console.error('Database load threads error:', error);
      // Don't throw - let the UI handle gracefully
    }
  }, [user?.id, measureDatabase, messagingService, cacheThreads, updateUnreadCount, deduplicate]);

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
      
      // Smart thread refresh: only if needed
      if (selectedThread) {
        // Update local thread state instead of full reload
        setThreads(prev => prev.map(t => 
          t.id === selectedThread 
            ? { ...t, last_message_at: new Date().toISOString() }
            : t
        ));
        // Background refresh without blocking
        setTimeout(() => loadThreadsFromDatabase(), 1000);
      } else {
        await loadThreadsFromDatabase();
      }
      
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
      clearRequestCache();
      messagingService.clearUserData(user?.id || '');
    }
  }, [user?.id, clearCache, clearRequestCache]);

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