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
CREATE INDEX IF NOT EXISTS idx_events_upcoming_only 
ON events(start_time ASC) 
WHERE status = 'upcoming' AND start_time >= NOW();

CREATE INDEX IF NOT EXISTS idx_challenges_active_only 
ON challenges(created_at DESC) 
WHERE status = 'active';