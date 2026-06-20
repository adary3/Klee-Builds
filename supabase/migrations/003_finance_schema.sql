-- ============================================================
-- Migration 003: Finance Schema
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- ─────────────────────────────────────────
-- Chart of Accounts
-- ─────────────────────────────────────────
create table public.accounts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  code        text not null,
  name        text not null,
  type        text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id   uuid references public.accounts(id),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique(company_id, code)
);

-- ─────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  address     jsonb not null default '{}',
  tax_id      text,
  currency    text not null default 'USD',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger customers_updated_at
  before update on public.customers
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────
-- Invoices
-- ─────────────────────────────────────────
create table public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  customer_id         uuid not null references public.customers(id),
  number              text not null,
  status              text not null default 'draft'
                        check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date          date not null default current_date,
  due_date            date not null,
  currency            text not null default 'USD',
  exchange_rate       numeric(10, 4) not null default 1,
  subtotal            numeric(12, 2) not null default 0,
  tax_amount          numeric(12, 2) not null default 0,
  total               numeric(12, 2) not null default 0,
  notes               text,
  terms               text,
  is_recurring        boolean not null default false,
  recurring_interval  text,
  sent_at             timestamptz,
  paid_at             timestamptz,
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(company_id, number)
);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────
-- Invoice Line Items
-- ─────────────────────────────────────────
create table public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity    numeric(10, 2) not null default 1,
  unit_price  numeric(12, 2) not null,
  tax_rate    numeric(5, 2) not null default 0,
  amount      numeric(12, 2) not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Expenses
-- ─────────────────────────────────────────
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  account_id      uuid references public.accounts(id),
  description     text not null,
  amount          numeric(12, 2) not null,
  currency        text not null default 'USD',
  category        text not null,
  date            date not null default current_date,
  receipt_url     text,
  payment_method  text not null default 'cash'
                    check (payment_method in ('cash', 'bank', 'mobile_money', 'card')),
  notes           text,
  -- AI_HOOK: ai_extracted boolean default false,
  -- AI_HOOK: ai_confidence numeric(3,2),
  -- When AI receipt parsing is added, these columns will track
  -- whether the expense was auto-extracted and at what confidence level.
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────
-- RLS for finance tables
-- ─────────────────────────────────────────

-- Helper: user belongs to company
-- We reuse this pattern across all finance RLS policies

alter table public.accounts enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.expenses enable row level security;

-- Accounts
create policy "accounts_all"
  on public.accounts for all
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );

-- Customers
create policy "customers_all"
  on public.customers for all
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );

-- Invoices
create policy "invoices_all"
  on public.invoices for all
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );

-- Invoice items (access via parent invoice)
create policy "invoice_items_all"
  on public.invoice_items for all
  using (
    invoice_id in (
      select id from public.invoices
      where company_id in (
        select company_id from public.company_users where user_id = auth.uid()
      )
    )
  );

-- Expenses
create policy "expenses_all"
  on public.expenses for all
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );
