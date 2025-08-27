-- Advanced database optimizations for elite performance (fixed)

-- Advanced composite indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_events_status_time_composite 
ON events(status, start_time) 
WHERE status IN ('upcoming', 'ongoing');

CREATE INDEX IF NOT EXISTS idx_social_posts_user_status_time 
ON social_posts(user_id, status, created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_challenge_participations_user_completed 
ON challenge_participations(user_id, completed, completion_date DESC) 
WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_type_time 
ON loyalty_transactions(user_id, type, created_at DESC);

-- Partial indexes for frequently filtered data
CREATE INDEX IF NOT EXISTS idx_events_upcoming_status 
ON events(start_time ASC) 
WHERE status = 'upcoming';

CREATE INDEX IF NOT EXISTS idx_challenges_active_only 
ON challenges(created_at DESC) 
WHERE status = 'active';

-- Full-text search indexes for advanced search
CREATE INDEX IF NOT EXISTS idx_events_search 
ON events USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')));

CREATE INDEX IF NOT EXISTS idx_posts_search 
ON social_posts USING gin(to_tsvector('english', COALESCE(content, '')))
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING gin(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(username, '') || ' ' || COALESCE(bio, '')));

-- Advanced function for optimized dashboard data retrieval
CREATE OR REPLACE FUNCTION get_user_dashboard_optimized(user_id_param UUID)
RETURNS TABLE (
  user_data JSONB,
  stats_data JSONB,
  recent_activity JSONB
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_profile AS (
    SELECT 
      p.id,
      p.full_name,
      p.avatar_url,
      p.available_loyalty_points,
      p.total_loyalty_points
    FROM profiles p
    WHERE p.id = user_id_param
  ),
  user_stats AS (
    SELECT 
      COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'upcoming' AND e.start_time >= CURRENT_TIMESTAMP) as upcoming_events,
      COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_challenges,
      COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'active') as total_posts,
      COALESCE(SUM(lt.points) FILTER (WHERE lt.type = 'earned' AND lt.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'), 0) as recent_points
    FROM profiles p
    LEFT JOIN event_registrations er ON p.id = er.user_id
    LEFT JOIN events e ON er.event_id = e.id
    LEFT JOIN challenge_participations cp ON p.id = cp.user_id
    LEFT JOIN challenges c ON cp.challenge_id = c.id
    LEFT JOIN social_posts sp ON p.id = sp.user_id
    LEFT JOIN loyalty_transactions lt ON p.id = lt.user_id
    WHERE p.id = user_id_param
  ),
  recent_events AS (
    SELECT json_agg(
      json_build_object(
        'id', e.id,
        'title', e.title,
        'start_time', e.start_time,
        'location', e.location
      ) ORDER BY e.start_time ASC
    ) as events
    FROM events e
    WHERE e.status = 'upcoming' 
      AND e.start_time >= CURRENT_TIMESTAMP
      AND e.start_time <= CURRENT_TIMESTAMP + INTERVAL '7 days'
    LIMIT 3
  ),
  recent_posts AS (
    SELECT json_agg(
      json_build_object(
        'id', sp.id,
        'content', LEFT(sp.content, 100),
        'created_at', sp.created_at,
        'likes_count', sp.likes_count
      ) ORDER BY sp.created_at DESC
    ) as posts
    FROM social_posts sp
    WHERE sp.user_id = user_id_param 
      AND sp.status = 'active'
    LIMIT 5
  )
  SELECT 
    json_build_object(
      'id', up.id,
      'full_name', up.full_name,
      'avatar_url', up.avatar_url
    ) as user_data,
    json_build_object(
      'loyalty_points', up.available_loyalty_points,
      'upcoming_events', us.upcoming_events,
      'active_challenges', us.active_challenges,
      'total_posts', us.total_posts,
      'recent_points', us.recent_points
    ) as stats_data,
    json_build_object(
      'events', COALESCE(re.events, '[]'::json),
      'posts', COALESCE(rp.posts, '[]'::json)
    ) as recent_activity
  FROM user_profile up
  CROSS JOIN user_stats us
  CROSS JOIN recent_events re
  CROSS JOIN recent_posts rp;
END;
$$;