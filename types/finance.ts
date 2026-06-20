import type { Database } from './database'

export type Account = Database['public']['Tables']['accounts']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
export type InvoiceStatus = Invoice['status']

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert']

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type PaymentMethod = Expense['payment_method']

/**
 * Invoice with joined items and customer data.
 * Used on detail and PDF generation pages.
 */
export interface InvoiceWithDetails extends Invoice {
  items: InvoiceItem[]
  customer: Customer
}

/**
 * KPI summary for the finance dashboard.
 */
export interface FinanceSummary {
  totalRevenue: number
  outstanding: number
  overdue: number
  totalExpenses: number
  currency: string
}

/**
 * Monthly data point for charts.
 */
export interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit: number
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500 line-through',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  card: 'Card',
}

// AI_HOOK: Future — AI receipt parsing will extract amount, category,
// date, and merchant from uploaded receipt images via vision model.
// The extracted data will pre-fill the expense form.
