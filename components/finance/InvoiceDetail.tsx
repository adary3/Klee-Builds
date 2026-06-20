'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  Send, CheckCircle2, Download, ArrowLeft,
  Loader2, MoreHorizontal, Trash2, Copy
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { downloadInvoicePDF } from './InvoicePDF'
import { useInvoices } from '@/hooks/useInvoices'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '@/types/finance'
import type { InvoiceWithDetails } from '@/types/finance'
import { cn } from '@/lib/utils/cn'

interface InvoiceDetailProps {
  invoiceId: string
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const { company } = useCompanyStore()
  const { getInvoice, updateInvoiceStatus, deleteInvoice } = useInvoices()

  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sendConfirm, setSendConfirm] = useState(false)

  useEffect(() => {
    getInvoice(invoiceId).then((inv) => {
      setInvoice(inv)
      setIsLoading(false)
    })
  }, [invoiceId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!invoice || !company) return
    setIsSending(true)
    // Call the send-invoice Edge Function
    await supabase.functions.invoke('send-invoice', {
      body: { invoice_id: invoice.id, company_id: company.id },
    })
    await updateInvoiceStatus(invoice.id, 'sent')
    const updated = await getInvoice(invoiceId)
    setInvoice(updated)
    setSendConfirm(false)
    setIsSending(false)
  }

  async function handleMarkPaid() {
    if (!invoice) return
    setIsMarkingPaid(true)
    await updateInvoiceStatus(invoice.id, 'paid')
    const updated = await getInvoice(invoiceId)
    setInvoice(updated)
    setIsMarkingPaid(false)
  }

  async function handleDelete() {
    if (!invoice) return
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    await deleteInvoice(invoice.id)
    router.push(`/${locale}/finance/invoices`)
  }

  if (isLoading) return <LoadingSpinner centered />
  if (!invoice) return (
    <div className="text-center py-16 text-muted-foreground">Invoice not found.</div>
  )

  const canSend = invoice.status === 'draft' || invoice.status === 'sent'
  const canMarkPaid = invoice.status === 'sent' || invoice.status === 'overdue'
  const canDelete = invoice.status === 'draft'

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => router.push(`/${locale}/finance/invoices`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Invoices
        </button>

        <div className="flex items-center gap-2">
          {/* Send */}
          {canSend && invoice.customer?.email && (
            <button
              onClick={() => setSendConfirm(true)}
              disabled={isSending}
              className="flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary/5 disabled:opacity-60 transition-colors"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          )}

          {/* Mark paid */}
          {canMarkPaid && (
            <button
              onClick={handleMarkPaid}
              disabled={isMarkingPaid}
              className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {isMarkingPaid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark paid
            </button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border bg-popover shadow-md z-10">
                <button
                  onClick={async () => { setMenuOpen(false); if (invoice && company) await downloadInvoicePDF(invoice, company) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-t-lg"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
                <button
                  onClick={() => { setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Copy className="h-4 w-4" /> Duplicate
                </button>
                {canDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); handleDelete() }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send confirm banner */}
      {sendConfirm && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm">
            Send to <span className="font-semibold">{invoice.customer?.email}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSendConfirm(false)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {isSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send now
            </button>
          </div>
        </div>
      )}

      {/* Invoice document */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Invoice header */}
        <div className="px-8 py-6 border-b flex items-start justify-between gap-6 flex-wrap">
          <div>
            {company?.logo_url && (
              <img src={company.logo_url} alt={company.name} className="h-12 mb-3 object-contain" />
            )}
            <p className="font-bold text-lg">{company?.name}</p>
            <p className="text-sm text-muted-foreground">{company?.tax_id && `Tax ID: ${company.tax_id}`}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-2xl font-bold">Invoice</p>
            <p className="font-mono text-muted-foreground">{invoice.number}</p>
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              INVOICE_STATUS_COLORS[invoice.status]
            )}>
              {INVOICE_STATUS_LABELS[invoice.status]}
            </span>
          </div>
        </div>

        {/* Bill to / dates */}
        <div className="px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bill to</p>
            <p className="font-semibold">{invoice.customer?.name}</p>
            {invoice.customer?.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
            {invoice.customer?.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Issue date</p>
            <p className="text-sm font-medium">{formatDate(invoice.issue_date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Due date</p>
            <p className="text-sm font-medium">{formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 text-left">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit price</th>
                <th className="pb-2 text-right">Tax</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatCurrency(item.unit_price, invoice.currency)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-muted-foreground">
                    {item.tax_rate > 0 ? `${item.tax_rate}%` : '—'}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span>
                <span className="tabular-nums text-primary">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes / Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="px-8 py-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {invoice.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Terms</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-muted/20 text-xs text-muted-foreground text-center">
          Generated by Kleenah — Built for African business.
        </div>
      </div>

      {/* Audit trail timestamps */}
      <div className="flex gap-6 text-xs text-muted-foreground px-1">
        <span>Created {formatDate(invoice.created_at, 'MMM d, yyyy HH:mm')}</span>
        {invoice.sent_at && <span>Sent {formatDate(invoice.sent_at, 'MMM d, yyyy HH:mm')}</span>}
        {invoice.paid_at && <span>Paid {formatDate(invoice.paid_at, 'MMM d, yyyy HH:mm')}</span>}
      </div>
    </div>
  )
}
