import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface AuthStore {
  profile: Profile | null
  loading: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  loading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ profile: null })
  },
}))
