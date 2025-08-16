-- Create optimized unread count function
CREATE OR REPLACE FUNCTION get_unread_counts_for_user(user_id_param UUID)
RETURNS TABLE(thread_id UUID, unread_count BIGINT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id as thread_id,
    COUNT(dm.id) as unread_count
  FROM message_threads mt
  LEFT JOIN direct_messages dm ON (
    (mt.participant_1 = user_id_param AND dm.sender_id = mt.participant_2 AND dm.recipient_id = user_id_param)
    OR 
    (mt.participant_2 = user_id_param AND dm.sender_id = mt.participant_1 AND dm.recipient_id = user_id_param)
  ) AND dm.read_at IS NULL
  WHERE mt.participant_1 = user_id_param OR mt.participant_2 = user_id_param
  GROUP BY mt.id;
END;
$$;

-- Create function to mark messages as read efficiently
CREATE OR REPLACE FUNCTION mark_thread_messages_read(thread_id_param UUID, user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE direct_messages 
  SET read_at = NOW()
  WHERE recipient_id = user_id_param 
    AND read_at IS NULL
    AND (
      sender_id IN (
        SELECT CASE 
          WHEN participant_1 = user_id_param THEN participant_2 
          ELSE participant_1 
        END
        FROM message_threads 
        WHERE id = thread_id_param
      )
    );
END;
$$;