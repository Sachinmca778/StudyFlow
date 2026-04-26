'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Loader2, Mail, Eye, EyeOff } from 'lucide-react'

interface LoginProps {
  onClose: () => void
  mode?: 'student' | 'institute'
}

export default function Login({ onClose, mode = 'student' }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { signup_mode: mode },
          },
        })
        if (error) throw error

        // Check if email confirmation is required
        if (data.user && !data.session) {
          // Email confirmation required
          setSuccessMessage(
            '✅ Account created! Please check your email and click the verification link, then come back and sign in.'
          )
          setLoading(false)
          return
        }

        // No email confirmation needed — auto logged in
        setSuccessMessage('✅ Account created! Redirecting...')
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 1000)

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Give a clearer message for unverified email
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setError('Please verify your email first. Check your inbox for the verification link.')
          } else if (error.message.toLowerCase().includes('invalid login credentials')) {
            setError('Wrong email or password. Please try again.')
          } else {
            throw error
          }
          return
        }

        // Login successful
        onClose()
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/`,
      })
      if (error) throw error
      setForgotSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      setSuccessMessage('✅ Verification email resent! Please check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Forgot Password View ─────────────────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-100 dark:border-slate-700">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
            <p className="text-gray-600 dark:text-slate-300 text-sm">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {forgotSuccess ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center">
              <p className="font-medium">✅ Reset email sent!</p>
              <p className="text-sm mt-1">Check your inbox and follow the link to reset your password.</p>
              <button
                onClick={() => { setShowForgotPassword(false); setForgotSuccess(false) }}
                className="mt-4 text-blue-600 text-sm font-medium hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input w-full"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ─── Main Login / Signup View ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-gray-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-3">
            {mode === 'institute' ? '🏫 Institute Admin' : '🎓 Student'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            {isSignUp ? 'Join StudyFlow today' : 'Sign in to continue'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            <p>{error}</p>
            {/* Show resend button if email not confirmed */}
            {error.toLowerCase().includes('verify your email') && (
              <button
                onClick={resendVerificationEmail}
                className="mt-2 text-blue-600 font-medium hover:underline text-sm"
              >
                Resend verification email →
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pr-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password link — only on sign in */}
          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError('') }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage('') }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500 dark:text-slate-400">
          <p>By continuing, you agree to StudyFlow's Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}
