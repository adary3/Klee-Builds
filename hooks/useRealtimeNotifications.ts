'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { toast } from '@/hooks/useToast'

/**
 * Subscribes to Supabase Realtime for the current company.
 * Shows toast notifications when invoices are updated (e.g. marked paid).
 *
 * Mount once inside the dashboard layout.
 *
 * AI_HOOK: Future — AI can analyse incoming events and surface
 * intelligent alerts ("Invoice overdue — suggest payment reminder").
 */
export function useRealtimeNotifications() {
  const supabase = createClient()
  const { company } = useCompanyStore()

  useEffect(() => {
    if (!company) return

    // Channel: invoice status changes
    const invoiceChannel = supabase
      .channel(`company-${company.id}-invoices`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'invoices',
          filter: `company_id=eq.${company.id}`,
        },
        (payload) => {
          const newRow = payload.new as { status: string; number: string }
          const oldRow = payload.old as { status: string }

          // Only notify on meaningful status transitions
          if (newRow.status === oldRow.status) return

          const messages: Record<string, { title: string; description: string }> = {
            paid:      { title: 'Invoice paid 🎉',    description: `Invoice ${newRow.number} has been marked as paid.` },
            sent:      { title: 'Invoice sent',       description: `Invoice ${newRow.number} was sent to the customer.` },
            overdue:   { title: 'Invoice overdue ⚠️', description: `Invoice ${newRow.number} is past its due date.` },
            cancelled: { title: 'Invoice cancelled',  description: `Invoice ${newRow.number} was cancelled.` },
          }

          const msg = messages[newRow.status]
          if (msg) {
            toast({
              title:       msg.title,
              description: msg.description,
              variant:     newRow.status === 'overdue' ? 'destructive' : 'default',
            })
          }
        }
      )
      .subscribe()

    // Channel: new team members joining
    const teamChannel = supabase
      .channel(`company-${company.id}-team`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'company_users',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          toast({
            title:       'New team member',
            description: 'Someone just joined your company on Kleenah.',
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(invoiceChannel)
      supabase.removeChannel(teamChannel)
    }
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps
}
