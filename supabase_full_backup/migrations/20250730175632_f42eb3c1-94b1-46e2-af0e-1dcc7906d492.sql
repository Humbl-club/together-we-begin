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

-- Optimize the get_unread_counts_for_user function
CREATE OR REPLACE FUNCTION public.get_unread_counts_for_user(user_id_param uuid)
RETURNS TABLE(thread_id uuid, unread_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_threads AS (
    SELECT id, participant_1, participant_2
    FROM message_threads
    WHERE participant_1 = user_id_param OR participant_2 = user_id_param
  )
  SELECT 
    ut.id as thread_id,
    COUNT(dm.id) as unread_count
  FROM user_threads ut
  LEFT JOIN direct_messages dm ON (
    dm.recipient_id = user_id_param
    AND dm.read_at IS NULL
    AND (
      (dm.sender_id = ut.participant_1 AND dm.recipient_id = ut.participant_2) OR
      (dm.sender_id = ut.participant_2 AND dm.recipient_id = ut.participant_1)
    )
  )
  GROUP BY ut.id;
END;
$function$

-- Create an optimized function for loading threads with all data in one query
CREATE OR REPLACE FUNCTION public.get_user_threads_optimized(user_id_param uuid, page_limit integer DEFAULT 20, page_offset integer DEFAULT 0)
RETURNS TABLE(
  thread_id uuid,
  participant_1 uuid,
  participant_2 uuid,
  last_message_at timestamp with time zone,
  last_message_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_threads AS (
    SELECT 
      mt.id,
      mt.participant_1,
      mt.participant_2,
      mt.last_message_at,
      mt.last_message_id,
      CASE 
        WHEN mt.participant_1 = user_id_param THEN mt.participant_2
        ELSE mt.participant_1
      END as other_user_id
    FROM message_threads mt
    WHERE mt.participant_1 = user_id_param OR mt.participant_2 = user_id_param
    ORDER BY mt.last_message_at DESC NULLS LAST
    LIMIT page_limit OFFSET page_offset
  ),
  thread_unread_counts AS (
    SELECT 
      ut.id as thread_id,
      COUNT(dm.id) as unread_count
    FROM user_threads ut
    LEFT JOIN direct_messages dm ON (
      dm.recipient_id = user_id_param
      AND dm.read_at IS NULL
      AND (
        (dm.sender_id = ut.participant_1 AND dm.recipient_id = ut.participant_2) OR
        (dm.sender_id = ut.participant_2 AND dm.recipient_id = ut.participant_1)
      )
    )
    GROUP BY ut.id
  )
  SELECT 
    ut.id as thread_id,
    ut.participant_1,
    ut.participant_2,
    ut.last_message_at,
    ut.last_message_id,
    ut.other_user_id,
    COALESCE(p.full_name, 'Unknown User') as other_user_name,
    p.avatar_url as other_user_avatar,
    COALESCE(tuc.unread_count, 0) as unread_count
  FROM user_threads ut
  LEFT JOIN profiles p ON p.id = ut.other_user_id
  LEFT JOIN thread_unread_counts tuc ON tuc.thread_id = ut.id
  ORDER BY ut.last_message_at DESC NULLS LAST;
END;
$function$