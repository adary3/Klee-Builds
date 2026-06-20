'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Clock, AlertTriangle, Plus
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, isOverdue } from '@/lib/utils/date'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '@/types/finance'
import type { FinanceSummary, MonthlyData, Invoice } from '@/types/finance'
import { cn } from '@/lib/utils/cn'

// ─────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, trend, color,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  color: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

// ─────────────────────────────────────────
// Custom chart tooltip
// ─────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card shadow-lg p-3 text-sm space-y-1 min-w-[160px]">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────
function StatusBadge({ status }: { status: Invoice['status'] }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      INVOICE_STATUS_COLORS[status]
    )}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  )
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────
export function FinanceDashboard() {
  const locale = useLocale()
  const supabase = createClient()
  const { company } = useCompanyStore()

  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [chartData, setChartData] = useState<MonthlyData[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Array<Invoice & { customer: { name: string } }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!company) return
    loadAll()
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    if (!company) return
    setIsLoading(true)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const currency = company.currency

    // Parallel fetches
    const [invoicesRes, expensesRes, recentRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('status, total, due_date, currency')
        .eq('company_id', company.id),
      supabase
        .from('expenses')
        .select('amount, date, currency')
        .eq('company_id', company.id),
      supabase
        .from('invoices')
        .select('*, customer:customers(name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const invoices = invoicesRes.data ?? []
    const expenses = expensesRes.data ?? []

    // KPI calculations
    const totalRevenue = invoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + (i.total ?? 0), 0)

    const outstanding = invoices
      .filter((i) => i.status === 'sent')
      .reduce((s, i) => s + (i.total ?? 0), 0)

    const overdue = invoices
      .filter((i) => (i.status === 'sent' || i.status === 'overdue') && isOverdue(i.due_date))
      .reduce((s, i) => s + (i.total ?? 0), 0)

    const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)

    setSummary({ totalRevenue, outstanding, overdue, totalExpenses, currency })

    // Build last-6-months chart data
    const months: MonthlyData[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      const y = d.getFullYear()
      const m = d.getMonth()

      const income = invoices
        .filter((inv) => {
          if (inv.status !== 'paid') return false
          const pd = new Date(inv.due_date)
          return pd.getFullYear() === y && pd.getMonth() === m
        })
        .reduce((s, inv) => s + (inv.total ?? 0), 0)

      const exp = expenses
        .filter((e) => {
          const ed = new Date(e.date)
          return ed.getFullYear() === y && ed.getMonth() === m
        })
        .reduce((s, e) => s + (e.amount ?? 0), 0)

      months.push({ month: monthStr, income, expenses: exp, profit: income - exp })
    }
    setChartData(months)

    setRecentInvoices((recentRes.data ?? []) as Array<Invoice & { customer: { name: string } }>)
    setIsLoading(false)
  }

  if (isLoading) return <LoadingSpinner centered />

  const currency = company?.currency ?? 'USD'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(summary?.totalRevenue ?? 0, currency)}
          sub="All paid invoices"
          icon={TrendingUp}
          color="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(summary?.outstanding ?? 0, currency)}
          sub="Sent, awaiting payment"
          icon={Clock}
          color="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
        />
        <KpiCard
          label="Overdue"
          value={formatCurrency(summary?.overdue ?? 0, currency)}
          sub="Past due date"
          icon={AlertTriangle}
          color="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
        />
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(summary?.totalExpenses ?? 0, currency)}
          sub="All recorded expenses"
          icon={TrendingDown}
          color="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
        />
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold">Revenue vs Expenses</p>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
        </div>
        {chartData.every((d) => d.income === 0 && d.expenses === 0) ? (
          <EmptyState
            title="No data yet"
            description="Create and pay invoices to see your chart."
          />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#incomeGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#expenseGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-sm font-semibold">Recent Invoices</p>
          <Link
            href={`/${locale}/finance/invoices`}
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
            <Link
              href={`/${locale}/finance/invoices/new`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/${locale}/finance/invoices/${inv.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.customer?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{inv.number}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(inv.total, inv.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(inv.due_date)}</p>
                </div>
                <StatusBadge status={inv.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
