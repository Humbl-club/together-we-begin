-- Add indexes for better message query performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants 
ON direct_messages (sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_unread 
ON direct_messages (recipient_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_message_threads_participants 
ON message_threads (participant_1, participant_2);

CREATE INDEX IF NOT EXISTS idx_message_threads_last_message 
ON message_threads (last_message_at DESC NULLS LAST);

-- Enable realtime for message tables
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
ALTER TABLE message_threads REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;