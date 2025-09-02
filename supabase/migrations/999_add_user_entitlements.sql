-- User entitlements table for special account grants
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_unlimited boolean not null default false,
  notes text,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

-- Allow users to view their own entitlements
create policy if not exists "user_entitlements_select_own" on public.user_entitlements
for select using (auth.uid() = user_id);

-- Admin/service role manages entitlements; no direct insert/update by normal users
create policy if not exists "user_entitlements_block_mutation" on public.user_entitlements
for all to authenticated using (false) with check (false);

-- Service role bypasses RLS by design; no extra policy needed.

