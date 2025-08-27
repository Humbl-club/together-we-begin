-- Fix security issues in the functions by setting proper search_path

-- Update get_unread_counts_for_user function to fix search path
CREATE OR REPLACE FUNCTION get_unread_counts_for_user(user_id_param UUID)
RETURNS TABLE(thread_id UUID, unread_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id as thread_id,
    COUNT(dm.id) as unread_count
  FROM message_threads mt
  LEFT JOIN direct_messages dm ON (
    (dm.sender_id = CASE WHEN mt.participant_1 = user_id_param THEN mt.participant_2 ELSE mt.participant_1 END)
    AND dm.recipient_id = user_id_param
    AND dm.read_at IS NULL
  )
  WHERE mt.participant_1 = user_id_param OR mt.participant_2 = user_id_param
  GROUP BY mt.id;
END;
$$;

-- Update mark_thread_messages_read function to fix search path
CREATE OR REPLACE FUNCTION mark_thread_messages_read(thread_id_param UUID, user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Get thread participants to validate user belongs to thread
  IF NOT EXISTS (
    SELECT 1 FROM message_threads 
    WHERE id = thread_id_param 
    AND (participant_1 = user_id_param OR participant_2 = user_id_param)
  ) THEN
    RAISE EXCEPTION 'User does not belong to this thread';
  END IF;
  
  -- Mark all unread messages as read for this user
  UPDATE direct_messages 
  SET read_at = NOW()
  WHERE recipient_id = user_id_param
  AND read_at IS NULL
  AND (
    SELECT COUNT(*) FROM message_threads mt 
    WHERE mt.id = thread_id_param 
    AND (
      (sender_id = mt.participant_1 AND recipient_id = mt.participant_2) OR
      (sender_id = mt.participant_2 AND recipient_id = mt.participant_1)
    )
  ) > 0;
END;
$$;