'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '@/types/finance'
import type { Invoice, InvoiceStatus } from '@/types/finance'
import { cn } from '@/lib/utils/cn'

const STATUS_TABS: Array<{ label: string; value: InvoiceStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

export function InvoiceTable() {
  const locale = useLocale()
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const { invoices, isLoading, deleteInvoice } = useInvoices({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  })

  const columns: Column<Invoice & { customer?: { name: string } }>[] = [
    {
      key: 'number',
      header: 'Invoice #',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-sm font-medium">{row.number}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (row) => (
        <span className="text-sm">
          {(row.customer as { name: string } | undefined)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'issue_date',
      header: 'Issued',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.issue_date)}</span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.due_date)}</span>
      ),
    },
    {
      key: 'total',
      header: 'Amount',
      sortable: true,
      className: 'text-right',
      cell: (row) => (
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(row.total, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          INVOICE_STATUS_COLORS[row.status]
        )}>
          {INVOICE_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/${locale}/finance/invoices/${row.id}`}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="View invoice"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {row.status === 'draft' && (
            <button
              onClick={async () => {
                if (confirm('Delete this invoice?')) await deleteInvoice(row.id)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              title="Delete invoice"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <Link
          href={`/${locale}/finance/invoices/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              statusFilter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        data={invoices as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyTitle="No invoices found"
        emptyDescription="Create your first invoice to start getting paid."
        emptyAction={
          <Link
            href={`/${locale}/finance/invoices/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create invoice
          </Link>
        }
        onRowClick={(row) => router.push(`/${locale}/finance/invoices/${(row as unknown as Invoice).id}`)}
      />
    </div>
  )
}
