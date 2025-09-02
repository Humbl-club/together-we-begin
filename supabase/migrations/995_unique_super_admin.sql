-- Ensure only one active super_admin exists platform-wide
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_one_active_super_admin'
  ) THEN
    CREATE UNIQUE INDEX uniq_one_active_super_admin ON public.platform_admins ((role))
    WHERE role = 'super_admin' AND is_active = true;
  END IF;
END $$;

