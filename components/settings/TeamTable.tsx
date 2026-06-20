'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, MoreHorizontal, ShieldCheck, UserX, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/store/authStore'
import { InviteModal } from './InviteModal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { writeAuditLog } from '@/lib/utils/audit'
import { timeAgo } from '@/lib/utils/date'
import { USER_ROLES, type UserRole, type CompanyMember } from '@/types/company'
import { cn } from '@/lib/utils/cn'

const ROLE_COLORS: Record<string, string> = {
  owner:      'bg-purple-100 text-purple-700',
  admin:      'bg-blue-100 text-blue-700',
  manager:    'bg-indigo-100 text-indigo-700',
  accountant: 'bg-green-100 text-green-700',
  staff:      'bg-gray-100 text-gray-700',
}

export function TeamTable() {
  const supabase = createClient()
  const { company, currentRole } = useCompanyStore()
  const { user } = useAuthStore()

  const [members, setMembers]         = useState<CompanyMember[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [showInvite, setShowInvite]   = useState(false)
  const [menuOpenId, setMenuOpenId]   = useState<string | null>(null)
  const [pendingId, setPendingId]     = useState<string | null>(null)

  const canManage = currentRole === 'owner' || currentRole === 'admin'

  const loadMembers = useCallback(async () => {
    if (!company) return
    setIsLoading(true)

    const { data } = await supabase
      .from('company_users')
      .select('*, profile:profiles(*)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true })

    setMembers(
      (data ?? []).map((m) => ({
        ...m,
        profile: m.profile as CompanyMember['profile'],
      })) as CompanyMember[]
    )
    setIsLoading(false)
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMembers() }, [loadMembers])

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setMenuOpenId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  async function changeRole(memberId: string, userId: string, newRole: UserRole) {
    if (!company) return
    setPendingId(memberId)
    await supabase.from('company_users').update({ role: newRole }).eq('id', memberId)
    await writeAuditLog({ companyId: company.id, entity: 'team', entityId: userId, action: 'update', after: { role: newRole } })
    await loadMembers()
    setPendingId(null)
    setMenuOpenId(null)
  }

  async function toggleActive(memberId: string, userId: string, isActive: boolean) {
    if (!company) return
    setPendingId(memberId)
    await supabase.from('company_users').update({ is_active: !isActive }).eq('id', memberId)
    await writeAuditLog({ companyId: company.id, entity: 'team', entityId: userId, action: 'update', after: { is_active: !isActive } })
    await loadMembers()
    setPendingId(null)
    setMenuOpenId(null)
  }

  if (isLoading) return <LoadingSpinner centered />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        )}
      </div>

      {/* Table */}
      {members.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No team members yet"
          description="Invite your accountant or manager to get started."
          action={
            canManage ? (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4" /> Invite member
              </button>
            ) : null
          }
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                {canManage && <th className="px-5 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => {
                const isSelf = member.user_id === user?.id
                const isOwner = member.role === 'owner'
                const isPending = pendingId === member.id

                return (
                  <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                    {/* Member info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                          {member.profile?.avatar_url
                            ? <img src={member.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                            : (member.profile?.full_name?.[0] ?? '?')}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.profile?.full_name ?? 'Unknown'}
                            {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-700'
                      )}>
                        {USER_ROLES[member.role as UserRole] ?? member.role}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {timeAgo(member.created_at)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        member.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-5 py-3.5">
                        {!isSelf && !isOwner && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === member.id ? null : member.id)}
                              disabled={isPending}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {menuOpenId === member.id && (
                              <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border bg-popover shadow-lg z-20 py-1">
                                {/* Change role */}
                                <div className="px-3 py-1.5">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Change role</p>
                                  {(['admin', 'manager', 'accountant', 'staff'] as UserRole[]).map((r) => (
                                    <button
                                      key={r}
                                      onClick={() => changeRole(member.id, member.user_id, r)}
                                      className={cn(
                                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                                        member.role === r && 'font-medium text-primary'
                                      )}
                                    >
                                      {member.role === r && <ShieldCheck className="h-3.5 w-3.5" />}
                                      <span className={member.role === r ? '' : 'ml-5'}>{USER_ROLES[r]}</span>
                                    </button>
                                  ))}
                                </div>
                                <div className="border-t my-1" />
                                {/* Deactivate/reactivate */}
                                <button
                                  onClick={() => toggleActive(member.id, member.user_id, member.is_active)}
                                  className={cn(
                                    'flex w-full items-center gap-2 px-4 py-1.5 text-sm transition-colors',
                                    member.is_active
                                      ? 'text-destructive hover:bg-destructive/10'
                                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
                                  )}
                                >
                                  {member.is_active
                                    ? <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                                    : <><UserCheck className="h-3.5 w-3.5" /> Reactivate</>
                                  }
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={loadMembers}
        />
      )}
    </div>
  )
}
