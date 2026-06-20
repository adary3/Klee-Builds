import { z } from 'zod'

export const expenseCategories = [
  'office',
  'travel',
  'meals',
  'utilities',
  'salaries',
  'rent',
  'equipment',
  'marketing',
  'software',
  'professional_services',
  'taxes',
  'other',
] as const

export type ExpenseCategory = (typeof expenseCategories)[number]

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  category: z.enum(expenseCategories),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.enum(['cash', 'bank', 'mobile_money', 'card']).default('cash'),
  account_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  // receipt_url is set separately after file upload
  receipt_url: z.string().url().optional().or(z.literal('')),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
