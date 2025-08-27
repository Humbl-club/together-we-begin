-- Critical Performance Indexes for Messaging System
-- These indexes will dramatically improve query performance

-- Index for finding threads by participants (most critical for load_threads performance)
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads 
USING btree (participant_1, participant_2);

-- Index for thread lookup and ordering by last message time
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON message_threads 
USING btree (last_message_at DESC NULLS LAST);

-- Composite index for user-specific thread queries (eliminates 3+ second queries)
CREATE INDEX IF NOT EXISTS idx_message_threads_user_time ON message_threads 
USING btree (participant_1, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_message_threads_user2_time ON message_threads 
USING btree (participant_2, last_message_at DESC NULLS LAST);

-- Index for direct messages by thread participants (critical for message loading)
CREATE INDEX IF NOT EXISTS idx_direct_messages_thread_lookup ON direct_messages 
USING btree (sender_id, recipient_id, created_at);

-- Index for unread message counting
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_read ON direct_messages 
USING btree (recipient_id, read_at);

-- Partial index for unread messages only (much faster)
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages 
USING btree (recipient_id, created_at) WHERE read_at IS NULL;

-- Index for real-time message filtering
CREATE INDEX IF NOT EXISTS idx_direct_messages_realtime ON direct_messages 
USING btree (created_at DESC);