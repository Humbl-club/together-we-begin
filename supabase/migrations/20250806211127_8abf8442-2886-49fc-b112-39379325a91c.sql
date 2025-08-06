-- Update Auth settings for better security
-- Note: These are configuration changes that should be applied through Supabase Dashboard
-- Visit https://supabase.com/dashboard/project/ynqdddwponrqwhtqfepi/auth/providers to enable these:

-- 1. Enable leaked password protection (dashboard setting)
-- 2. Reduce OTP expiry time (dashboard setting)

-- Update user settings triggers to ensure proper cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_points_regularly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the existing expire_old_points function
  PERFORM public.expire_old_points();
  
  -- Log the cleanup action
  INSERT INTO public.admin_actions (admin_id, action, target_type, details)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'system_cleanup',
    'points_expiration',
    jsonb_build_object('timestamp', now(), 'automated', true)
  );
END;
$$;