-- Add functions for content moderation actions

-- Function to moderate content (posts/comments) by changing their status
CREATE OR REPLACE FUNCTION public.moderate_content(
  content_type text,
  content_ids uuid[],
  new_status text,
  moderator_id uuid,
  reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count INTEGER := 0;
  content_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin(moderator_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can moderate content'
    );
  END IF;

  -- Validate status
  IF new_status NOT IN ('active', 'flagged', 'removed', 'hidden') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid status. Must be: active, flagged, removed, or hidden'
    );
  END IF;

  -- Update content based on type
  IF content_type = 'post' THEN
    UPDATE public.social_posts 
    SET status = new_status::post_status, updated_at = now()
    WHERE id = ANY(content_ids);
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSIF content_type = 'comment' THEN
    -- For comments, we'll use a simple active/inactive approach
    IF new_status IN ('removed', 'hidden') THEN
      DELETE FROM public.post_comments WHERE id = ANY(content_ids);
      GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid content type. Must be: post or comment'
    );
  END IF;

  -- Log moderation actions for each content item
  FOREACH content_id IN ARRAY content_ids
  LOOP
    PERFORM public.log_admin_action(
      'content_moderated',
      content_type,
      content_id,
      jsonb_build_object(
        'new_status', new_status,
        'reason', reason,
        'moderator_id', moderator_id
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'message', format('Successfully moderated %s %s(s)', updated_count, content_type)
  );
END;
$$;

-- Function to get content for moderation (posts and comments with reports)
CREATE OR REPLACE FUNCTION public.get_content_for_moderation(
  content_type text DEFAULT 'all',
  status_filter text DEFAULT 'all',
  search_query text DEFAULT NULL,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE(
  content_id uuid,
  content_type text,
  content text,
  author_id uuid,
  author_name text,
  created_at timestamp with time zone,
  status text,
  reports_count bigint,
  latest_report_reason text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH posts_with_reports AS (
    SELECT 
      sp.id as content_id,
      'post'::text as content_type,
      sp.content,
      sp.user_id as author_id,
      p.full_name as author_name,
      sp.created_at,
      sp.status::text,
      COUNT(cr.id) as reports_count,
      (SELECT reason FROM content_reports cr2 
       WHERE cr2.reported_content_id = sp.id 
       ORDER BY cr2.created_at DESC LIMIT 1) as latest_report_reason
    FROM public.social_posts sp
    LEFT JOIN public.profiles p ON sp.user_id = p.id
    LEFT JOIN public.content_reports cr ON cr.reported_content_id = sp.id AND cr.reported_content_type = 'post'
    WHERE (content_type = 'all' OR content_type = 'post')
      AND (status_filter = 'all' OR sp.status::text = status_filter)
      AND (search_query IS NULL OR sp.content ILIKE '%' || search_query || '%')
    GROUP BY sp.id, sp.content, sp.user_id, p.full_name, sp.created_at, sp.status
  ),
  comments_with_reports AS (
    SELECT 
      pc.id as content_id,
      'comment'::text as content_type,
      pc.content,
      pc.user_id as author_id,
      p.full_name as author_name,
      pc.created_at,
      'active'::text as status,
      COUNT(cr.id) as reports_count,
      (SELECT reason FROM content_reports cr2 
       WHERE cr2.reported_content_id = pc.id 
       ORDER BY cr2.created_at DESC LIMIT 1) as latest_report_reason
    FROM public.post_comments pc
    LEFT JOIN public.profiles p ON pc.user_id = p.id
    LEFT JOIN public.content_reports cr ON cr.reported_content_id = pc.id AND cr.reported_content_type = 'comment'
    WHERE (content_type = 'all' OR content_type = 'comment')
      AND (search_query IS NULL OR pc.content ILIKE '%' || search_query || '%')
    GROUP BY pc.id, pc.content, pc.user_id, p.full_name, pc.created_at
  )
  SELECT * FROM (
    SELECT * FROM posts_with_reports
    UNION ALL
    SELECT * FROM comments_with_reports
  ) combined_content
  ORDER BY reports_count DESC, created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Function to resolve content reports (approve/reject and take action on content)
CREATE OR REPLACE FUNCTION public.resolve_content_reports(
  report_ids uuid[],
  resolution text,
  content_action text DEFAULT NULL,
  moderator_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  moderator_id uuid;
  report_record RECORD;
  affected_content_ids uuid[] := '{}';
  resolved_count INTEGER := 0;
BEGIN
  moderator_id := auth.uid();
  
  -- Check if user is admin
  IF NOT public.is_admin(moderator_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can resolve reports'
    );
  END IF;

  -- Validate resolution
  IF resolution NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Resolution must be: approved or rejected'
    );
  END IF;

  -- Process each report
  FOR report_record IN 
    SELECT id, reported_content_id, reported_content_type, reason
    FROM public.content_reports 
    WHERE id = ANY(report_ids) AND status = 'pending'
  LOOP
    -- Update report status
    UPDATE public.content_reports
    SET 
      status = resolution,
      reviewed_by = moderator_id,
      reviewed_at = now()
    WHERE id = report_record.id;
    
    resolved_count := resolved_count + 1;
    affected_content_ids := array_append(affected_content_ids, report_record.reported_content_id);
    
    -- Take action on content if approved and action specified
    IF resolution = 'approved' AND content_action IS NOT NULL THEN
      PERFORM public.moderate_content(
        report_record.reported_content_type,
        ARRAY[report_record.reported_content_id],
        content_action,
        moderator_id,
        format('Report resolution: %s', report_record.reason)
      );
    END IF;
    
    -- Log the report resolution
    PERFORM public.log_admin_action(
      'report_resolved',
      'content_report',
      report_record.id,
      jsonb_build_object(
        'resolution', resolution,
        'content_action', content_action,
        'moderator_notes', moderator_notes,
        'original_reason', report_record.reason
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'resolved_count', resolved_count,
    'affected_content_ids', affected_content_ids,
    'message', format('Successfully resolved %s report(s)', resolved_count)
  );
END;
$$;