-- Critical indexes for direct messages performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_messages_recipient_id ON direct_messages(recipient_id);

-- Critical indexes for notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_messages_thread_participants 
ON direct_messages(sender_id, recipient_id, created_at DESC);

-- Partial index for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;