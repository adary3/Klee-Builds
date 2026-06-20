'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload, User, Save, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/company'
import { cn } from '@/lib/utils/cn'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type ProfileInput   = z.infer<typeof profileSchema>
type PasswordInput  = z.infer<typeof passwordSchema>

export function AccountSettingsForm() {
  const supabase = createClient()
  const { user, setUser } = useAuthStore()

  const [avatarFile, setAvatarFile]         = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(user?.avatar_url ?? null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved]     = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved]   = useState(false)
  const [passwordError, setPasswordError]   = useState<string | null>(null)
  const [showPw, setShowPw]                 = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      phone:     user?.phone     ?? '',
    },
  })

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Avatar must be under 2MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function onSaveProfile(values: ProfileInput) {
    if (!user) return
    setIsSavingProfile(true)

    let avatar_url = user.avatar_url

    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error } = await supabase.storage
        .from('logos')
        .upload(path, avatarFile, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('logos').getPublicUrl(path)
        avatar_url = data.publicUrl
      }
    }

    const { data: updated } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, phone: values.phone ?? null, avatar_url })
      .eq('id', user.id)
      .select()
      .single()

    if (updated) {
      setUser(updated as Profile)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    }
    setIsSavingProfile(false)
  }

  async function onSavePassword(values: PasswordInput) {
    setIsSavingPassword(true)
    setPasswordError(null)

    const { error } = await supabase.auth.updateUser({
      password: values.new_password,
    })

    if (error) {
      setPasswordError(error.message)
      setIsSavingPassword(false)
      return
    }

    setPasswordSaved(true)
    passwordForm.reset()
    setTimeout(() => setPasswordSaved(false), 3000)
    setIsSavingPassword(false)
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile */}
      <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="rounded-xl border bg-card p-5 space-y-5">
        <h3 className="text-sm font-semibold">Profile</h3>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              : <User className="h-7 w-7 text-muted-foreground" />
            }
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {avatarPreview ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              {...profileForm.register('full_name')}
              className={cn(inputClass, profileForm.formState.errors.full_name && 'border-destructive')}
            />
            {profileForm.formState.errors.full_name && (
              <p className="text-xs text-destructive mt-0.5">{profileForm.formState.errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input
              {...profileForm.register('phone')}
              type="tel"
              placeholder="+234 800 000 0000"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
          {profileSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
        </div>
      </form>

      {/* Password */}
      <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Change password</h3>

        {[
          { name: 'current_password' as const, label: 'Current password', autoComplete: 'current-password' },
          { name: 'new_password'     as const, label: 'New password',     autoComplete: 'new-password' },
          { name: 'confirm_password' as const, label: 'Confirm new password', autoComplete: 'new-password' },
        ].map((field) => (
          <div key={field.name}>
            <label className={labelClass}>{field.label}</label>
            <div className="relative">
              <input
                {...passwordForm.register(field.name)}
                type={showPw ? 'text' : 'password'}
                autoComplete={field.autoComplete}
                placeholder="••••••••"
                className={cn(
                  inputClass, 'pr-10',
                  passwordForm.formState.errors[field.name] && 'border-destructive'
                )}
              />
              {field.name === 'new_password' && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
            {passwordForm.formState.errors[field.name] && (
              <p className="text-xs text-destructive mt-0.5">
                {passwordForm.formState.errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}

        {passwordError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            {passwordError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSavingPassword}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSavingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
          {passwordSaved && <span className="text-sm text-green-600 font-medium">Password updated ✓</span>}
        </div>
      </form>
    </div>
  )
}
