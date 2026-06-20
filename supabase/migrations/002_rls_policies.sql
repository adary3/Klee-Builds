-- ============================================================
-- Migration 002: Row Level Security Policies
-- Run AFTER 001_core_schema.sql
-- Every table is locked down. No access without a valid JWT.
-- ============================================================

-- ─────────────────────────────────────────
-- companies
-- ─────────────────────────────────────────
alter table public.companies enable row level security;

create policy "company_select"
  on public.companies for select
  using (
    id in (
      select company_id from public.company_users
      where user_id = auth.uid() and is_active = true
    )
  );

create policy "company_update"
  on public.companies for update
  using (
    id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Insert is handled by the create-company Edge Function (service role)
-- No direct insert policy for regular users

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_teammates"
  on public.profiles for select
  using (
    id in (
      select user_id from public.company_users
      where company_id in (
        select company_id from public.company_users where user_id = auth.uid()
      )
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────
-- company_users
-- ─────────────────────────────────────────
alter table public.company_users enable row level security;

create policy "company_users_select"
  on public.company_users for select
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );

create policy "company_users_update"
  on public.company_users for update
  using (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- ─────────────────────────────────────────
-- roles
-- ─────────────────────────────────────────
alter table public.roles enable row level security;

create policy "roles_select"
  on public.roles for select
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );

create policy "roles_insert"
  on public.roles for insert
  with check (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

create policy "roles_update"
  on public.roles for update
  using (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
    and is_system = false
  );

create policy "roles_delete"
  on public.roles for delete
  using (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role = 'owner' and is_active = true
    )
    and is_system = false
  );

-- ─────────────────────────────────────────
-- invitations
-- ─────────────────────────────────────────
alter table public.invitations enable row level security;

create policy "invitations_select"
  on public.invitations for select
  using (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin', 'manager') and is_active = true
    )
  );

create policy "invitations_insert"
  on public.invitations for insert
  with check (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- ─────────────────────────────────────────
-- audit_logs
-- ─────────────────────────────────────────
alter table public.audit_logs enable row level security;

create policy "audit_logs_select"
  on public.audit_logs for select
  using (
    company_id in (
      select company_id from public.company_users
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- Insert is done via service role in Edge Functions and client-side audit helper
-- Allow authenticated users to insert their own audit entries
create policy "audit_logs_insert"
  on public.audit_logs for insert
  with check (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );
