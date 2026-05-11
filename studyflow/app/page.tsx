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
      <div className="min-h-screen bg-gray-50 flex relative overflow-hidden">

        {/* ── Fake Dashboard UI in background ── */}
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 h-screen flex-shrink-0">
          {/* Logo area */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl" />
              <div className="h-5 w-24 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Profile card */}
          <div className="p-4 mx-4 mt-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
          {/* Nav items */}
          <nav className="flex-1 p-4 space-y-2">
            {[100, 85, 70, 60, 50, 40, 35].map((opacity, i) => (
              <div
                key={i}
                className="h-11 bg-gray-100 rounded-xl animate-pulse"
                style={{ opacity: opacity / 100 }}
              />
            ))}
          </nav>
          {/* Sign out */}
          <div className="p-4 border-t border-gray-100">
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse opacity-40" />
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-36 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-3.5 w-52 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block h-10 w-28 bg-emerald-50 border border-emerald-100 rounded-xl animate-pulse" />
              <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full animate-pulse" />
            </div>
          </header>

          {/* Page content */}
          <main className="p-6 flex-1 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[100, 90, 80, 70].map((op, i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" style={{ opacity: op / 100 }} />
              ))}
            </div>
            {/* Chart area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-56 bg-white rounded-2xl border border-gray-100 animate-pulse opacity-90" />
              <div className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse opacity-80" />
            </div>
            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse opacity-70" />
              <div className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse opacity-60" />
            </div>
          </main>
        </div>

        {/* ── Frosted glass overlay + centered loader ── */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            {/* Animated logo */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Loader2 className="w-9 h-9 text-white animate-spin" />
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 opacity-20 blur-xl scale-150" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StudyFlow
              </h1>
              <p className="text-gray-500 text-sm mt-1">Loading your workspace...</p>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500"
                  style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
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
