import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
})

export const invoiceSchema = z.object({
  customer_id: z.string().uuid('Please select a customer'),
  number: z.string().min(1, 'Invoice number is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  currency: z.string().min(3).max(3),
  exchange_rate: z.coerce.number().positive().default(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z
    .enum(['weekly', 'monthly', 'quarterly', 'yearly'])
    .optional(),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one line item is required'),
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  currency: z.string().min(3).max(3).default('USD'),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type CustomerInput = z.infer<typeof customerSchema>
