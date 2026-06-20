'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { useInvoices } from '@/hooks/useInvoices'
import { invoiceSchema, type InvoiceInput } from '@/lib/validations/invoice'
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency'
import { toISODate } from '@/lib/utils/date'
import type { Customer } from '@/types/finance'
import { cn } from '@/lib/utils/cn'

// Add days to today for default due date
function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

function generateInvoiceNumber(count: number) {
  return `INV-${String(count + 1).padStart(4, '0')}`
}

export function InvoiceForm() {
  const router = useRouter()
  const locale = useLocale()
  const supabase = createClient()
  const { company } = useCompanyStore()
  const { createInvoice } = useInvoices()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      number: '',
      customer_id: '',
      status: 'draft',
      issue_date: toISODate(new Date()),
      due_date: addDays(30),
      currency: company?.currency ?? 'USD',
      exchange_rate: 1,
      is_recurring: false,
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
      notes: '',
      terms: 'Payment due within 30 days.',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Load customers and invoice count
  useEffect(() => {
    if (!company) return
    Promise.all([
      supabase.from('customers').select('*').eq('company_id', company.id).order('name'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
    ]).then(([custRes, countRes]) => {
      setCustomers((custRes.data as Customer[]) ?? [])
      const count = countRes.count ?? 0
      setInvoiceCount(count)
      form.setValue('number', generateInvoiceNumber(count))
    })
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch items to compute totals live
  const items = form.watch('items') ?? []
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const taxAmount = items.reduce((s, i) => {
    const lineTotal = (Number(i.quantity) || 0) * (Number(i.unit_price) || 0)
    return s + lineTotal * ((Number(i.tax_rate) || 0) / 100)
  }, 0)
  const total = subtotal + taxAmount

  async function handleCreateCustomer() {
    if (!company || !newCustomerName.trim()) return
    const { data } = await supabase
      .from('customers')
      .insert({ company_id: company.id, name: newCustomerName.trim(), currency: company.currency })
      .select()
      .single()
    if (data) {
      setCustomers((prev) => [...prev, data as Customer])
      form.setValue('customer_id', data.id)
      setShowNewCustomer(false)
      setNewCustomerName('')
    }
  }

  async function onSubmit(values: InvoiceInput, asDraft = false) {
    setIsSubmitting(true)
    setServerError(null)
    const finalValues = { ...values, status: asDraft ? 'draft' as const : values.status }
    const invoice = await createInvoice(finalValues)
    if (!invoice) {
      setServerError('Could not save invoice. Please try again.')
      setIsSubmitting(false)
      return
    }
    router.push(`/${locale}/finance/invoices/${invoice.id}`)
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'
  const errorClass = 'text-xs text-destructive mt-0.5'

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-6 max-w-4xl">
      {/* Header row: number, customer, dates */}
      <div className="rounded-xl border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invoice number */}
        <div>
          <label className={labelClass}>Invoice #</label>
          <input {...form.register('number')} className={cn(inputClass, form.formState.errors.number && 'border-destructive')} />
          {form.formState.errors.number && <p className={errorClass}>{form.formState.errors.number.message}</p>}
        </div>

        {/* Issue date */}
        <div>
          <label className={labelClass}>Issue date</label>
          <input type="date" {...form.register('issue_date')} className={inputClass} />
        </div>

        {/* Due date */}
        <div>
          <label className={labelClass}>Due date</label>
          <input type="date" {...form.register('due_date')} className={cn(inputClass, form.formState.errors.due_date && 'border-destructive')} />
          {form.formState.errors.due_date && <p className={errorClass}>{form.formState.errors.due_date.message}</p>}
        </div>

        {/* Currency */}
        <div>
          <label className={labelClass}>Currency</label>
          <select {...form.register('currency')} className={inputClass}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Bill to</h3>
        {!showNewCustomer ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                {...form.register('customer_id')}
                className={cn(inputClass, form.formState.errors.customer_id && 'border-destructive')}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.formState.errors.customer_id && (
                <p className={errorClass}>{form.formState.errors.customer_id.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNewCustomer(true)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" /> New customer
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Customer name"
              autoFocus
              className={cn(inputClass, 'flex-1')}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCustomer())}
            />
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowNewCustomer(false)}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold">Line items</h3>
        </div>

        {/* Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit price</div>
          <div className="col-span-1 text-right">Tax %</div>
          <div className="col-span-1 text-right">Amount</div>
          <div className="col-span-1" />
        </div>

        {/* Items */}
        <div className="divide-y">
          {fields.map((field, i) => {
            const qty = Number(form.watch(`items.${i}.quantity`)) || 0
            const price = Number(form.watch(`items.${i}.unit_price`)) || 0
            const tax = Number(form.watch(`items.${i}.tax_rate`)) || 0
            const lineTotal = qty * price * (1 + tax / 100)

            return (
              <div key={field.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-center">
                <div className="col-span-12 sm:col-span-5">
                  <input
                    {...form.register(`items.${i}.description`)}
                    placeholder="Item or service description"
                    className={cn(inputClass, form.formState.errors.items?.[i]?.description && 'border-destructive')}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    {...form.register(`items.${i}.quantity`)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1"
                    className={cn(inputClass, 'text-right')}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    {...form.register(`items.${i}.unit_price`)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={cn(inputClass, 'text-right')}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <input
                    {...form.register(`items.${i}.tax_rate`)}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    className={cn(inputClass, 'text-right')}
                  />
                </div>
                <div className="col-span-1 sm:col-span-1 text-right">
                  <span className="text-sm font-medium tabular-nums">
                    {lineTotal.toFixed(2)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-3 border-t flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 0 })}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
          >
            <Plus className="h-3.5 w-3.5" /> Add line
          </button>

          {/* Totals */}
          <div className="text-right space-y-1 text-sm">
            <div className="flex justify-between gap-8 text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8 text-muted-foreground">
              <span>Tax</span>
              <span className="tabular-nums">{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8 font-bold border-t pt-1">
              <span>Total</span>
              <span className="tabular-nums">{total.toFixed(2)} {form.watch('currency')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes + Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-2">
          <label className={labelClass}>Notes (shown on invoice)</label>
          <textarea
            {...form.register('notes')}
            rows={3}
            placeholder="Thank you for your business."
            className={cn(inputClass, 'resize-none')}
          />
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-2">
          <label className={labelClass}>Payment terms</label>
          <textarea
            {...form.register('terms')}
            rows={3}
            placeholder="Payment due within 30 days."
            className={cn(inputClass, 'resize-none')}
          />
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => form.handleSubmit((v) => onSubmit(v, true))()}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save as draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create invoice
        </button>
      </div>
    </form>
  )
}
