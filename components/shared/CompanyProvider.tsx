'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from './LoadingSpinner'
import type { Company, UserRole, Profile } from '@/types/company'

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { company, setCompany, setCurrentRole, currentRole } = useCompanyStore()
  const { setUser } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (company && currentRole) { setReady(true); return }

    async function bootstrap() {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/en/login'; return }

      const [profileRes, membershipRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('company_users').select('company_id, role').eq('user_id', session.user.id).eq('is_active', true).limit(1).single(),
      ])

      if (profileRes.data) setUser(profileRes.data as Profile)
      if (!membershipRes.data) { window.location.href = '/en/onboarding'; return }

      const role = membershipRes.data.role as UserRole
      setCurrentRole(role)

      const { data: co } = await supabase
        .from('companies').select('*')
        .eq('id', membershipRes.data.company_id).single()

      if (co) setCompany(co as Company)

      setReady(true)
    }

    bootstrap()
  }, [])

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  )

  return <>{children}</>
}