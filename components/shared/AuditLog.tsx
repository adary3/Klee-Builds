'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { timeAgo } from '@/lib/utils/date'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'
import { ShieldCheck } from 'lucide-react'
import type { AuditLog } from '@/types/company'

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  send: 'Sent',
  pay: 'Marked paid',
  invite: 'Invited',
  login: 'Logged in',
  logout: 'Logged out',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  send: 'bg-purple-100 text-purple-700',
  pay: 'bg-green-100 text-green-700',
  invite: 'bg-orange-100 text-orange-700',
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { company } = useCompanyStore()
  const supabase = createClient()

  useEffect(() => {
    if (!company) return

    async function fetchLogs() {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setLogs((data as AuditLog[]) ?? [])
      setIsLoading(false)
    }

    fetchLogs()
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <LoadingSpinner />

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No activity yet"
        description="Actions taken by your team will appear here."
      />
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm"
        >
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${
              ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {ACTION_LABELS[log.action] ?? log.action}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground capitalize">
                {log.entity}
              </span>{' '}
              {log.entity_id && (
                <span className="font-mono text-xs opacity-60">
                  {log.entity_id.slice(0, 8)}
                </span>
              )}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {timeAgo(log.created_at)}
          </span>
        </div>
      ))}
    </div>
  )
}
