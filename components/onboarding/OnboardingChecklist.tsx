'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { CheckCircle2, Circle, Building2, UserPlus, Receipt, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { cn } from '@/lib/utils/cn'

interface ChecklistItem {
  id: string
  label: string
  description: string
  icon: React.ElementType
  href: string
  done: boolean
}

export function OnboardingChecklist() {
  const locale = useLocale()
  const supabase = createClient()
  const { company } = useCompanyStore()

  const [hasTeamMember, setHasTeamMember] = useState(false)
  const [hasInvoice, setHasInvoice] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!company) return

    async function check() {
      const [membersRes, invoicesRes] = await Promise.all([
        supabase
          .from('company_users')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company!.id)
          .neq('role', 'owner'),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company!.id),
      ])
      setHasTeamMember((membersRes.count ?? 0) > 0)
      setHasInvoice((invoicesRes.count ?? 0) > 0)
      setIsLoading(false)
    }

    check()
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const profileComplete =
    !!(company?.name && company?.country && company?.currency)

  const items: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete company profile',
      description: 'Add your logo, tax ID, and bank details.',
      icon: Building2,
      href: `/${locale}/settings/company`,
      done: profileComplete,
    },
    {
      id: 'invite',
      label: 'Invite a team member',
      description: 'Bring your accountant or manager on board.',
      icon: UserPlus,
      href: `/${locale}/settings/team`,
      done: hasTeamMember,
    },
    {
      id: 'invoice',
      label: 'Create your first invoice',
      description: 'Start getting paid faster.',
      icon: Receipt,
      href: `/${locale}/finance/invoices/new`,
      done: hasInvoice,
    },
  ]

  const completedCount = items.filter((i) => i.done).length
  const allDone = completedCount === items.length

  if (isLoading) return null

  if (allDone) {
    return (
      <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          Setup complete — you&apos;re ready to go!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Getting started</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{items.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-1 bg-primary transition-all duration-500"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      <div className="divide-y">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={item.done ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 group transition-colors',
                item.done
                  ? 'opacity-60 cursor-default'
                  : 'hover:bg-muted/30'
              )}
            >
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', item.done && 'line-through text-muted-foreground')}>
                  {item.label}
                </p>
                {!item.done && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
              {!item.done && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
