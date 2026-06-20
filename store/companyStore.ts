import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company, UserRole } from '@/types/company'

interface CompanyState {
  company: Company | null
  currentRole: UserRole | null
  isLoading: boolean
  setCompany: (company: Company | null) => void
  setCurrentRole: (role: UserRole | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useCompanyStore = create<CompanyState>()(
  persist({ getStorage: () => localStorage },
    (set) => ({
      company: null,
      currentRole: null,
      isLoading: false,
      setCompany: (company) => set({ company }),
      setCurrentRole: (currentRole) => set({ currentRole }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () => set({ company: null, currentRole: null, isLoading: false }),
    }),
    {
      name: 'kleenah-company',
      partialize: (state) => ({
        company: state.company,
        currentRole: state.currentRole,
      }),
    }
  )
)
