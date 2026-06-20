'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, magicLinkSchema, type LoginInput, type MagicLinkInput } from '@/lib/validations/auth'
import { cn } from '@/lib/utils/cn'

type Mode = 'password' | 'magic'

export function LoginForm() {
  const t = useTranslations('auth')
  const te = useTranslations('errors')
  const locale = useLocale()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('password')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const passwordForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const magicForm = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  async function onPasswordSubmit(values: LoginInput) {
    setIsLoading(true)
    setServerError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    setIsLoading(false)

    if (error) {
      alert('ERROR: ' + error.message)
      return
    }

    if (!data.session) {
      alert('NO SESSION — data: ' + JSON.stringify(data))
      return
    }

    alert('SUCCESS — redirecting')
    window.location.href = `/${locale}`
  }

  async function onMagicSubmit(values: MagicLinkInput) {
    setIsLoading(true)
    setServerError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: `${window.location.origin}/${locale}` },
    })
    if (error) {
      setServerError(te('serverError'))
      setIsLoading(false)
      return
    }
    setMagicSent(true)
    setIsLoading(false)
  }

  if (magicSent) {
    return (
      <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <p className="font-semibold">{t('magicLinkSent')}</p>
        <button
          onClick={() => { setMagicSent(false); setMode('password') }}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t('login')} with password instead
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode switcher */}
      <div className="flex rounded-lg border p-1 gap-1">
        {(['password', 'magic'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setServerError(null) }}
            className={cn(
              'flex-1 py-1.5 text-sm rounded-md font-medium transition-all',
              mode === m
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {m === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      {mode === 'password' ? (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('email')}</label>
            <input
              {...passwordForm.register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none',
                'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                passwordForm.formState.errors.email && 'border-destructive'
              )}
            />
            {passwordForm.formState.errors.email && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('password')}</label>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input
                {...passwordForm.register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  'w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                  passwordForm.formState.errors.password && 'border-destructive'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.password && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
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
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('login')}
          </button>
        </form>
      ) : (
        <form onSubmit={magicForm.handleSubmit(onMagicSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('email')}</label>
            <input
              {...magicForm.register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none',
                'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                magicForm.formState.errors.email && 'border-destructive'
              )}
            />
            {magicForm.formState.errors.email && (
              <p className="text-xs text-destructive">{magicForm.formState.errors.email.message}</p>
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
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('sendMagicLink')}
          </button>
        </form>
      )}
    </div>
  )
}