-- Advanced database optimizations for elite performance

-- Create materialized views for dashboard data
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.available_loyalty_points,
  p.total_loyalty_points,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'upcoming' AND e.start_time >= NOW()) as upcoming_events,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_challenges,
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'active') as total_posts,
  COALESCE(SUM(lt.points) FILTER (WHERE lt.type = 'earned' AND lt.created_at >= NOW() - INTERVAL '30 days'), 0) as recent_points
FROM profiles p
LEFT JOIN event_registrations er ON p.id = er.user_id
LEFT JOIN events e ON er.event_id = e.id
LEFT JOIN challenge_participations cp ON p.id = cp.user_id
LEFT JOIN challenges c ON cp.challenge_id = c.id
LEFT JOIN social_posts sp ON p.id = sp.user_id
LEFT JOIN loyalty_transactions lt ON p.id = lt.user_id
GROUP BY p.id, p.full_name, p.avatar_url, p.available_loyalty_points, p.total_loyalty_points;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX idx_dashboard_stats_user_id ON dashboard_stats(user_id);

-- Advanced composite indexes for query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_time_composite 
ON events(status, start_time) 
WHERE status IN ('upcoming', 'ongoing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_user_status_time 
ON social_posts(user_id, status, created_at DESC) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_participations_user_completed 
ON challenge_participations(user_id, completed, completion_date DESC) 
WHERE completed = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loyalty_transactions_user_type_time 
ON loyalty_transactions(user_id, type, created_at DESC);

-- Partial indexes for frequently filtered data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming_only 
ON events(start_time ASC) 
WHERE status = 'upcoming' AND start_time >= NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active_only 
ON challenges(created_at DESC) 
WHERE status = 'active';

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
  WITH user_stats AS (
    SELECT 
      ds.user_id,
      ds.full_name,
      ds.avatar_url,
      ds.available_loyalty_points,
      ds.total_loyalty_points,
      ds.upcoming_events,
      ds.active_challenges,
      ds.total_posts,
      ds.recent_points
    FROM dashboard_stats ds
    WHERE ds.user_id = user_id_param
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
      AND e.start_time >= NOW()
      AND e.start_time <= NOW() + INTERVAL '7 days'
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
      'id', us.user_id,
      'full_name', us.full_name,
      'avatar_url', us.avatar_url
    ) as user_data,
    json_build_object(
      'loyalty_points', us.available_loyalty_points,
      'upcoming_events', us.upcoming_events,
      'active_challenges', us.active_challenges,
      'total_posts', us.total_posts,
      'recent_points', us.recent_points
    ) as stats_data,
    json_build_object(
      'events', COALESCE(re.events, '[]'::json),
      'posts', COALESCE(rp.posts, '[]'::json)
    ) as recent_activity
  FROM user_stats us
  CROSS JOIN recent_events re
  CROSS JOIN recent_posts rp;
END;
$$;

-- Function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$;

-- Trigger to refresh materialized view on data changes
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Perform async refresh (in production, use a job queue)
  PERFORM pg_notify('refresh_dashboard_stats', '');
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic refresh
DROP TRIGGER IF EXISTS refresh_stats_on_profile_change ON profiles;
CREATE TRIGGER refresh_stats_on_profile_change
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_dashboard_stats();

DROP TRIGGER IF EXISTS refresh_stats_on_event_change ON events;
CREATE TRIGGER refresh_stats_on_event_change
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_dashboard_stats();

DROP TRIGGER IF EXISTS refresh_stats_on_post_change ON social_posts;
CREATE TRIGGER refresh_stats_on_post_change
  AFTER INSERT OR UPDATE OR DELETE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_dashboard_stats();

-- Advanced search function with full-text search
CREATE OR REPLACE FUNCTION search_content_optimized(
  search_term TEXT,
  user_id_param UUID DEFAULT NULL,
  content_types TEXT[] DEFAULT ARRAY['events', 'posts', 'users'],
  limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
  result_type TEXT,
  result_data JSONB,
  relevance_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    -- Search events
    SELECT 
      'event' as type,
      json_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description,
        'start_time', e.start_time,
        'location', e.location
      ) as data,
      ts_rank(
        to_tsvector('english', COALESCE(e.title, '') || ' ' || COALESCE(e.description, '') || ' ' || COALESCE(e.location, '')),
        plainto_tsquery('english', search_term)
      ) as score
    FROM events e
    WHERE 'events' = ANY(content_types)
      AND e.status IN ('upcoming', 'ongoing')
      AND (
        to_tsvector('english', COALESCE(e.title, '') || ' ' || COALESCE(e.description, '') || ' ' || COALESCE(e.location, ''))
        @@ plainto_tsquery('english', search_term)
      )
    
    UNION ALL
    
    -- Search posts
    SELECT 
      'post' as type,
      json_build_object(
        'id', sp.id,
        'content', LEFT(sp.content, 200),
        'created_at', sp.created_at,
        'user_id', sp.user_id
      ) as data,
      ts_rank(
        to_tsvector('english', COALESCE(sp.content, '')),
        plainto_tsquery('english', search_term)
      ) as score
    FROM social_posts sp
    WHERE 'posts' = ANY(content_types)
      AND sp.status = 'active'
      AND (user_id_param IS NULL OR sp.user_id = user_id_param)
      AND to_tsvector('english', COALESCE(sp.content, '')) @@ plainto_tsquery('english', search_term)
    
    UNION ALL
    
    -- Search users
    SELECT 
      'user' as type,
      json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'username', p.username,
        'bio', p.bio,
        'avatar_url', p.avatar_url
      ) as data,
      ts_rank(
        to_tsvector('english', COALESCE(p.full_name, '') || ' ' || COALESCE(p.username, '') || ' ' || COALESCE(p.bio, '')),
        plainto_tsquery('english', search_term)
      ) as score
    FROM profiles p
    WHERE 'users' = ANY(content_types)
      AND (
        to_tsvector('english', COALESCE(p.full_name, '') || ' ' || COALESCE(p.username, '') || ' ' || COALESCE(p.bio, ''))
        @@ plainto_tsquery('english', search_term)
      )
  )
  SELECT 
    sr.type as result_type,
    sr.data as result_data,
    sr.score as relevance_score
  FROM search_results sr
  WHERE sr.score > 0.1
  ORDER BY sr.score DESC, sr.type
  LIMIT limit_param;
END;
$$;