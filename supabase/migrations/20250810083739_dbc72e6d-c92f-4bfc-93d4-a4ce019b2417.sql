-- Unified signup setup: create trigger and backfill defaults
-- 1) Create trigger on auth.users to populate profile, roles, and settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_full'
  ) THEN
    CREATE TRIGGER on_auth_user_created_full
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_full();
  END IF;
END;
$$;

-- 2) Backfill for existing users
-- Profiles
INSERT INTO public.profiles (id, full_name, username)
SELECT u.id,
       COALESCE(u.raw_user_meta_data ->> 'full_name', ''),
       COALESCE(u.raw_user_meta_data ->> 'username', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Roles: ensure at least 'member' role exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'member'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = u.id AND ur.role = 'member'
);

-- Default settings (appearance)
INSERT INTO public.user_appearance_settings (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.user_appearance_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- Default settings (notifications)
INSERT INTO public.user_notification_settings (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.user_notification_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- Default settings (wellness)
INSERT INTO public.user_wellness_settings (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.user_wellness_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- Default settings (social)
INSERT INTO public.user_social_settings (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.user_social_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- Default privacy settings
INSERT INTO public.privacy_settings (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.privacy_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;