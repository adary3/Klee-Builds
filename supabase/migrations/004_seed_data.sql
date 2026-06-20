-- ============================================================
-- Migration 004: Seed Data
-- Run AFTER 003_finance_schema.sql
-- Provides a stored procedure to bootstrap a new company with
-- default roles and chart of accounts.
-- Call this from the create-company Edge Function.
-- ============================================================

-- ─────────────────────────────────────────
-- Procedure: bootstrap_company
-- Seeds default roles and accounts for a newly created company.
-- Called via supabase.rpc('bootstrap_company', { company_id: '...' })
-- ─────────────────────────────────────────
create or replace function public.bootstrap_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Default system roles
  insert into public.roles (company_id, name, permissions, is_system)
  values
    (p_company_id, 'Owner', '{
      "invoices.view": true, "invoices.create": true, "invoices.edit": true,
      "invoices.delete": true, "invoices.send": true,
      "expenses.view": true, "expenses.create": true, "expenses.edit": true, "expenses.delete": true,
      "customers.view": true, "customers.create": true, "customers.edit": true,
      "reports.view": true,
      "team.view": true, "team.invite": true, "team.manage": true,
      "settings.view": true, "settings.edit": true,
      "audit.view": true
    }', true),
    (p_company_id, 'Admin', '{
      "invoices.view": true, "invoices.create": true, "invoices.edit": true,
      "invoices.delete": true, "invoices.send": true,
      "expenses.view": true, "expenses.create": true, "expenses.edit": true, "expenses.delete": true,
      "customers.view": true, "customers.create": true, "customers.edit": true,
      "reports.view": true,
      "team.view": true, "team.invite": true, "team.manage": true,
      "settings.view": true, "settings.edit": true,
      "audit.view": true
    }', true),
    (p_company_id, 'Accountant', '{
      "invoices.view": true, "invoices.create": true, "invoices.edit": true,
      "invoices.delete": false, "invoices.send": true,
      "expenses.view": true, "expenses.create": true, "expenses.edit": true, "expenses.delete": false,
      "customers.view": true, "customers.create": true, "customers.edit": true,
      "reports.view": true,
      "team.view": true, "team.invite": false, "team.manage": false,
      "settings.view": true, "settings.edit": false,
      "audit.view": false
    }', true),
    (p_company_id, 'Manager', '{
      "invoices.view": true, "invoices.create": true, "invoices.edit": true,
      "invoices.delete": false, "invoices.send": true,
      "expenses.view": true, "expenses.create": true, "expenses.edit": true, "expenses.delete": false,
      "customers.view": true, "customers.create": true, "customers.edit": true,
      "reports.view": true,
      "team.view": true, "team.invite": false, "team.manage": false,
      "settings.view": false, "settings.edit": false,
      "audit.view": false
    }', true),
    (p_company_id, 'Staff', '{
      "invoices.view": true, "invoices.create": true, "invoices.edit": false,
      "invoices.delete": false, "invoices.send": false,
      "expenses.view": true, "expenses.create": true, "expenses.edit": false, "expenses.delete": false,
      "customers.view": true, "customers.create": false, "customers.edit": false,
      "reports.view": false,
      "team.view": true, "team.invite": false, "team.manage": false,
      "settings.view": false, "settings.edit": false,
      "audit.view": false
    }', true);

  -- Default chart of accounts (Africa-centric)
  insert into public.accounts (company_id, code, name, type)
  values
    -- Assets
    (p_company_id, '1000', 'Cash', 'asset'),
    (p_company_id, '1010', 'Bank Account', 'asset'),
    (p_company_id, '1020', 'Mobile Money', 'asset'),
    (p_company_id, '1100', 'Accounts Receivable', 'asset'),
    (p_company_id, '1200', 'Inventory', 'asset'),
    (p_company_id, '1500', 'Fixed Assets', 'asset'),
    -- Liabilities
    (p_company_id, '2000', 'Accounts Payable', 'liability'),
    (p_company_id, '2100', 'Loans Payable', 'liability'),
    (p_company_id, '2200', 'Tax Payable', 'liability'),
    -- Equity
    (p_company_id, '3000', 'Owner Equity', 'equity'),
    (p_company_id, '3100', 'Retained Earnings', 'equity'),
    -- Income
    (p_company_id, '4000', 'Sales Revenue', 'income'),
    (p_company_id, '4100', 'Service Revenue', 'income'),
    (p_company_id, '4900', 'Other Income', 'income'),
    -- Expenses
    (p_company_id, '5000', 'Cost of Goods Sold', 'expense'),
    (p_company_id, '5100', 'Salaries & Wages', 'expense'),
    (p_company_id, '5200', 'Rent', 'expense'),
    (p_company_id, '5300', 'Utilities', 'expense'),
    (p_company_id, '5400', 'Office Supplies', 'expense'),
    (p_company_id, '5500', 'Travel & Transport', 'expense'),
    (p_company_id, '5600', 'Marketing & Advertising', 'expense'),
    (p_company_id, '5700', 'Professional Services', 'expense'),
    (p_company_id, '5800', 'Software & Subscriptions', 'expense'),
    (p_company_id, '5900', 'Taxes & Licenses', 'expense'),
    (p_company_id, '6000', 'Other Expenses', 'expense');
end;
$$;
