import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/store/authStore'
import type { Company, UserRole } from '@/types/company'

export function useCompany() {
  const { company, currentRole, isLoading, setCompany, setCurrentRole, setLoading } = useCompanyStore()

  useEffect(() => {
    if (company) return

    async function load() {
      setLoading(true)
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data: membership } = await supabase
        .from('company_users')
        .select('company_id, role')
        .eq('user_id', session.user.id)
        .limit(1)
        .single()

      if (!membership) { setLoading(false); return }

      const { data: co } = await supabase
        .from('companies')
        .select('*')
        .eq('id', membership.company_id)
        .single()

      if (co) {
        setCompany(co as Company)
        setCurrentRole(membership.role as UserRole)
      }
      setLoading(false)
    }

    load()
  }, [company])

  return { company, currentRole, isLoading }
}