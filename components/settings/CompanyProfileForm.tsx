'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, Building2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { companySchema, type CompanyInput } from '@/lib/validations/company'
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency'
import { writeAuditLog } from '@/lib/utils/audit'
import { cn } from '@/lib/utils/cn'

const TIMEZONES = [
  { value: 'Africa/Lagos',        label: 'WAT — West Africa Time' },
  { value: 'Africa/Nairobi',      label: 'EAT — East Africa Time' },
  { value: 'Africa/Cairo',        label: 'EET — Egypt / North Africa' },
  { value: 'Africa/Johannesburg', label: 'SAST — South Africa' },
  { value: 'Africa/Casablanca',   label: 'WET — Morocco' },
  { value: 'Africa/Abidjan',      label: 'GMT — Abidjan / Dakar' },
  { value: 'Europe/London',       label: 'GMT/BST — London' },
  { value: 'Europe/Paris',        label: 'CET — Paris' },
  { value: 'America/New_York',    label: 'EST — New York' },
  { value: 'UTC',                 label: 'UTC' },
]

export function CompanyProfileForm() {
  const supabase = createClient()
  const { company, setCompany } = useCompanyStore()

  const [isSaving, setIsSaving]           = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [logoFile, setLogoFile]           = useState<File | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string | null>(company?.logo_url ?? null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name:     company?.name     ?? '',
      country:  company?.country  ?? '',
      currency: company?.currency ?? 'USD',
      timezone: company?.timezone ?? 'Africa/Lagos',
      language: (company?.language as 'en' | 'fr' | 'ar') ?? 'en',
      tax_id:   company?.tax_id   ?? '',
      address: {
        street:      (company?.address as Record<string,string>)?.street      ?? '',
        city:        (company?.address as Record<string,string>)?.city        ?? '',
        state:       (company?.address as Record<string,string>)?.state       ?? '',
        postal_code: (company?.address as Record<string,string>)?.postal_code ?? '',
      },
      bank_details: {
        bank_name:      (company?.bank_details as Record<string,string>)?.bank_name      ?? '',
        account_name:   (company?.bank_details as Record<string,string>)?.account_name   ?? '',
        account_number: (company?.bank_details as Record<string,string>)?.account_number ?? '',
        swift_code:     (company?.bank_details as Record<string,string>)?.swift_code     ?? '',
        iban:           (company?.bank_details as Record<string,string>)?.iban           ?? '',
      },
    },
  })

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(values: CompanyInput) {
    if (!company) return
    setIsSaving(true)
    setSaved(false)

    let logo_url = company.logo_url

    // Upload new logo if changed
    if (logoFile) {
      setIsUploadingLogo(true)
      const ext = logoFile.name.split('.').pop()
      const path = `${company.id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('logos').getPublicUrl(path)
        logo_url = data.publicUrl
      }
      setIsUploadingLogo(false)
    }

    const before = { ...company }
    const { data: updated, error } = await supabase
      .from('companies')
      .update({
        name:         values.name,
        country:      values.country,
        currency:     values.currency,
        timezone:     values.timezone,
        language:     values.language,
        tax_id:       values.tax_id ?? null,
        address:      values.address ?? {},
        bank_details: values.bank_details ?? {},
        logo_url,
      })
      .eq('id', company.id)
      .select()
      .single()

    if (!error) {
      setCompany(updated)
      await writeAuditLog({
        companyId: company.id,
        entity: 'company',
        entityId: company.id,
        action: 'update',
        before,
        after: updated,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setIsSaving(false)
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

      {/* Logo */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Company logo</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              : <Building2 className="h-7 w-7 text-muted-foreground" />
            }
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {logoPreview ? 'Change logo' : 'Upload logo'}
            </button>
            <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} className="sr-only" />
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Company information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Company name *</label>
            <input {...form.register('name')} className={cn(inputClass, form.formState.errors.name && 'border-destructive')} />
            {form.formState.errors.name && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select {...form.register('currency')} className={inputClass}>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select {...form.register('timezone')} className={inputClass}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <select {...form.register('language')} className={inputClass}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tax ID / VAT number</label>
            <input {...form.register('tax_id')} placeholder="Optional" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Street address</label>
            <input {...form.register('address.street')} placeholder="123 Main Street" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input {...form.register('address.city')} placeholder="Lagos" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>State / Region</label>
            <input {...form.register('address.state')} placeholder="Lagos State" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Postal code</label>
            <input {...form.register('address.postal_code')} placeholder="100001" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Bank details */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Bank details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Displayed on invoices for payment.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bank name</label>
            <input {...form.register('bank_details.bank_name')} placeholder="First Bank" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Account name</label>
            <input {...form.register('bank_details.account_name')} placeholder="Acme Ltd" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Account number</label>
            <input {...form.register('bank_details.account_number')} placeholder="0123456789" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SWIFT / BIC code</label>
            <input {...form.register('bank_details.swift_code')} placeholder="FBNINGLA" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>IBAN</label>
            <input {...form.register('bank_details.iban')} placeholder="Optional" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isUploadingLogo ? 'Uploading logo…' : 'Save changes'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved ✓</span>
        )}
      </div>
    </form>
  )
}
