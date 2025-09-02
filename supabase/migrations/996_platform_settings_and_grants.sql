-- Platform settings and organization membership grants

-- Global key-value settings
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.platform_settings enable row level security;

-- Only platform super_admins can modify settings; authenticated can read
create policy if not exists "platform_settings_select"
  on public.platform_settings for select
  to authenticated
  using (true);

create policy if not exists "platform_settings_modify_by_super_admin"
  on public.platform_settings for all
  to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.is_active = true
        and (pa.role = 'super_admin' or 'all_access' = any(pa.permissions))
    )
  ) with check (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.is_active = true
        and (pa.role = 'super_admin' or 'all_access' = any(pa.permissions))
    )
  );

comment on table public.platform_settings is 'Global platform configuration (e.g., trials)';

-- Organization membership grants (e.g., free/sponsored/trial overrides)
create table if not exists public.organization_membership_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  grant_type text not null check (grant_type in ('trial','free','sponsored')),
  tier text not null check (tier in ('free','basic','pro','enterprise')),
  days integer,
  expires_at timestamptz,
  notes text,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.organization_membership_grants enable row level security;

create policy if not exists "org_grants_select_super_admin"
  on public.organization_membership_grants for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid() and pa.is_active = true
    )
  );

create policy if not exists "org_grants_modify_super_admin"
  on public.organization_membership_grants for all
  to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.is_active = true
        and (pa.role in ('super_admin','billing_admin') or 'all_access' = any(pa.permissions))
    )
  ) with check (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.is_active = true
        and (pa.role in ('super_admin','billing_admin') or 'all_access' = any(pa.permissions))
    )
  );

