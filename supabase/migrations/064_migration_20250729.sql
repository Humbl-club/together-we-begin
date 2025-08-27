-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Drop and recreate the get_users_with_roles function to include is_active
DROP FUNCTION IF EXISTS public.get_users_with_roles(uuid);

CREATE OR REPLACE FUNCTION public.get_users_with_roles(_requesting_user_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, username text, avatar_url text, created_at timestamp with time zone, roles app_role[], is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the requesting user is an admin
  IF NOT public.is_admin(_requesting_user_id) THEN
    RAISE EXCEPTION 'Only admins can view user roles';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.created_at,
    ARRAY_AGG(ur.role ORDER BY ur.role) as roles,
    p.is_active
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.created_at, p.is_active
  ORDER BY p.created_at DESC;
END;
$function$;