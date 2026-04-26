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
import SuperAdminDashboard from '@/components/SuperAdminDashboard'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { profile, setProfile, setLoading } = useAuthStore()
  const [loading, setLoadingState] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [institute, setInstitute] = useState<Institute | null>(null)
  const [showInstituteOnboarding, setShowInstituteOnboarding] = useState(false)
  const [userType, setUserType] = useState<'student' | 'institute' | 'super_admin' | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [superAdmin, setSuperAdmin] = useState<{ id: string; email: string; name: string } | null>(null)

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserType(session.user.id, session.user.email)
      } else {
        setLoadingState(false)
        setLoading(false)
        setAuthChecked(true)
      }
    })

    // Listen for auth state changes (login, logout, email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)

      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setInstitute(null)
        setUserType(null)
        setSuperAdmin(null)
        setShowOnboarding(false)
        setShowInstituteOnboarding(false)
        setLoadingState(false)
        setLoading(false)
        setAuthChecked(true)
        return
      }

      // Handle: SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, EMAIL_CONFIRMED
      if (session?.user) {
        checkUserType(session.user.id, session.user.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserType = async (userId: string, email?: string | null) => {
    try {
      setLoadingState(true)

      // Get fresh user data including metadata
      const { data: { user } } = await supabase.auth.getUser()
      const signupMode = user?.user_metadata?.signup_mode

      // ── Check super admin FIRST ──────────────────────────────────────────
      const { data: superAdminData } = await supabase
        .from('super_admins')
        .select('id, email, name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (superAdminData) {
        setSuperAdmin(superAdminData)
        setUserType('super_admin')
        setLoadingState(false)
        setLoading(false)
        setAuthChecked(true)
        return
      }

      // Check if user has an institute
      const { data: instituteData } = await supabase
        .from('institutes')
        .select('*')
        .eq('admin_user_id', userId)
        .maybeSingle()

      if (instituteData) {
        // Institute admin with existing institute → go to dashboard
        setInstitute(instituteData as Institute)
        setUserType('institute')
        setShowInstituteOnboarding(false)
        setLoadingState(false)
        setLoading(false)
        setAuthChecked(true)
        return
      }

      // No institute found — check signup mode
      if (signupMode === 'institute') {
        // Institute admin but no institute yet → show onboarding
        setUserType('institute')
        setShowInstituteOnboarding(true)
        setLoadingState(false)
        setLoading(false)
        setAuthChecked(true)
        return
      }

      // Default: student flow
      setUserType('student')
      await fetchProfile(userId, email ?? undefined)

    } catch (error) {
      console.error('Error in checkUserType:', error)
      setUserType('student')
      await fetchProfile(userId, email ?? undefined)
    } finally {
      setAuthChecked(true)
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
        // Profile doesn't exist yet — create it
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: userId, email: email || '' })
            .select()
            .single()

          if (createError) throw createError

          setProfile(newProfile as Profile)
          setShowOnboarding(true)
        } else {
          throw error
        }
      } else {
        setProfile(data as Profile)
        // Show onboarding only if class_level is missing
        setShowOnboarding(!data.class_level)
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error)
    } finally {
      setLoadingState(false)
      setLoading(false)
    }
  }

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // ─── Not Logged In ────────────────────────────────────────────────────────────
  if (!profile && !institute && !superAdmin && userType === null) {
    return <LandingPage />
  }

  // ─── Super Admin Flow ─────────────────────────────────────────────────────────
  if (userType === 'super_admin' && superAdmin) {
    return <SuperAdminDashboard superAdmin={superAdmin} />
  }

  // ─── Institute Admin Flow ─────────────────────────────────────────────────────
  if (userType === 'institute') {
    // No institute record yet → show onboarding
    if (!institute || showInstituteOnboarding) {
      return <InstituteOnboardingWrapper />
    }
    // Has institute → show dashboard
    return <InstituteAdminDashboard userId={institute.admin_user_id} institute={institute} />
  }

  // ─── Student Flow ─────────────────────────────────────────────────────────────
  if (userType === 'student') {
    if (showOnboarding) {
      return <Onboarding onComplete={() => setShowOnboarding(false)} />
    }
    return <Dashboard />
  }

  return null
}

// Separate component to avoid hook-in-render issues
function InstituteOnboardingWrapper() {
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <InstituteOnboarding
      userId={currentUserId}
      onComplete={() => window.location.reload()}
    />
  )
}
