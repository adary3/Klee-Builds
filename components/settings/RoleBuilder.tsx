'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Shield, Loader2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { ALL_PERMISSIONS, type Permission, type Role } from '@/types/company'
import { writeAuditLog } from '@/lib/utils/audit'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils/cn'

const PERMISSION_GROUPS: Array<{ label: string; perms: Permission[] }> = [
  { label: 'Invoices', perms: ['invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.send'] },
  { label: 'Expenses', perms: ['expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete'] },
  { label: 'Customers', perms: ['customers.view', 'customers.create', 'customers.edit'] },
  { label: 'Reports', perms: ['reports.view'] },
  { label: 'Team', perms: ['team.view', 'team.invite', 'team.manage'] },
  { label: 'Settings', perms: ['settings.view', 'settings.edit'] },
  { label: 'Audit', perms: ['audit.view'] },
]

const PERM_LABELS: Record<Permission, string> = {
  'invoices.view': 'View', 'invoices.create': 'Create', 'invoices.edit': 'Edit',
  'invoices.delete': 'Delete', 'invoices.send': 'Send',
  'expenses.view': 'View', 'expenses.create': 'Create', 'expenses.edit': 'Edit', 'expenses.delete': 'Delete',
  'customers.view': 'View', 'customers.create': 'Create', 'customers.edit': 'Edit',
  'reports.view': 'View',
  'team.view': 'View', 'team.invite': 'Invite', 'team.manage': 'Manage',
  'settings.view': 'View', 'settings.edit': 'Edit',
  'audit.view': 'View',
}

interface RoleEditorProps {
  role: Role
  onSaved: () => void
  onDeleted: () => void
  canManage: boolean
}

function RoleEditor({ role, onSaved, onDeleted, canManage }: RoleEditorProps) {
  const supabase = createClient()
  const { company } = useCompanyStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [roleName, setRoleName] = useState(role.name)
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(
      ALL_PERMISSIONS.map((p) => [p, (role.permissions as Record<string, boolean>)[p] ?? false])
    )
  )

  function togglePerm(perm: string) {
    if (!canManage || role.is_system) return
    setPermissions((prev) => ({ ...prev, [perm]: !prev[perm] }))
  }

  function toggleGroup(perms: Permission[]) {
    const allOn = perms.every((p) => permissions[p])
    const update: Record<string, boolean> = {}
    perms.forEach((p) => { update[p] = !allOn })
    setPermissions((prev) => ({ ...prev, ...update }))
  }

  async function handleSave() {
    if (!company) { alert('No company found'); return }
    if (roleName.trim().length < 2) { alert('Role name must be at least 2 characters'); return }
    setIsSaving(true)
    const { error } = await supabase
      .from('roles')
      .update({ name: roleName.trim(), permissions })
      .eq('id', role.id)
    if (error) {
      alert('Save failed: ' + error.message)
      setIsSaving(false)
      return
    }
    await writeAuditLog({
      companyId: company.id, entity: 'role', entityId: role.id,
      action: 'update', before: role, after: { name: roleName, permissions },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setIsSaving(false)
    onSaved()
  }

  async function handleDelete() {
    if (!company || !confirm(`Delete role "${role.name}"?`)) return
    setIsDeleting(true)
    await supabase.from('roles').delete().eq('id', role.id)
    await writeAuditLog({ companyId: company.id, entity: 'role', entityId: role.id, action: 'delete', before: role })
    onDeleted()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          disabled={role.is_system || !canManage}
          placeholder="Role name"
          className={cn(
            'flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none',
            'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
            (role.is_system || !canManage) && 'opacity-60 cursor-not-allowed'
          )}
        />
        {role.is_system && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> System
          </span>
        )}
      </div>

      <div className="space-y-3">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.label} className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              {canManage && !role.is_system && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.perms)}
                  className="text-xs text-primary hover:underline"
                >
                  {group.perms.every((p) => permissions[p]) ? 'Clear all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 px-3 py-3">
              {group.perms.map((perm) => {
                const checked = permissions[perm] ?? false
                return (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePerm(perm)}
                    disabled={role.is_system || !canManage}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all select-none',
                      checked
                        ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                        : 'text-muted-foreground hover:border-muted-foreground/40',
                      (role.is_system || !canManage) && 'pointer-events-none opacity-70'
                    )}
                  >
                    {checked && <span>✓</span>}
                    {PERM_LABELS[perm]}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save role
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
        {!role.is_system && canManage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete role
          </button>
        )}
      </div>
    </div>
  )
}

export function RoleBuilder() {
  const supabase = createClient()
  const { company } = useCompanyStore()

  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()
      if (data?.role === 'owner' || data?.role === 'admin') {
        setCanManage(true)
      }
    }
    checkRole()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRoles = useCallback(async () => {
    if (!company) return
    const { data } = await supabase
      .from('roles')
      .select('*')
      .eq('company_id', company.id)
      .order('is_system', { ascending: false })
    setRoles((data as Role[]) ?? [])
    if (!activeId && data?.[0]) setActiveId(data[0].id)
    setIsLoading(false)
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadRoles() }, [loadRoles])

  async function createRole() {
    if (!company || !newRoleName.trim()) return
    setIsCreating(false)
    const { data } = await supabase
      .from('roles')
      .insert({
        company_id: company.id,
        name: newRoleName.trim(),
        permissions: Object.fromEntries(ALL_PERMISSIONS.map((p) => [p, false])),
        is_system: false,
      })
      .select()
      .single()

    if (data) {
      setNewRoleName('')
      await loadRoles()
      setActiveId(data.id)
    }
  }

  if (isLoading) return <LoadingSpinner centered />

  const activeRole = roles.find((r) => r.id === activeId)

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      <div className="lg:w-52 flex-shrink-0 space-y-1">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveId(role.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-left transition-colors',
              activeId === role.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{role.name}</span>
            {role.is_system && <Lock className="h-3 w-3 ml-auto opacity-50 flex-shrink-0" />}
          </button>
        ))}

        {isCreating ? (
          <div className="flex flex-col gap-1.5 pt-1">
            <input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Role name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createRole()}
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-1">
              <button
                onClick={createRole}
                className="flex-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewRoleName('') }}
                className="flex-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors mt-1"
          >
            <Plus className="h-3.5 w-3.5" /> New role
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {activeRole ? (
          <div className="rounded-xl border bg-card p-5">
            <RoleEditor
              key={activeRole.id}
              role={activeRole}
              onSaved={loadRoles}
              onDeleted={async () => { await loadRoles(); setActiveId(roles[0]?.id ?? null) }}
              canManage={canManage}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
            Select a role to edit its permissions.
          </div>
        )}
      </div>
    </div>
  )
}