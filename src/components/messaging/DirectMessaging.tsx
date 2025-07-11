import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, MoreVertical, Phone, Video } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: string
  media_url?: string
  read_at?: string
  created_at: string
}

interface MessageThread {
  id: string
  participant_1: string
  participant_2: string
  last_message_at?: string
  other_user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface DirectMessagingProps {
  currentUserId: string
}

export const DirectMessaging = ({ currentUserId }: DirectMessagingProps) => {
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadThreads()
  }, [currentUserId])

  useEffect(() => {
    if (selectedThread) {
      loadMessages()
      markMessagesAsRead()
    }
  }, [selectedThread])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadThreads = async () => {
    try {
      // For now, let's simplify and just get basic thread data
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .or(`participant_1.eq.${currentUserId},participant_2.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Get user profiles separately for better type safety
      const threadIds = data?.map(thread => 
        thread.participant_1 === currentUserId ? thread.participant_2 : thread.participant_1
      ) || []

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', threadIds)

      const threadsWithOtherUser: MessageThread[] = data?.map(thread => {
        const otherUserId = thread.participant_1 === currentUserId ? thread.participant_2 : thread.participant_1
        const otherUser = profiles?.find(p => p.id === otherUserId) || {
          id: otherUserId,
          full_name: 'Unknown User'
        }
        
        return {
          ...thread,
          other_user: otherUser
        }
      }) || []

      setThreads(threadsWithOtherUser)
    } catch (error) {
      console.error('Failed to load threads:', error)
      toast({
        title: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!selectedThread) return

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`
          and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedThread}),
          and(sender_id.eq.${selectedThread},recipient_id.eq.${currentUserId})
        `)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast({
        title: "Failed to load messages",
        variant: "destructive"
      })
    }
  }

  const markMessagesAsRead = async () => {
    if (!selectedThread) return

    try {
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', selectedThread)
        .eq('recipient_id', currentUserId)
        .is('read_at', null)
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || isSending) return

    setIsSending(true)
    try {
      const { error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedThread,
          content: newMessage.trim(),
          message_type: 'text'
        })

      if (messageError) throw messageError

      // Update or create thread
      await supabase
        .from('message_threads')
        .upsert({
          participant_1: currentUserId < selectedThread ? currentUserId : selectedThread,
          participant_2: currentUserId < selectedThread ? selectedThread : currentUserId,
          last_message_at: new Date().toISOString()
        })

      setNewMessage('')
      loadMessages()
      loadThreads()
    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h3>
        </div>
        <ScrollArea className="h-full">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread.other_user?.id || '')}
                className={`p-4 border-b cursor-pointer hover:bg-accent ${
                  selectedThread === thread.other_user?.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={thread.other_user?.avatar_url} />
                    <AvatarFallback>
                      {thread.other_user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {thread.other_user?.full_name || 'Unknown User'}
                    </div>
                    {thread.last_message_at && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={threads.find(t => t.other_user?.id === selectedThread)?.other_user?.avatar_url} />
                  <AvatarFallback>
                    {threads.find(t => t.other_user?.id === selectedThread)?.other_user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {threads.find(t => t.other_user?.id === selectedThread)?.other_user?.full_name || 'Unknown User'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_id === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        {message.sender_id === currentUserId && message.read_at && (
                          <span className="ml-2">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || isSending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}