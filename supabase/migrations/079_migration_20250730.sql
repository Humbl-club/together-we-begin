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