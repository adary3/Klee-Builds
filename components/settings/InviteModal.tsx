'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Send, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/store/authStore'
import { inviteSchema, type InviteInput } from '@/lib/validations/company'
import { writeAuditLog } from '@/lib/utils/audit'
import { cn } from '@/lib/utils/cn'

interface InviteModalProps {
  onClose: () => void
  onSuccess: () => void
}

const ROLE_OPTIONS = [
  { value: 'admin',      label: 'Admin',      desc: 'Full access except billing' },
  { value: 'manager',    label: 'Manager',    desc: 'Manage invoices and team' },
  { value: 'accountant', label: 'Accountant', desc: 'Finance access, no team management' },
  { value: 'staff',      label: 'Staff',      desc: 'View and create only' },
]

export function InviteModal({ onClose, onSuccess }: InviteModalProps) {
  const supabase = createClient()
  const { company } = useCompanyStore()
  const { user } = useAuthStore()

  const [isSending, setIsSending] = useState(false)
  const [sent, setSent]           = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'staff' },
  })

  async function onSubmit(values: InviteInput) {
    if (!company || !user) return
    setIsSending(true)
    setServerError(null)

    // Call the send-invite Edge Function
    const { error } = await supabase.functions.invoke('send-invite', {
      body: {
        email:       values.email,
        role:        values.role,
        company_id:  company.id,
        invited_by:  user.id,
      },
    })

    if (error) {
      setServerError('Could not send invitation. Please try again.')
      setIsSending(false)
      return
    }

    await writeAuditLog({
      companyId: company.id,
      entity:    'invitation',
      action:    'invite',
      after:     { email: values.email, role: values.role },
    })

    setSent(true)
    setIsSending(false)
    setTimeout(() => { onSuccess(); onClose() }, 1800)
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Invite team member</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-10 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <p className="font-semibold">Invitation sent!</p>
            <p className="text-sm text-muted-foreground">
              {form.getValues('email')} will receive an email with a link valid for 7 days.
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email address</label>
              <input
                {...form.register('email')}
                type="email"
                placeholder="colleague@company.com"
                autoFocus
                className={cn(inputClass, form.formState.errors.email && 'border-destructive')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role.value}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-muted/30',
                      form.watch('role') === role.value && 'border-primary bg-primary/5'
                    )}
                  >
                    <input
                      type="radio"
                      value={role.value}
                      {...form.register('role')}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        form.watch('role') === role.value && 'text-primary'
                      )}>
                        {role.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
