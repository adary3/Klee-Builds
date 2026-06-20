'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Plus, Search, Trash2, Receipt, ExternalLink } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { expenseCategories } from '@/lib/validations/expense'
import { PAYMENT_METHOD_LABELS } from '@/types/finance'
import type { Expense } from '@/types/finance'
import { cn } from '@/lib/utils/cn'

const CATEGORY_LABELS: Record<string, string> = {
  office: 'Office', travel: 'Travel', meals: 'Meals',
  utilities: 'Utilities', salaries: 'Salaries', rent: 'Rent',
  equipment: 'Equipment', marketing: 'Marketing', software: 'Software',
  professional_services: 'Prof. services', taxes: 'Taxes', other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  office: 'bg-blue-100 text-blue-700', travel: 'bg-purple-100 text-purple-700',
  meals: 'bg-orange-100 text-orange-700', utilities: 'bg-yellow-100 text-yellow-700',
  salaries: 'bg-green-100 text-green-700', rent: 'bg-red-100 text-red-700',
  equipment: 'bg-indigo-100 text-indigo-700', marketing: 'bg-pink-100 text-pink-700',
  software: 'bg-cyan-100 text-cyan-700', professional_services: 'bg-teal-100 text-teal-700',
  taxes: 'bg-gray-100 text-gray-700', other: 'bg-gray-100 text-gray-700',
}

export function ExpenseTable() {
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { expenses, isLoading, deleteExpense } = useExpenses({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    search: search || undefined,
  })

  const columns: Column<Expense>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{row.description}</p>
          {row.notes && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.notes}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (row) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          CATEGORY_COLORS[row.category] ?? 'bg-gray-100 text-gray-700'
        )}>
          {CATEGORY_LABELS[row.category] ?? row.category}
        </span>
      ),
    },
    {
      key: 'payment_method',
      header: 'Method',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {PAYMENT_METHOD_LABELS[row.payment_method]}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      className: 'text-right',
      cell: (row) => (
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: 'receipt',
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {row.receipt_url && (
            <a
              href={row.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="View receipt"
            >
              <Receipt className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={async () => {
              if (confirm('Delete this expense?')) await deleteExpense(row.id)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Delete expense"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  // Summary total
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <Link
          href={`/${locale}/finance/expenses/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> New expense
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            categoryFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          All
        </button>
        {expenseCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Total summary */}
      {!isLoading && expenses.length > 0 && (
        <div className="rounded-lg bg-muted/40 border px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            {categoryFilter !== 'all' && ` in ${CATEGORY_LABELS[categoryFilter]}`}
          </span>
          <span className="font-semibold">
            Total: {formatCurrency(total, 'USD')}
          </span>
        </div>
      )}

      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        data={expenses as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyTitle="No expenses yet"
        emptyDescription="Track your business expenses to understand where money goes."
        emptyAction={
          <Link
            href={`/${locale}/finance/expenses/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add expense
          </Link>
        }
      />
    </div>
  )
}
