-- Advanced database optimization for better query performance and data integrity

-- Create optimized indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_status_start_time 
ON public.events (status, start_time) 
WHERE status IN ('upcoming', 'ongoing');

CREATE INDEX IF NOT EXISTS idx_events_created_by_status 
ON public.events (created_by, status);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_event 
ON public.event_registrations (user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_status_created 
ON public.social_posts (user_id, status, created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_challenges_status_dates 
ON public.challenges (status, start_date, end_date) 
WHERE status = 'active';

-- Create optimized database function for event listings with better performance
CREATE OR REPLACE FUNCTION public.get_events_optimized(
  user_id_param UUID DEFAULT NULL,
  status_filter TEXT DEFAULT 'upcoming',
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  price_cents INTEGER,
  loyalty_points_price INTEGER,
  max_capacity INTEGER,
  current_capacity INTEGER,
  status event_status,
  created_by UUID,
  created_at TIMESTAMPTZ,
  is_registered BOOLEAN,
  registration_status payment_status
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.location,
    e.image_url,
    e.price_cents,
    e.loyalty_points_price,
    e.max_capacity,
    e.current_capacity,
    e.status,
    e.created_by,
    e.created_at,
    CASE 
      WHEN user_id_param IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM public.event_registrations er WHERE er.event_id = e.id AND er.user_id = user_id_param)
      ELSE FALSE
    END as is_registered,
    CASE 
      WHEN user_id_param IS NOT NULL THEN 
        (SELECT er.payment_status FROM public.event_registrations er 
         WHERE er.event_id = e.id AND er.user_id = user_id_param LIMIT 1)
      ELSE NULL
    END as registration_status
  FROM public.events e
  WHERE 
    CASE 
      WHEN status_filter = 'upcoming' THEN e.status = 'upcoming' AND e.start_time >= NOW()
      WHEN status_filter = 'ongoing' THEN e.status = 'ongoing'
      WHEN status_filter = 'completed' THEN e.status = 'completed'
      WHEN status_filter = 'all' THEN TRUE
      ELSE e.status::TEXT = status_filter
    END
  ORDER BY 
    CASE 
      WHEN status_filter = 'upcoming' THEN e.start_time
      ELSE e.created_at
    END ASC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Create optimized function for dashboard data with better caching
CREATE OR REPLACE FUNCTION public.get_dashboard_data_v2(user_id_param UUID)
RETURNS TABLE(
  user_profile JSONB,
  stats JSONB,
  recent_events JSONB,
  active_challenges JSONB,
  recent_posts JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  profile_data JSONB;
  stats_data JSONB;
  events_data JSONB;
  challenges_data JSONB;
  posts_data JSONB;
BEGIN
  -- Get user profile
  SELECT jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'available_loyalty_points', p.available_loyalty_points,
    'total_loyalty_points', p.total_loyalty_points,
    'location', p.location
  ) INTO profile_data
  FROM public.profiles p
  WHERE p.id = user_id_param;

  -- Get aggregated stats
  SELECT jsonb_build_object(
    'upcoming_events', COUNT(DISTINCT CASE WHEN e.status = 'upcoming' AND e.start_time >= NOW() THEN e.id END),
    'active_challenges', COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END),
    'total_posts', COUNT(DISTINCT CASE WHEN sp.status = 'active' THEN sp.id END),
    'recent_points', COALESCE(SUM(CASE WHEN lt.type = 'earned' AND lt.created_at >= NOW() - INTERVAL '30 days' THEN lt.points ELSE 0 END), 0)
  ) INTO stats_data
  FROM public.profiles p
  LEFT JOIN public.event_registrations er ON p.id = er.user_id
  LEFT JOIN public.events e ON er.event_id = e.id
  LEFT JOIN public.challenge_participations cp ON p.id = cp.user_id
  LEFT JOIN public.challenges c ON cp.challenge_id = c.id
  LEFT JOIN public.social_posts sp ON p.id = sp.user_id
  LEFT JOIN public.loyalty_transactions lt ON p.id = lt.user_id
  WHERE p.id = user_id_param;

  -- Get recent events
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'start_time', e.start_time,
      'location', e.location,
      'image_url', e.image_url
    ) ORDER BY e.start_time ASC
  ) INTO events_data
  FROM public.events e
  WHERE e.status = 'upcoming' 
    AND e.start_time >= NOW()
    AND e.start_time <= NOW() + INTERVAL '7 days'
  LIMIT 3;

  -- Get active challenges
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'description', c.description,
      'end_date', c.end_date,
      'points_reward', c.points_reward,
      'is_participating', EXISTS(SELECT 1 FROM public.challenge_participations cp2 WHERE cp2.challenge_id = c.id AND cp2.user_id = user_id_param)
    ) ORDER BY c.end_date ASC
  ) INTO challenges_data
  FROM public.challenges c
  WHERE c.status = 'active'
  LIMIT 3;

  -- Get recent posts
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', sp.id,
      'content', LEFT(sp.content, 100),
      'created_at', sp.created_at,
      'likes_count', sp.likes_count,
      'comments_count', sp.comments_count
    ) ORDER BY sp.created_at DESC
  ) INTO posts_data
  FROM public.social_posts sp
  WHERE sp.user_id = user_id_param 
    AND sp.status = 'active'
  LIMIT 5;

  RETURN QUERY SELECT 
    COALESCE(profile_data, '{}'::jsonb),
    COALESCE(stats_data, '{}'::jsonb),
    COALESCE(events_data, '[]'::jsonb),
    COALESCE(challenges_data, '[]'::jsonb),
    COALESCE(posts_data, '[]'::jsonb);
END;
$$;

-- Add partial indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_active_users 
ON public.profiles (updated_at DESC) 
WHERE updated_at > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notifications (user_id, created_at DESC) 
WHERE read_at IS NULL;