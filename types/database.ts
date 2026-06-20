/**
 * Auto-generate this file by running:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 *
 * The types below are a hand-written scaffold matching the migrations.
 * Replace with the generated output once your Supabase project is live.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          country: string
          currency: string
          timezone: string
          language: string
          plan: string
          logo_url: string | null
          address: Json
          tax_id: string | null
          bank_details: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['companies']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['profiles']['Row'],
          'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      company_users: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          is_active: boolean
          invited_by: string | null
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['company_users']['Row'],
          'id' | 'created_at'
        >
        Update: Partial<Database['public']['Tables']['company_users']['Insert']>
      }
      roles: {
        Row: {
          id: string
          company_id: string
          name: string
          permissions: Json
          is_system: boolean
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['roles']['Row'],
          'id' | 'created_at'
        >
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }
      invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: string
          token: string
          invited_by: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['invitations']['Row'],
          'id' | 'token' | 'created_at'
        >
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          entity: string
          entity_id: string | null
          action: string
          before: Json | null
          after: Json | null
          ip: string | null
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['audit_logs']['Row'],
          'id' | 'created_at'
        >
        Update: never
      }
      accounts: {
        Row: {
          id: string
          company_id: string
          code: string
          name: string
          type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
          parent_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['accounts']['Row'],
          'id' | 'created_at'
        >
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      customers: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          address: Json
          tax_id: string | null
          currency: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['customers']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          currency: string
          exchange_rate: number
          subtotal: number
          tax_amount: number
          total: number
          notes: string | null
          terms: string | null
          is_recurring: boolean
          recurring_interval: string | null
          sent_at: string | null
          paid_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['invoices']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          tax_rate: number
          amount: number
          created_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['invoice_items']['Row'],
          'id' | 'created_at'
        >
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          company_id: string
          account_id: string | null
          description: string
          amount: number
          currency: string
          category: string
          date: string
          receipt_url: string | null
          payment_method: 'cash' | 'bank' | 'mobile_money' | 'card'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['expenses']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
