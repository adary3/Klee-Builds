import type { Database } from './database'

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type CompanyUser = Database['public']['Tables']['company_users']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export type UserRole = 'owner' | 'admin' | 'manager' | 'accountant' | 'staff'

export const USER_ROLES: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  accountant: 'Accountant',
  staff: 'Staff',
}

export type Permission =
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.send'
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'reports.view'
  | 'team.view'
  | 'team.invite'
  | 'team.manage'
  | 'settings.view'
  | 'settings.edit'
  | 'audit.view'

export const ALL_PERMISSIONS: Permission[] = [
  'invoices.view',
  'invoices.create',
  'invoices.edit',
  'invoices.delete',
  'invoices.send',
  'expenses.view',
  'expenses.create',
  'expenses.edit',
  'expenses.delete',
  'customers.view',
  'customers.create',
  'customers.edit',
  'reports.view',
  'team.view',
  'team.invite',
  'team.manage',
  'settings.view',
  'settings.edit',
  'audit.view',
]

/**
 * Company member with joined profile data.
 * Used in team management views.
 */
export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  invited_by: string | null
  created_at: string
  profile: Profile | null
}

export interface CompanyAddress {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface BankDetails {
  bank_name?: string
  account_name?: string
  account_number?: string
  swift_code?: string
  iban?: string
}
