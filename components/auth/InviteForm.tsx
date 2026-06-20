'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { cn } from '@/lib/utils/cn'

type InviteState = 'loading' | 'valid' | 'expired' | 'accepted'

interface InviteMeta {
  email: string
  companyName: string
  role: string
}

export function InviteForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const token = searchParams.get('token')
  const [state, setState] = useState<InviteState>('loading')
  const [meta, setMeta] = useState<InviteMeta | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  })

  useEffect(() => {
    async function validateToken() {
      if (!token) { setState('expired'); return }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawInvitation } = await supabase
        .from('invitations')
        .select('*, company:companies(name)')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!rawInvitation) { setState('expired'); return }

      const invitation = rawInvitation as any
      const company = invitation.company as { name: string } | null
      setMeta({
        email: invitation.email,
        companyName: company?.name ?? 'your company',
        role: invitation.role,
      })
      form.setValue('email', invitation.email)
      setState('valid')
    }

    validateToken()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: RegisterInput) {
    if (!token || !meta) return
    setIsLoading(true)
    setServerError(null)

    // Sign up the new user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.full_name } },
    })

    if (signUpError || !authData.user) {
      setServerError(t('registerError'))
      setIsLoading(false)
      return
    }

    // Mark invitation as accepted
    (supabase.from('invitations') as any)
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', token)

    setState('accepted')
    setTimeout(() => router.push(`/${locale}`), 2000)
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="rounded-xl border bg-destructive/5 p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="font-semibold">{t('inviteExpired')}</p>
        <p className="text-sm text-muted-foreground">Ask your team admin to send a new invitation.</p>
      </div>
    )
  }

  if (state === 'accepted') {
    return (
      <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 p-8 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
        <p className="font-semibold text-green-800 dark:text-green-300">{t('inviteAccepted')}</p>
        <p className="text-sm text-muted-foreground">Redirecting you now...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {meta && (
        <div className="rounded-lg border bg-primary/5 px-4 py-3 text-sm">
          You've been invited to join{' '}
          <span className="font-semibold">{meta.companyName}</span> as{' '}
          <span className="font-semibold capitalize">{meta.role}</span>.
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('fullName')}</label>
          <input
            {...form.register('full_name')}
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              form.formState.errors.full_name && 'border-destructive'
            )}
          />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('email')}</label>
          <input
            {...form.register('email')}
            type="email"
            readOnly
            className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('password')}</label>
          <input
            {...form.register('password')}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              form.formState.errors.password && 'border-destructive'
            )}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('confirmPassword')}</label>
          <input
            {...form.register('confirm_password')}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              form.formState.errors.confirm_password && 'border-destructive'
            )}
          />
          {form.formState.errors.confirm_password && (
            <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Accept & Create Account
        </button>
      </form>
    </div>
  )
}
