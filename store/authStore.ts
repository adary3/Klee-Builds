import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types/company'

interface AuthState {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () => set({ user: null, isLoading: false }),
    }),
    {
      name: 'kleenah-auth',
      // Only persist non-sensitive identity fields
      partialize: (state) => ({ user: state.user }),
    }
  )
)
