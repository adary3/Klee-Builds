import { z } from 'zod'

export const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  country: z.string().min(2, 'Please select a country'),
  currency: z.string().min(3).max(3, 'Invalid currency code'),
  timezone: z.string().min(1, 'Please select a timezone'),
  language: z.enum(['en', 'fr', 'ar']),
  tax_id: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  bank_details: z.object({
    bank_name: z.string().optional(),
    account_name: z.string().optional(),
    account_number: z.string().optional(),
    swift_code: z.string().optional(),
    iban: z.string().optional(),
  }).optional(),
})

export const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'staff', 'accountant']),
})

export const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(50),
  permissions: z.record(z.string(), z.boolean()),
})

export type CompanyInput = z.infer<typeof companySchema>
export type InviteInput = z.infer<typeof inviteSchema>
export type RoleInput = z.infer<typeof roleSchema>