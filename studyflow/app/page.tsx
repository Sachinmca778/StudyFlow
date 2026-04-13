'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Profile } from '@/lib/types'
import { Institute } from '@/lib/institute-types'
import LandingPage from '@/components/NewLandingPage'
import Dashboard from '@/components/Dashboard'
import Login from '@/components/auth/Login'
import Onboarding from '@/components/Onboarding'
import InstituteOnboarding from '@/components/InstituteOnboarding'
import InstituteAdminDashboard from '@/components/InstituteAdminDashboard'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { profile, setProfile, setLoading } = useAuthStore()
  const [loading, setLoadingState] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [institute, setInstitute] = useState<Institute | null>(null)
  const [showInstituteOnboarding, setShowInstituteOnboarding] = useState(false)
  const [userType, setUserType] = useState<'student' | 'institute' | null>(null)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserType(session.user.id, session.user.email)
      } else {
        setLoadingState(false)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserType(session.user.id, session.user.email)
      } else {
        setProfile(null)
        setInstitute(null)
        setUserType(null)
        setLoadingState(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserType = async (userId: string, email?: string) => {
    try {
      // Check if user is an institute admin
      const { data: instituteData } = await supabase
        .from('institutes')
        .select('*')
        .eq('admin_user_id', userId)
        .single()

      if (instituteData) {
        setInstitute(instituteData as Institute)
        setUserType('institute')
        setLoadingState(false)
        setLoading(false)
        return
      }

      // Otherwise, treat as student
      setUserType('student')
      fetchProfile(userId, email)
    } catch (error) {
      console.error('Error checking user type:', error)
      setUserType('student')
      fetchProfile(userId, email)
    }
  }

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile doesn't exist - create it automatically
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          console.log('Profile not found, creating...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email || '',
            })
            .select()
            .single()

          if (createError) throw createError
          
          setProfile(newProfile as Profile)
          setShowOnboarding(true) // Show onboarding for new users
        } else {
          throw error
        }
      } else {
        setProfile(data as Profile)
        setShowOnboarding(!data.class_level) // Show onboarding if profile incomplete
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoadingState(false)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Not logged in - show landing page with user type selection
  if (!profile && !institute) {
    return <LandingPage />
  }

  // Institute Admin Flow
  if (userType === 'institute') {
    if (!institute) {
      // Show institute onboarding
      return (
        <InstituteOnboarding
          userId={(profile?.id || '') as string}
          onComplete={() => {
            window.location.reload() // Reload to fetch institute data
          }}
        />
      )
    }
    // Show institute admin dashboard
    return <InstituteAdminDashboard userId={institute.admin_user_id} institute={institute} />
  }

  // Student Flow
  if (userType === 'student') {
    // Logged in but no profile - show onboarding
    if (showOnboarding) {
      return <Onboarding onComplete={() => setShowOnboarding(false)} />
    }

    // Logged in with profile - show dashboard
    return <Dashboard />
  }

  return null
}
