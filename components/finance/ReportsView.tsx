'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { formatCurrency } from '@/lib/utils/currency'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { MonthlyData } from '@/types/finance'
import { cn } from '@/lib/utils/cn'

type Period = '3m' | '6m' | '12m'

const PERIOD_LABELS: Record<Period, string> = {
  '3m': 'Last 3 months',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
}

function SummaryCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums', positive === false && 'text-destructive')}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function ReportsView() {
  const supabase = createClient()
  const { company } = useCompanyStore()
  const [period, setPeriod] = useState<Period>('6m')
  const [data, setData] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!company) return
    loadData()
  }, [company?.id, period]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    if (!company) return
    setIsLoading(true)
    const months = parseInt(period)
    const now = new Date()

    const [invoicesRes, expensesRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('total, due_date, status')
        .eq('company_id', company.id)
        .eq('status', 'paid'),
      supabase
        .from('expenses')
        .select('amount, date')
        .eq('company_id', company.id),
    ])

    const invoices = invoicesRes.data ?? []
    const expenses = expensesRes.data ?? []

    const result: MonthlyData[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      const y = d.getFullYear()
      const m = d.getMonth()

      const income = invoices
        .filter((inv) => {
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

      result.push({ month: label, income, expenses: exp, profit: income - exp })
    }

    setData(result)
    setIsLoading(false)
  }

  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0)
  const totalProfit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0'
  const currency = company?.currency ?? 'USD'

  if (isLoading) return <LoadingSpinner centered />

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              period === p
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total income"
          value={formatCurrency(totalIncome, currency)}
          sub="Paid invoices"
          positive={true}
        />
        <SummaryCard
          label="Total expenses"
          value={formatCurrency(totalExpenses, currency)}
          sub="All categories"
        />
        <SummaryCard
          label="Net profit"
          value={formatCurrency(totalProfit, currency)}
          sub="Income minus expenses"
          positive={totalProfit >= 0}
        />
        <SummaryCard
          label="Profit margin"
          value={`${margin}%`}
          sub="Of total income"
          positive={Number(margin) >= 0}
        />
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-semibold mb-1">Profit &amp; Loss</p>
        <p className="text-xs text-muted-foreground mb-5">{PERIOD_LABELS[period]}</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                fontSize: '12px',
              }}
            />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="income" name="Income" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b">
          <p className="text-sm font-semibold">Monthly breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Month</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Income</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Expenses</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Profit</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row) => {
                const rowMargin = row.income > 0 ? ((row.profit / row.income) * 100).toFixed(1) : '—'
                return (
                  <tr key={row.month} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium">{row.month}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-green-700 dark:text-green-400">
                      {formatCurrency(row.income, currency)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                      {formatCurrency(row.expenses, currency)}
                    </td>
                    <td className={cn(
                      'px-5 py-3 text-right tabular-nums font-medium',
                      row.profit >= 0 ? 'text-foreground' : 'text-destructive'
                    )}>
                      {formatCurrency(row.profit, currency)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                      {rowMargin !== '—' ? `${rowMargin}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t bg-muted/30">
              <tr>
                <td className="px-5 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total</td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold text-green-700 dark:text-green-400">
                  {formatCurrency(totalIncome, currency)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpenses, currency)}
                </td>
                <td className={cn(
                  'px-5 py-3 text-right tabular-nums font-bold',
                  totalProfit >= 0 ? '' : 'text-destructive'
                )}>
                  {formatCurrency(totalProfit, currency)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold">
                  {totalIncome > 0 ? `${margin}%` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
