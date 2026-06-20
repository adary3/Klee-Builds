'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { cn } from '@/lib/utils/cn'

export function RegisterForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  })

  async function onSubmit(values: RegisterInput) {
    setIsLoading(true)
    setServerError(null)

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
        emailRedirectTo: `${window.location.origin}/${locale}`,
      },
    })

    if (error) {
      setServerError(t('registerError'))
      setIsLoading(false)
      return
    }

    // On success, redirect to onboarding / dashboard
    // The auth trigger will auto-create the profile
    router.push(`/${locale}`)
    router.refresh()
  }

  const fields: Array<{
    name: keyof RegisterInput
    label: string
    type: string
    placeholder: string
    autoComplete: string
  }> = [
    { name: 'full_name', label: t('fullName'), type: 'text', placeholder: 'Ada Okonkwo', autoComplete: 'name' },
    { name: 'email', label: t('email'), type: 'email', placeholder: 'ada@company.com', autoComplete: 'email' },
    { name: 'password', label: t('password'), type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
    { name: 'confirm_password', label: t('confirmPassword'), type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
  ]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field) => {
        const isPasswordField = field.type === 'password'
        const error = form.formState.errors[field.name]

        return (
          <div key={field.name} className="space-y-1">
            <label className="text-sm font-medium">{field.label}</label>
            <div className="relative">
              <input
                {...form.register(field.name)}
                type={isPasswordField && showPassword ? 'text' : field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                className={cn(
                  'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                  isPasswordField && 'pr-10',
                  error && 'border-destructive'
                )}
              />
              {isPasswordField && field.name === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
            {error && (
              <p className="text-xs text-destructive">{error.message}</p>
            )}
          </div>
        )
      })}

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
        {t('register')}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
