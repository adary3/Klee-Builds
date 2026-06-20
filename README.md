# Kleenah ERP

**Built for African business.**

A full-featured, modular ERP system for African SMEs — invoicing, expenses, team management, and reporting. Built on Next.js 14, Supabase, and Tailwind CSS. Supports English, French, and Arabic (RTL).

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | Next.js 14 (App Router), TypeScript strict     |
| Styling     | Tailwind CSS, shadcn/ui                         |
| State       | Zustand + React Hook Form + Zod                |
| Charts      | Recharts                                        |
| i18n        | next-intl (EN / FR / AR with RTL)              |
| Backend     | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Email       | Resend                                          |
| Payments    | Paystack / Flutterwave (architecture ready)    |
| Deployment  | Vercel (frontend) + Supabase Cloud (backend)   |

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Resend](https://resend.com) account (free tier works)

### 2. Install

```bash
unzip kleenah-erp-FINAL.zip
cd kleenah
npm install
```

### 3. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, set a strong DB password, pick the region nearest your users
3. Wait ~2 minutes for provisioning
4. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure environment

```bash
cp .env.example .env.local
# Fill in all values
```

### 5. Run database migrations

In Supabase → **SQL Editor**, run each file in order:

```
supabase/migrations/001_core_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_finance_schema.sql
supabase/migrations/004_seed_data.sql
```

Paste each file's content and click **Run**. All four must complete without errors.

### 6. Configure Supabase Auth

In Supabase → **Authentication → Settings**:
- Enable **Email provider**
- Set **Site URL** to `http://localhost:3000`
- Under **Redirect URLs** add `http://localhost:3000/**`

### 7. Create Storage buckets

In Supabase → **Storage → New bucket**:

| Name       | Public |
|------------|--------|
| `logos`    | ✅ Yes  |
| `receipts` | ❌ No   |

### 8. Generate TypeScript types (recommended)

```bash
npx supabase login
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### 9. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/en/login`.

### 10. First run

1. Register an account at `/en/register`
2. Complete the 4-step company wizard
3. Explore the dashboard — the onboarding checklist guides you through setup

---

## Deploy to Vercel

1. Push to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Under **Environment Variables**, add all values from `.env.local`
4. Click **Deploy**
5. After deploy, update Supabase **Site URL** and **Redirect URLs** to your Vercel domain

---

## Deploy Edge Functions

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase functions deploy send-invite
npx supabase functions deploy send-invoice
```

Set the required secrets on the Edge Functions:

```bash
npx supabase secrets set RESEND_API_KEY=your_key
npx supabase secrets set RESEND_FROM_EMAIL=noreply@yourdomain.com
npx supabase secrets set NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Project Structure

```
kleenah/
├── app/[locale]/
│   ├── (auth)/          # Login, register, invite, forgot/reset password
│   └── (dashboard)/     # All authenticated routes
│       ├── finance/     # Invoices, expenses, reports
│       └── settings/    # Company, team, roles, account
├── components/
│   ├── auth/            # LoginForm, RegisterForm, InviteForm
│   ├── finance/         # FinanceDashboard, InvoiceForm/Table/Detail, ExpenseForm/Table, ReportsView, InvoicePDF
│   ├── onboarding/      # CompanyWizard, OnboardingChecklist
│   ├── settings/        # CompanyProfileForm, TeamTable, InviteModal, RoleBuilder, AccountSettingsForm
│   ├── shared/          # Sidebar, Navbar, DataTable, EmptyState, PageHeader, Toaster, ...
│   └── ui/              # shadcn primitives
├── hooks/               # useUser, useCompany, useInvoices, useExpenses, useToast, useRealtimeNotifications
├── lib/
│   ├── supabase/        # client.ts, server.ts
│   ├── utils/           # currency, date, audit, payments, cn
│   └── validations/     # Zod schemas for all forms
├── messages/            # en.json, fr.json, ar.json
├── store/               # authStore, companyStore (Zustand)
├── supabase/
│   ├── functions/       # send-invite, send-invoice (Deno Edge Functions)
│   └── migrations/      # 001–004 SQL migrations
└── types/               # database.ts, company.ts, finance.ts
```

---

## Modules

| Module      | Status       | Notes                                      |
|-------------|-------------|---------------------------------------------|
| Auth        | ✅ Complete  | Email/password, magic link, invite flow     |
| Onboarding  | ✅ Complete  | 4-step company wizard, checklist            |
| Finance     | ✅ Complete  | Invoices, expenses, P&L, PDF, email send    |
| Settings    | ✅ Complete  | Company, team, roles, account               |
| Inventory   | 🔜 Skeleton  | Planned                                     |
| CRM         | 🔜 Skeleton  | Planned                                     |
| HR          | 🔜 Skeleton  | Planned                                     |
| Projects    | 🔜 Skeleton  | Planned                                     |
| Purchasing  | 🔜 Skeleton  | Planned                                     |

---

## AI Integration Points

All AI hooks are clearly marked in the codebase with `// AI_HOOK:` comments. Key integration points:

- `expenses` table — `ai_extracted` and `ai_confidence` columns ready for receipt parsing
- `components/finance/ExpenseForm.tsx` — receipt upload triggers AI extraction
- `hooks/useRealtimeNotifications.ts` — AI alert suggestions on invoice events
- `supabase/functions/` — Edge Functions ready for AI calls
- `lib/utils/payments.ts` — AI provider selection for optimal payment routing

To activate: populate `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in `.env.local` and implement the marked hooks.

---

## Payment Integration

The abstraction layer is ready in `lib/utils/payments.ts`. Both Paystack and Flutterwave interfaces are typed. To activate:

1. Add keys to `.env.local`
2. Set `PAYMENT_PROVIDER=paystack` or `PAYMENT_PROVIDER=flutterwave`
3. Implement the methods in `PaystackProvider` or `FlutterwaveProvider`
4. Wire the webhook handler in `app/api/v1/webhooks/route.ts`

---

## Environment Variables

See `.env.example` for the full list. Required to run:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

---

Made by [Kleeon](https://kleeonai.com) · Built for African business.
