'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Profile } from '@/lib/types'
import { Institute } from '@/lib/institute-types'
import LandingPage from '@/components/NewLandingPage'
import Dashboard from '@/components/Dashboard'
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
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
        setCurrentUserId(userId)
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
        setCurrentUserId(userId)
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StudyFlow
            </h1>
            <p className="text-gray-400 text-sm mt-1">Loading your workspace...</p>
          </div>
        </div>

        {/* Skeleton preview — gives a sense of the layout loading */}
        <div className="mt-12 w-full max-w-4xl px-6 animate-pulse">
          <div className="flex gap-4">
            {/* Sidebar skeleton */}
            <div className="hidden lg:flex flex-col gap-3 w-56 flex-shrink-0">
              <div className="h-10 bg-gray-200 rounded-xl" />
              <div className="h-10 bg-gray-200 rounded-xl opacity-80" />
              <div className="h-10 bg-gray-200 rounded-xl opacity-60" />
              <div className="h-10 bg-gray-200 rounded-xl opacity-40" />
              <div className="h-10 bg-gray-200 rounded-xl opacity-30" />
            </div>
            {/* Content skeleton */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-24 bg-gray-200 rounded-xl" />
                <div className="h-24 bg-gray-200 rounded-xl opacity-80" />
                <div className="h-24 bg-gray-200 rounded-xl opacity-60" />
              </div>
              <div className="h-40 bg-gray-200 rounded-xl opacity-70" />
              <div className="h-24 bg-gray-200 rounded-xl opacity-50" />
            </div>
          </div>
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
      return (
        <InstituteOnboarding
          userId={currentUserId || ''}
          onComplete={async () => {
            // Re-fetch institute data instead of reloading the page
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: instituteData } = await supabase
                .from('institutes')
                .select('*')
                .eq('admin_user_id', user.id)
                .maybeSingle()
              if (instituteData) {
                setInstitute(instituteData as Institute)
                setShowInstituteOnboarding(false)
              }
            }
          }}
        />
      )
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
