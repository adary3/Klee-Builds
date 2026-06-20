import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { writeAuditLog } from '@/lib/utils/audit'
import type { Invoice, InvoiceWithDetails, InvoiceStatus } from '@/types/finance'
import type { InvoiceInput } from '@/lib/validations/invoice'

interface UseInvoicesOptions {
  status?: InvoiceStatus
  search?: string
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { company } = useCompanyStore()
  const supabase = createClient()

  const fetchInvoices = useCallback(async () => {
    if (!company) return
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('invoices')
      .select('*, customer:customers(name, email)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.search) {
      query = query.or(
        `number.ilike.%${options.search}%`
      )
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setInvoices((data as Invoice[]) ?? [])
    }
    setIsLoading(false)
  }, [company?.id, options.status, options.search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  async function getInvoice(id: string): Promise<InvoiceWithDetails | null> {
    const { data } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), customer:customers(*)')
      .eq('id', id)
      .single()

    return data as InvoiceWithDetails | null
  }

  async function createInvoice(input: InvoiceInput): Promise<Invoice | null> {
    if (!company) return null

    const { items, ...invoiceData } = input

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    )
    const taxAmount = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unit_price * (item.tax_rate / 100),
      0
    )
    const total = subtotal + taxAmount

    const { data: invoice, error: createError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        company_id: company.id,
        subtotal,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single()

    if (createError || !invoice) return null

    // Insert line items
    await supabase.from('invoice_items').insert(
      items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate ?? 0,
        amount: item.quantity * item.unit_price,
      }))
    )

    await writeAuditLog({
      companyId: company.id,
      entity: 'invoice',
      entityId: invoice.id,
      action: 'create',
      after: invoice,
    })

    await fetchInvoices()
    return invoice as Invoice
  }

  async function updateInvoiceStatus(
    id: string,
    status: InvoiceStatus
  ): Promise<void> {
    if (!company) return

    const extra: Partial<Invoice> = {}
    if (status === 'sent') extra.sent_at = new Date().toISOString()
    if (status === 'paid') extra.paid_at = new Date().toISOString()

    const { data: before } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    await supabase.from('invoices').update({ status, ...extra }).eq('id', id)

    await writeAuditLog({
      companyId: company.id,
      entity: 'invoice',
      entityId: id,
      action: status === 'paid' ? 'pay' : status === 'sent' ? 'send' : 'update',
      before: before ?? undefined,
      after: { status, ...extra },
    })

    await fetchInvoices()
  }

  async function deleteInvoice(id: string): Promise<void> {
    if (!company) return

    const { data: before } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    await supabase.from('invoices').delete().eq('id', id)

    await writeAuditLog({
      companyId: company.id,
      entity: 'invoice',
      entityId: id,
      action: 'delete',
      before: before ?? undefined,
    })

    await fetchInvoices()
  }

  return {
    invoices,
    isLoading,
    error,
    refresh: fetchInvoices,
    getInvoice,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
  }
}
