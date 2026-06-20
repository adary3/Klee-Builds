-- ============================================================
-- Migration 001: Core Schema
-- Run this first in the Supabase SQL editor.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- Companies
-- ─────────────────────────────────────────
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  country     text not null,
  currency    text not null default 'USD',
  timezone    text not null default 'UTC',
  language    text not null default 'en',
  plan        text not null default 'starter',
  logo_url    text,
  address     jsonb not null default '{}',
  tax_id      text,
  bank_details jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Profiles (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Company <> User junction
-- ─────────────────────────────────────────
create table public.company_users (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'staff',
  is_active   boolean not null default true,
  invited_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique(company_id, user_id)
);

-- ─────────────────────────────────────────
-- Roles
-- ─────────────────────────────────────────
create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  permissions jsonb not null default '{}',
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Invitations
-- ─────────────────────────────────────────
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  email       text not null,
  role        text not null default 'staff',
  token       text unique not null default gen_random_uuid()::text,
  invited_by  uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Audit Logs
-- ─────────────────────────────────────────
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid references public.profiles(id),
  entity      text not null,
  entity_id   uuid,
  action      text not null,
  before      jsonb,
  after       jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- Trigger: auto-update updated_at
-- ─────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at
  before update on public.companies
  for each row execute procedure public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
