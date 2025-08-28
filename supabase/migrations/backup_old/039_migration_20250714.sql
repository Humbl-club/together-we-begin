-- Fix security warnings by setting proper search_path for all functions
-- This prevents potential SQL injection and privilege escalation attacks

-- Update has_role function with secure search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$function$;

-- Update is_admin function with secure search_path
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin');
$function$;

-- Update handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', '')
  );
  
  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_post_likes_count function with secure search_path
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update handle_new_user_privacy function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Create default privacy settings for new user
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Update update_post_comments_count function with secure search_path
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update update_loyalty_points function with secure search_path
CREATE OR REPLACE FUNCTION public.update_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.type = 'earned' THEN
    UPDATE public.profiles 
    SET 
      total_loyalty_points = total_loyalty_points + NEW.points,
      available_loyalty_points = available_loyalty_points + NEW.points
    WHERE id = NEW.user_id;
  ELSIF NEW.type = 'redeemed' THEN
    UPDATE public.profiles 
    SET available_loyalty_points = available_loyalty_points - NEW.points
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update get_user_dashboard_optimized function with secure search_path
CREATE OR REPLACE FUNCTION public.get_user_dashboard_optimized(user_id_param uuid)
 RETURNS TABLE(user_data jsonb, stats_data jsonb, recent_activity jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Update get_events_optimized function with secure search_path
CREATE OR REPLACE FUNCTION public.get_events_optimized(user_id_param uuid DEFAULT NULL::uuid, status_filter text DEFAULT 'upcoming'::text, limit_param integer DEFAULT 20, offset_param integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, description text, start_time timestamp with time zone, end_time timestamp with time zone, location text, image_url text, price_cents integer, loyalty_points_price integer, max_capacity integer, current_capacity integer, status event_status, created_by uuid, created_at timestamp with time zone, is_registered boolean, registration_status payment_status)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Update get_dashboard_data_v2 function with secure search_path
CREATE OR REPLACE FUNCTION public.get_dashboard_data_v2(user_id_param uuid)
 RETURNS TABLE(user_profile jsonb, stats jsonb, recent_events jsonb, active_challenges jsonb, recent_posts jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;