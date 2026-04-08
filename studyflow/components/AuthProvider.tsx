'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Profile } from '@/lib/types'

interface AuthContextType {
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setProfile, setLoading } = useAuthStore()
  const [loading, setLoadingState] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoadingState(false)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoadingState(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data as Profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoadingState(false)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
