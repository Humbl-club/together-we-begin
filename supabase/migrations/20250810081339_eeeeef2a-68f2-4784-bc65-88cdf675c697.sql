
-- Fix signup failure and restore atomic new-user initialization
-- 1) Replace triggers with a single, idempotent handler that creates profile, role, and all settings

-- Drop existing conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;

-- Create a unified handler
CREATE OR REPLACE FUNCTION public.handle_new_user_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile from auth metadata (id = auth.users.id)
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;

  -- Default settings (idempotent)
  INSERT INTO public.user_appearance_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_wellness_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_social_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate the single trigger for new users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_full();

-- 2) Backfill defaults for existing users (safe, idempotent)

-- Ensure every profile has appearance settings
INSERT INTO public.user_appearance_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.user_appearance_settings s ON s.user_id = p.id
WHERE s.user_id IS NULL;

-- Ensure every profile has notification settings
INSERT INTO public.user_notification_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.user_notification_settings s ON s.user_id = p.id
WHERE s.user_id IS NULL;

-- Ensure every profile has wellness settings
INSERT INTO public.user_wellness_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.user_wellness_settings s ON s.user_id = p.id
WHERE s.user_id IS NULL;

-- Ensure every profile has social settings
INSERT INTO public.user_social_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.user_social_settings s ON s.user_id = p.id
WHERE s.user_id IS NULL;

-- Ensure every profile has privacy settings
INSERT INTO public.privacy_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.privacy_settings s ON s.user_id = p.id
WHERE s.user_id IS NULL;
