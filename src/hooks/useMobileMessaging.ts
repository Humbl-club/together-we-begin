import { useState, useEffect, useCallback, useRef } from 'react';
import { MobileMessagingService } from '@/services/messaging/MobileMessagingService';
import ConnectionService from '@/services/ConnectionService';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { MessageThread, DirectMessage } from '@/services/messaging/MessagingService';

export const useMobileMessaging = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'poor'>('online');
  const [retryCount, setRetryCount] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();
  const messagingService = useRef<MobileMessagingService>(MobileMessagingService.getInstance());
  const connectionService = useRef<ConnectionService>(ConnectionService.getInstance());
  const subscriptionRef = useRef<any>(null);

  // Connection status monitoring
  useEffect(() => {
    const unsubscribe = connectionService.current.subscribe((status) => {
      setConnectionStatus(status.isOnline ? 'online' : 'offline');
      
      if (!status.isOnline) {
        toast({
          title: "Connection Lost",
          description: "Messages may not sync until connection is restored",
          variant: "destructive"
        });
      } else if (connectionStatus === 'offline') {
        toast({
          title: "Connection Restored",
          description: "Syncing messages..."
        });
        // Refresh threads when connection is restored
        loadThreads();
      }
    });

    return unsubscribe;
  }, [connectionStatus]);

  // Initialize messaging service
  useEffect(() => {
    if (user?.id) {
      initializeMessaging();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user?.id]);

  const initializeMessaging = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      await messagingService.current.initialize(user.id);
      await loadThreads();
    } catch (error: any) {
      console.error('Failed to initialize messaging:', error);
      toast({
        title: "Messaging Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async () => {
    if (!user?.id) return;

    try {
      const threadsData = await messagingService.current.getThreads();
      setThreads(threadsData);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Failed to load threads:', error);
      setRetryCount(prev => prev + 1);
      
      if (error.message.includes('connection') || error.message.includes('network')) {
        setConnectionStatus('poor');
        toast({
          title: "Connection Issues",
          description: "Having trouble loading messages. Retrying...",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Loading Error",
          description: "Failed to load conversations. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const selectThread = useCallback(async (threadId: string) => {
    setSelectedThread(threadId);
    setLoadingMessages(true);
    
    try {
      const messagesData = await messagingService.current.getMessages(threadId);
      setMessages(messagesData);
      
      // Subscribe to real-time updates
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      subscriptionRef.current = messagingService.current.subscribeToMessages(
        threadId,
        (newMessage) => {
          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      );
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Messages Error",  
        description: "Failed to load messages for this conversation",
        variant: "destructive"
      });
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [toast]);

  const sendMessage = async (recipientId: string, content: string) => {
    if (!user?.id) return;

    setSending(true);
    
    // Optimistic update
    const tempMessage: DirectMessage = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: user.id,
      recipient_id: recipientId,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);

    try {
      const sentMessage = await messagingService.current.sendMessage(recipientId, content);
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? sentMessage : msg)
      );
      
      // Refresh threads to update last message
      setTimeout(() => loadThreads(), 500);
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Remove temp message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      let errorMessage = "Failed to send message";
      if (error.message.includes('connection')) {
        errorMessage = "No internet connection";
      } else if (error.message.includes('Rate limit')) {
        errorMessage = "You're sending messages too quickly";
      }
      
      toast({
        title: "Send Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const createNewThread = async (recipientId: string, initialMessage: string) => {
    await sendMessage(recipientId, initialMessage);
    await loadThreads();
    
    // Find and select the new thread
    const newThread = threads.find(t => 
      (t.participant_1 === user?.id && t.participant_2 === recipientId) ||
      (t.participant_2 === user?.id && t.participant_1 === recipientId)
    );
    
    if (newThread) {
      selectThread(newThread.id);
    }
  };

  const retryConnection = async () => {
    if (connectionStatus === 'offline') {
      toast({
        description: "Still offline. Please check your internet connection.",
        variant: "destructive"
      });
      return;
    }
    
    await loadThreads();
  };

  const cleanup = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    setThreads([]);
    setMessages([]);
    setSelectedThread(null);
    setLoading(false);
    setLoadingMessages(false);
    setSending(false);
  };

  // Calculate total unread count
  const totalUnreadCount = threads.reduce((total, thread) => total + thread.unread_count, 0);

  return {
    threads,
    messages,
    selectedThread,
    loading,
    loadingMessages,
    sending,
    connectionStatus,
    retryCount,
    totalUnreadCount,
    sendMessage,
    createNewThread,
    selectThread,
    setSelectedThread,
    loadThreads,
    retryConnection
  };
};