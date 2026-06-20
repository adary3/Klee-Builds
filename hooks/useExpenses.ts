import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { writeAuditLog } from '@/lib/utils/audit'
import type { Expense } from '@/types/finance'
import type { ExpenseInput } from '@/lib/validations/expense'

interface UseExpensesOptions {
  category?: string
  search?: string
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { company } = useCompanyStore()
  const supabase = createClient()

  const fetchExpenses = useCallback(async () => {
    if (!company) return
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false })

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.search) {
      query = query.ilike('description', `%${options.search}%`)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setExpenses((data as Expense[]) ?? [])
    }
    setIsLoading(false)
  }, [company?.id, options.category, options.search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  async function createExpense(input: ExpenseInput): Promise<Expense | null> {
    if (!company) return null

    const { data: expense, error: createError } = await supabase
      .from('expenses')
      .insert({
        ...input,
        company_id: company.id,
        receipt_url: input.receipt_url || null,
        account_id: input.account_id || null,
      })
      .select()
      .single()

    if (createError || !expense) return null

    await writeAuditLog({
      companyId: company.id,
      entity: 'expense',
      entityId: expense.id,
      action: 'create',
      after: expense,
    })

    await fetchExpenses()
    return expense as Expense
  }

  async function updateExpense(
    id: string,
    input: Partial<ExpenseInput>
  ): Promise<void> {
    if (!company) return

    const { data: before } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    const { data: after } = await supabase
      .from('expenses')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    await writeAuditLog({
      companyId: company.id,
      entity: 'expense',
      entityId: id,
      action: 'update',
      before: before ?? undefined,
      after: after ?? undefined,
    })

    await fetchExpenses()
  }

  async function deleteExpense(id: string): Promise<void> {
    if (!company) return

    const { data: before } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    await supabase.from('expenses').delete().eq('id', id)

    await writeAuditLog({
      companyId: company.id,
      entity: 'expense',
      entityId: id,
      action: 'delete',
      before: before ?? undefined,
    })

    await fetchExpenses()
  }

  /**
   * Upload a receipt file to Supabase Storage.
   * Returns the public URL to store on the expense record.
   */
  async function uploadReceipt(file: File): Promise<string | null> {
    if (!company) return null

    const ext = file.name.split('.').pop()
    const path = `${company.id}/receipts/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, file, { upsert: false })

    if (uploadError) return null

    const { data } = supabase.storage.from('receipts').getPublicUrl(path)
    return data.publicUrl
  }

  return {
    expenses,
    isLoading,
    error,
    refresh: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt,
  }
}
