'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { cn } from '@/lib/utils/cn'

export default function ForgotPasswordPage() {
  const locale = useLocale()
  const supabase = createClient()
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    setIsLoading(true)
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    })
    setSent(true)
    setIsLoading(false)
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to <strong>{form.getValues('email')}</strong>.
          </p>
        </div>
        <Link href={`/${locale}/login`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email and we will send a reset link.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email address</label>
          <input
            {...form.register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              form.formState.errors.email && 'border-destructive'
            )}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </button>
      </form>
      <Link href={`/${locale}/login`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </div>
  )
}
