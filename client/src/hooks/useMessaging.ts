import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedMessagingService } from '@/services/messaging/OptimizedMessagingService';
import { MessageThread, DirectMessage } from '@/services/messaging/MessagingService';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedMessageCache } from './useOptimizedMessageCache';
import { useMessagePerformance } from './useMessagePerformance';
import { useRequestDeduplication } from './useOptimizedRequests';
import { useRateLimited } from './useRateLimited';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ThreadPagination {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number | null;
}

interface MessagePagination {
  [threadId: string]: {
    page: number;
    pageSize: number;
    hasMore: boolean;
    oldestMessageId: string | null;
  };
}

export const useMessaging = () => {
  // Thread state
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [threadPagination, setThreadPagination] = useState<ThreadPagination>({
    page: 0,
    pageSize: 20,
    hasMore: true,
    total: null
  });
  
  // Message state
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messagePagination, setMessagePagination] = useState<MessagePagination>({});
  
  // UI state
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreThreads, setLoadingMoreThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Refs for scroll position tracking
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMessageLoad = useRef(true);
  
  // Hooks
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { executeWithRateLimit } = useRateLimited();
  
  // Services
  const messagingService = OptimizedMessagingService.getInstance();
  const { measureDatabase, measureEncryption } = useMessagePerformance();
  const { deduplicate, clearCache: clearRequestCache } = useRequestDeduplication();
  
  // Cache
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

  // Initialize messaging service
  useEffect(() => {
    if (user?.id) {
      messagingService.initialize(user.id);
      loadThreads();
      setupRealtimeSubscriptions();
    }
    
    return () => {
      if (user?.id) {
        clearCache();
        clearRequestCache();
        messagingService.clearUserData(user.id);
      }
    };
  }, [user?.id, currentOrganization?.id]);

  // Load threads with pagination
  const loadThreads = useCallback(async (append = false) => {
    if (!user || !currentOrganization) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const isLoadingMore = append;
    if (isLoadingMore) {
      setLoadingMoreThreads(true);
    } else {
      setLoading(true);
    }

    try {
      const page = append ? threadPagination.page + 1 : 0;
      
      // Use deduplication to prevent duplicate requests
      const userThreads = await deduplicate(
        `threads-${user.id}-${currentOrganization.id}-page-${page}`,
        () => measureDatabase(
          'load_threads',
          () => messagingService.getThreads(page, threadPagination.pageSize),
          page
        )
      );
      
      // Check if we have more threads
      const hasMore = userThreads.length === threadPagination.pageSize;
      
      setThreadPagination(prev => ({
        ...prev,
        page,
        hasMore
      }));
      
      if (append) {
        setThreads(prev => [...prev, ...userThreads]);
      } else {
        setThreads(userThreads);
        cacheThreads(userThreads);
      }
      
      // Update unread counts
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
      setLoadingMoreThreads(false);
    }
  }, [user, currentOrganization, threadPagination.page, threadPagination.pageSize]);

  // Load more threads
  const loadMoreThreads = useCallback(async () => {
    if (!threadPagination.hasMore || loadingMoreThreads) return;
    await loadThreads(true);
  }, [threadPagination.hasMore, loadingMoreThreads, loadThreads]);

  // Load messages with pagination
  const loadMessages = useCallback(async (threadId: string, append = false) => {
    if (!user || !threadId) return;

    const isLoadingMore = append;
    if (isLoadingMore) {
      setLoadingMoreMessages(true);
    } else {
      setLoadingMessages(true);
      isInitialMessageLoad.current = true;
    }

    try {
      // Get current pagination state for this thread
      const currentPagination = messagePagination[threadId] || {
        page: 0,
        pageSize: 50,
        hasMore: true,
        oldestMessageId: null
      };
      
      const page = append ? currentPagination.page + 1 : 0;
      
      // Try cache first for initial load
      if (!append) {
        const cachedMessages = getCachedMessages(threadId);
        if (cachedMessages && cachedMessages.length > 0) {
          setMessages(cachedMessages);
          setLoadingMessages(false);
          markThreadAsRead(threadId);
          
          // Set pagination based on cached messages
          setMessagePagination(prev => ({
            ...prev,
            [threadId]: {
              page: 0,
              pageSize: 50,
              hasMore: cachedMessages.length === 50,
              oldestMessageId: cachedMessages[0]?.id || null
            }
          }));
          return;
        }
      }
      
      // Load from database with rate limiting
      const threadMessages = await executeWithRateLimit(
        () => messagingService.getMessages(threadId, page, currentPagination.pageSize),
        { configKey: 'api:read', showToast: false }
      );
      
      // Update pagination state
      const hasMore = threadMessages.length === currentPagination.pageSize;
      const oldestId = threadMessages.length > 0 ? threadMessages[0].id : currentPagination.oldestMessageId;
      
      setMessagePagination(prev => ({
        ...prev,
        [threadId]: {
          page,
          pageSize: currentPagination.pageSize,
          hasMore,
          oldestMessageId: oldestId
        }
      }));
      
      if (append) {
        // Prepend older messages (they come in ascending order)
        setMessages(prev => [...threadMessages, ...prev]);
        
        // Maintain scroll position when prepending
        if (messageContainerRef.current) {
          const scrollHeight = messageContainerRef.current.scrollHeight;
          requestAnimationFrame(() => {
            if (messageContainerRef.current) {
              const newScrollHeight = messageContainerRef.current.scrollHeight;
              messageContainerRef.current.scrollTop = newScrollHeight - scrollHeight;
            }
          });
        }
      } else {
        setMessages(threadMessages);
        cacheMessages(threadId, threadMessages);
        
        // Scroll to bottom on initial load
        if (isInitialMessageLoad.current && messageContainerRef.current) {
          requestAnimationFrame(() => {
            if (messageContainerRef.current) {
              messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
          });
          isInitialMessageLoad.current = false;
        }
      }
      
      // Mark thread as read
      if (!append) {
        markThreadAsRead(threadId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
    }
  }, [user, messagePagination, getCachedMessages, cacheMessages, markThreadAsRead, executeWithRateLimit, toast]);

  // Load more messages for current thread
  const loadMoreMessages = useCallback(async () => {
    if (!selectedThread) return;
    
    const pagination = messagePagination[selectedThread];
    if (!pagination?.hasMore || loadingMoreMessages) return;
    
    await loadMessages(selectedThread, true);
  }, [selectedThread, messagePagination, loadingMoreMessages, loadMessages]);

  // Send a message with rate limiting
  const sendMessage = useCallback(async (recipientId: string, content: string): Promise<DirectMessage | null> => {
    if (!user?.id || !content.trim()) return null;

    return executeWithRateLimit(
      async () => {
        setSending(true);
        
        try {
          // Add optimistic message
          const tempMessage: DirectMessage = {
            id: `temp-${Date.now()}`,
            content: content.trim(),
            sender_id: user.id,
            recipient_id: recipientId,
            created_at: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, tempMessage]);
          
          // Scroll to bottom
          if (messageContainerRef.current) {
            requestAnimationFrame(() => {
              if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
              }
            });
          }
          
          // Send message
          const sentMessage = await messagingService.sendMessage(recipientId, content);
          
          // Replace temp message with real one
          setMessages(prev => 
            prev.map(msg => msg.id === tempMessage.id ? sentMessage : msg)
          );
          
          // Update cache
          if (selectedThread) {
            addMessageToCache(selectedThread, sentMessage);
          }
          
          // Update thread list
          await loadThreads();
          
          return sentMessage;
        } finally {
          setSending(false);
        }
      },
      { configKey: 'messages:send', showToast: true }
    );
  }, [user?.id, selectedThread, executeWithRateLimit, addMessageToCache, loadThreads]);

  // Create a new thread
  const createNewThread = useCallback(async (recipientId: string, initialMessage: string) => {
    const sentMessage = await sendMessage(recipientId, initialMessage);
    if (sentMessage) {
      await loadThreads();
      
      // Find and select the new thread
      const newThread = threads.find(t => 
        (t.participant_1 === user?.id && t.participant_2 === recipientId) ||
        (t.participant_1 === recipientId && t.participant_2 === user?.id)
      );
      
      if (newThread) {
        setSelectedThread(newThread.id);
        await loadMessages(newThread.id);
      }
    }
  }, [sendMessage, loadThreads, threads, user?.id, loadMessages]);

  // Select a thread
  const selectThread = useCallback((threadId: string) => {
    setSelectedThread(threadId);
    loadMessages(threadId);
  }, [loadMessages]);

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user?.id || !currentOrganization?.id) return;

    const subscription = supabase
      .channel(`user_messages_${user.id}_${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        async (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          // Check if message is for current user
          if (newMessage.sender_id !== user.id && newMessage.recipient_id !== user.id) {
            return;
          }
          
          // Refresh threads if it's a new conversation
          const existingThread = threads.find(t => 
            (t.participant_1 === newMessage.sender_id && t.participant_2 === newMessage.recipient_id) ||
            (t.participant_1 === newMessage.recipient_id && t.participant_2 === newMessage.sender_id)
          );
          
          if (!existingThread) {
            await loadThreads();
          } else {
            // Update thread's last message time
            setThreads(prev => prev.map(t => 
              t.id === existingThread.id 
                ? { ...t, last_message_at: newMessage.created_at }
                : t
            ).sort((a, b) => 
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            ));
          }
          
          // Add message to current thread if it's selected
          if (selectedThread && existingThread?.id === selectedThread) {
            if (newMessage.sender_id !== user.id) {
              // It's a received message, add it
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(msg => msg.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
              
              // Mark as read after delay
              setTimeout(() => {
                messagingService.markThreadAsRead(selectedThread);
              }, 1000);
            }
          } else if (existingThread) {
            // Update unread count for other threads
            updateUnreadCount(existingThread.id, (existingThread.unread_count || 0) + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, currentOrganization?.id, threads, selectedThread, loadThreads, updateUnreadCount]);

  // Check if near top for loading older messages
  const handleMessageScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    
    // Load more messages when scrolled near top (within 100px)
    if (container.scrollTop < 100 && selectedThread) {
      const pagination = messagePagination[selectedThread];
      if (pagination?.hasMore && !loadingMoreMessages) {
        loadMoreMessages();
      }
    }
  }, [selectedThread, messagePagination, loadingMoreMessages, loadMoreMessages]);

  return {
    // Thread data
    threads,
    loading,
    loadingMoreThreads,
    hasMoreThreads: threadPagination.hasMore,
    loadMoreThreads,
    
    // Message data
    messages,
    loadingMessages,
    loadingMoreMessages,
    hasMoreMessages: selectedThread ? messagePagination[selectedThread]?.hasMore || false : false,
    loadMoreMessages,
    
    // Actions
    sendMessage,
    createNewThread,
    selectThread,
    setSelectedThread,
    
    // UI helpers
    selectedThread,
    sending,
    totalUnreadCount,
    getUnreadCount,
    messageContainerRef,
    handleMessageScroll,
    
    // Refresh
    refetch: () => loadThreads()
  };
};