'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { cn } from '@/lib/utils/cn'

export default function ResetPasswordPage() {
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' },
  })

  async function onSubmit(values: ResetPasswordInput) {
    setIsLoading(true)
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setServerError(error.message)
      setIsLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push(`/${locale}`), 2000)
  }

  if (done) {
    return (
      <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 p-8 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
        <p className="font-semibold text-green-800 dark:text-green-300">Password updated!</p>
        <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a strong password for your account.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {(['password', 'confirm_password'] as const).map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-sm font-medium">
              {field === 'password' ? 'New password' : 'Confirm password'}
            </label>
            <div className="relative">
              <input
                {...form.register(field)}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn(
                  'w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                  form.formState.errors[field] && 'border-destructive'
                )}
              />
              {field === 'password' && (
                <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
            {form.formState.errors[field] && (
              <p className="text-xs text-destructive">{form.formState.errors[field]?.message}</p>
            )}
          </div>
        ))}
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
          Update password
        </button>
      </form>
    </div>
  )
}
