'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, Building2, Globe, Clock, Upload, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { companySchema, type CompanyInput } from '@/lib/validations/company'
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

// African countries first, then rest alphabetically
const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'CM', name: 'Cameroon' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'TD', name: 'Chad' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'AO', name: 'Angola' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'Other', name: 'Other' },
]

const TIMEZONES = [
  { value: 'Africa/Lagos', label: 'WAT — West Africa Time (Lagos, Accra, Dakar)' },
  { value: 'Africa/Nairobi', label: 'EAT — East Africa Time (Nairobi, Dar es Salaam, Kampala)' },
  { value: 'Africa/Cairo', label: 'EET — Egypt / North Africa' },
  { value: 'Africa/Johannesburg', label: 'SAST — South Africa' },
  { value: 'Africa/Casablanca', label: 'WET — Morocco / Casablanca' },
  { value: 'Africa/Abidjan', label: 'GMT — Abidjan / Dakar' },
  { value: 'Europe/London', label: 'GMT/BST — London' },
  { value: 'Europe/Paris', label: 'CET — Paris / Brussels' },
  { value: 'America/New_York', label: 'EST — New York' },
  { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
]

const STEPS = [
  { id: 1, title: 'Company name', icon: Building2 },
  { id: 2, title: 'Country & currency', icon: Globe },
  { id: 3, title: 'Timezone & language', icon: Clock },
  { id: 4, title: 'Logo', icon: Upload },
  { id: 5, title: 'Done!', icon: CheckCircle2 },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export function CompanyWizard() {
  const t = useTranslations('onboarding')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null)

  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      country: '',
      currency: 'USD',
      timezone: 'Africa/Lagos',
      language: 'en',
    },
  })

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2MB')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleNext() {
    // Validate only the fields relevant to the current step
    const stepFields: Record<number, (keyof CompanyInput)[]> = {
      1: ['name'],
      2: ['country', 'currency'],
      3: ['timezone', 'language'],
      4: [],
    }
    const fields = stepFields[step]
    if (fields && fields.length > 0) {
      const valid = await form.trigger(fields)
      if (!valid) return
    }

    if (step === 4) {
      await handleSubmit()
      return
    }

    setStep((s) => Math.min(s + 1, 5))
  }

  async function handleSubmit() {
    if (!user) return
    setIsLoading(true)
    setServerError(null)

    const values = form.getValues()
    const slug = slugify(values.name) + '-' + Math.random().toString(36).slice(2, 6)

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: values.name,
        slug,
        country: values.country,
        currency: values.currency,
        timezone: values.timezone,
        language: values.language,
      })
      .select()
      .single()

    if (companyError || !company) {
      setServerError('Could not create company. Please try again.')
      setIsLoading(false)
      return
    }

    // Add the user as owner
    await supabase.from('company_users').insert({
      company_id: company.id,
      user_id: user.id,
      role: 'owner',
    })

    // Bootstrap default roles and chart of accounts
    await supabase.rpc('bootstrap_company', { p_company_id: company.id })

    // Upload logo if provided
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${company.id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
        await supabase
          .from('companies')
          .update({ logo_url: urlData.publicUrl })
          .eq('id', company.id)
      }
    }

    setCreatedCompanyId(company.id)
    setIsLoading(false)
    setStep(5)
  }

  function handleFinish() {
    router.push(`/${locale}`)
    router.refresh()
  }

  const values = form.watch()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                    step > s.id
                      ? 'bg-primary text-primary-foreground'
                      : step === s.id
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s.id ? '✓' : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-full mx-1 flex-1 transition-all',
                      step > s.id ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ width: '3rem' }}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {t('step', { current: Math.min(step, 4), total: 4 })}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-6">

          {/* Step 1: Company name */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">What&apos;s your company called?</h2>
                <p className="text-sm text-muted-foreground mt-1">You can change this later.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('companyName')}</label>
                <input
                  {...form.register('name')}
                  placeholder={t('companyNamePlaceholder')}
                  autoFocus
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none',
                    'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    form.formState.errors.name && 'border-destructive'
                  )}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Country & currency */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Where are you based?</h2>
                <p className="text-sm text-muted-foreground mt-1">Sets your default currency and tax settings.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('country')}</label>
                <select
                  {...form.register('country')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none',
                    'focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    form.formState.errors.country && 'border-destructive'
                  )}
                >
                  <option value="">{t('selectCountry')}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                {form.formState.errors.country && (
                  <p className="text-xs text-destructive">{form.formState.errors.country.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('currency')}</label>
                <select
                  {...form.register('currency')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Timezone & language */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Your timezone & language</h2>
                <p className="text-sm text-muted-foreground mt-1">Used for dates, reports, and the app interface.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('timezone')}</label>
                <select
                  {...form.register('timezone')}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('language')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'en', label: '🇬🇧 English' },
                    { value: 'fr', label: '🇫🇷 Français' },
                    { value: 'ar', label: '🇸🇦 العربية' },
                  ] as const).map((lang) => (
                    <label
                      key={lang.value}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm cursor-pointer transition-all hover:bg-muted',
                        values.language === lang.value
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      <input
                        type="radio"
                        value={lang.value}
                        {...form.register('language')}
                        className="sr-only"
                      />
                      {lang.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Logo */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Add your logo</h2>
                <p className="text-sm text-muted-foreground mt-1">Optional. PNG or JPG, max 2MB. You can upload this later.</p>
              </div>
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer hover:bg-muted/30 transition-colors py-10">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-xl object-cover" />
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t('logoHint')}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                  className="sr-only"
                />
              </label>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Remove logo
                </button>
              )}
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">You&apos;re all set!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{values.name}</span> is ready to go.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('back' as never) ?? 'Back'}
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === 4 ? 'Create company' : t('next' as never) ?? 'Next'}
                {!isLoading && step < 4 && <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {t('finish')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
