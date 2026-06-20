'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2, Upload, X, Receipt } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { expenseSchema, expenseCategories, type ExpenseInput } from '@/lib/validations/expense'
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency'
import { toISODate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'

const CATEGORY_LABELS: Record<string, string> = {
  office: 'Office', travel: 'Travel', meals: 'Meals & entertainment',
  utilities: 'Utilities', salaries: 'Salaries', rent: 'Rent',
  equipment: 'Equipment', marketing: 'Marketing', software: 'Software',
  professional_services: 'Professional services', taxes: 'Taxes', other: 'Other',
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash', bank: 'Bank transfer', mobile_money: 'Mobile money', card: 'Card',
}

export function ExpenseForm() {
  const locale = useLocale()
  const router = useRouter()
  const { createExpense, uploadReceipt } = useExpenses()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      currency: 'USD',
      category: 'office',
      date: toISODate(new Date()),
      payment_method: 'cash',
      notes: '',
    },
  })

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Receipt must be under 5MB'); return }
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file))
    } else {
      setReceiptPreview(null) // PDF — show filename only
    }
  }

  async function onSubmit(values: ExpenseInput) {
    setIsSubmitting(true)
    setServerError(null)

    let receipt_url: string | undefined
    if (receiptFile) {
      setIsUploadingReceipt(true)
      const url = await uploadReceipt(receiptFile)
      if (url) receipt_url = url
      setIsUploadingReceipt(false)
    }

    const expense = await createExpense({ ...values, receipt_url })
    if (!expense) {
      setServerError('Could not save expense. Please try again.')
      setIsSubmitting(false)
      return
    }
    router.push(`/${locale}/finance/expenses`)
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'
  const errorClass = 'text-xs text-destructive mt-0.5'

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Description */}
        <div>
          <label className={labelClass}>Description *</label>
          <input
            {...form.register('description')}
            placeholder="What was this expense for?"
            autoFocus
            className={cn(inputClass, form.formState.errors.description && 'border-destructive')}
          />
          {form.formState.errors.description && (
            <p className={errorClass}>{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount *</label>
            <input
              {...form.register('amount')}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={cn(inputClass, form.formState.errors.amount && 'border-destructive')}
            />
            {form.formState.errors.amount && (
              <p className={errorClass}>{form.formState.errors.amount.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select {...form.register('currency')} className={inputClass}>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Payment method */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" {...form.register('date')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Payment method</label>
            <select {...form.register('payment_method')} className={inputClass}>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category *</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {expenseCategories.map((cat) => (
              <label
                key={cat}
                className={cn(
                  'flex items-center justify-center rounded-lg border py-2 px-2 text-xs cursor-pointer transition-all hover:bg-muted text-center',
                  form.watch('category') === cat
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <input type="radio" value={cat} {...form.register('category')} className="sr-only" />
                {CATEGORY_LABELS[cat]}
              </label>
            ))}
          </div>
          {form.formState.errors.category && (
            <p className={errorClass}>{form.formState.errors.category.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            {...form.register('notes')}
            rows={2}
            placeholder="Additional details…"
            className={cn(inputClass, 'resize-none')}
          />
        </div>
      </div>

      {/* Receipt upload */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold">Receipt</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Image or PDF, max 5MB. Stored securely.
            {/* AI_HOOK: Future — AI will auto-extract amount, date, merchant from uploaded receipt */}
          </p>
        </div>

        {!receiptFile ? (
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer hover:bg-muted/30 transition-colors py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Click to upload receipt</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleReceiptChange}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border p-3">
            {receiptPreview ? (
              <img src={receiptPreview} alt="Receipt" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{receiptFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(receiptFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
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
          onClick={() => router.push(`/${locale}/finance/expenses`)}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {(isSubmitting || isUploadingReceipt) && <Loader2 className="h-4 w-4 animate-spin" />}
          {isUploadingReceipt ? 'Uploading…' : 'Save expense'}
        </button>
      </div>
    </form>
  )
}
