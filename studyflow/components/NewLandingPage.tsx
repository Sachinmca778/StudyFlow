'use client'

import { useState } from 'react'
import Login from './auth/Login'
import {
  BookOpen, Users, Building2, GraduationCap, IndianRupee,
  CheckCircle2, ArrowRight, Sparkles, Menu, X, UserCheck,
  Calendar, Clock, TrendingUp, Award, BarChart3, Bell
} from 'lucide-react'

export default function NewLandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState<'student' | 'institute'>('student')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const openLogin = (mode: 'student' | 'institute') => {
    setLoginMode(mode)
    setShowLogin(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StudyFlow
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
              <button
                onClick={() => openLogin('student')}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Student Login
              </button>
              <button
                onClick={() => openLogin('institute')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25"
              >
                Institute Login
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 font-medium py-2">Features</a>
              <a href="#pricing" className="block text-gray-700 font-medium py-2">Pricing</a>
              <button
                onClick={() => openLogin('student')}
                className="w-full text-left text-gray-700 font-medium py-2"
              >
                Student Login
              </button>
              <button
                onClick={() => openLogin('institute')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl"
              >
                Institute Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50/50 to-white py-16 sm:py-20 md:py-24 px-4">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 animate-bounce shadow-lg">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              🎉 Limited Time: 100% FREE for Everyone!
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
              Complete Solution for{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Education Management
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-medium px-4">
              Students: Plan, track & ace your exams | Institutes: Manage students, fees & attendance
            </p>
          </div>

          {/* Two Mode Cards */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Student Card */}
            <div className="group bg-white rounded-2xl sm:rounded-3xl border-2 border-blue-200 p-6 sm:p-8 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">For Students</h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                AI-powered study planner for JEE, NEET & Board exams
              </p>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Smart Study Planner</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Time Tracker & Focus Timer</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Performance Dashboard</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Assignment Manager</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => openLogin('student')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2 text-base sm:text-lg group-hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500 line-through">₹100/month</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">FREE Forever! 🎉</p>
                </div>
              </div>
            </div>

            {/* Institute Card */}
            <div className="group bg-white rounded-2xl sm:rounded-3xl border-2 border-purple-200 p-6 sm:p-8 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">For Institutes</h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Complete management system for coaching centers
              </p>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Student Management</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Fee Collection & Tracking</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Attendance & Performance</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">Automated Reminders</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => openLogin('institute')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 flex items-center justify-center gap-2 text-base sm:text-lg group-hover:scale-105"
                >
                  Start Managing Now
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500 line-through">₹999/month</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">FREE Forever! 🎉</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-gray-600 px-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Setup in 2 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Student Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Student Features
              </span>
            </h2>
            <p className="text-lg text-gray-600">Everything you need to ace your exams</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-blue-600" />}
              bg="bg-blue-50"
              title="AI Study Planner"
              description="Auto-generate weekly study plans based on your exams and goals"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-purple-600" />}
              bg="bg-purple-50"
              title="Time Tracker"
              description="Track study sessions and see where your time goes"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
              bg="bg-emerald-50"
              title="Performance Analytics"
              description="Track progress, consistency score & subject breakdown"
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6 text-amber-600" />}
              bg="bg-amber-50"
              title="Assignment Manager"
              description="Never miss deadlines with smart reminders"
            />
            <FeatureCard
              icon={<Award className="w-6 h-6 text-rose-600" />}
              bg="bg-rose-50"
              title="Focus Timer"
              description="Pomodoro technique to stay focused"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-cyan-600" />}
              bg="bg-cyan-50"
              title="Exam Templates"
              description="Pre-built for JEE, NEET, CBSE & more"
            />
          </div>
        </div>
      </section>

      {/* Institute Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Institute Features
              </span>
            </h2>
            <p className="text-lg text-gray-600">Complete management solution for coaching centers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              bg="bg-blue-50"
              title="Student Management"
              description="Add, edit, search students with parent info & batch assignment"
            />
            <FeatureCard
              icon={<IndianRupee className="w-6 h-6 text-green-600" />}
              bg="bg-green-50"
              title="Fee Management"
              description="Track payments, pending fees & generate receipts"
            />
            <FeatureCard
              icon={<UserCheck className="w-6 h-6 text-purple-600" />}
              bg="bg-purple-50"
              title="Attendance Tracker"
              description="Mark daily attendance with present/absent/late status"
            />
            <FeatureCard
              icon={<GraduationCap className="w-6 h-6 text-indigo-600" />}
              bg="bg-indigo-50"
              title="Batch Management"
              description="Create batches with schedules, fees & teacher assignment"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-orange-600" />}
              bg="bg-orange-50"
              title="Performance Reports"
              description="Track exam results, marks, grades & rankings"
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6 text-red-600" />}
              bg="bg-red-50"
              title="Fee Reminders"
              description="Auto-generate & send reminders for pending fees"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              🎉 Special Launch Offer
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 px-4">
              Everything is{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                100% FREE!
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">Limited time offer - Get full access at zero cost</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 max-w-5xl mx-auto">
            {/* Student Pricing */}
            <div className="relative">
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg rotate-12 animate-bounce">
                100% FREE! 🎉
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-blue-200 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">For Students</h3>
                
                <div className="text-center mb-6 sm:mb-8">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl text-gray-400 line-through">₹100</span>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₹0</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">Forever Free</p>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Unlimited Study Plans</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">AI Schedule Generation</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Time Tracking & Analytics</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Focus Timer (Pomodoro)</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Assignment Manager</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Performance Dashboard</span>
                  </li>
                </ul>

                <button
                  onClick={() => openLogin('student')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Start Learning Free →
                </button>
              </div>
            </div>

            {/* Institute Pricing */}
            <div className="relative">
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg rotate-12 animate-bounce">
                100% FREE! 🎉
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-purple-200 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">For Institutes</h3>
                
                <div className="text-center mb-6 sm:mb-8">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl text-gray-400 line-through">₹999</span>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₹0</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">Forever Free</p>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Unlimited Students</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Fee Management System</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Attendance Tracking</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Batch Management</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Performance Reports</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-gray-700">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Bulk Import (Excel/CSV)</span>
                  </li>
                </ul>

                <button
                  onClick={() => openLogin('institute')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Start Managing Free →
                </button>
              </div>
            </div>
          </div>

          {/* Why Free Section */}
          <div className="mt-12 sm:mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-blue-100">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Why is it FREE? 🤔</h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                We're in <span className="font-bold text-blue-600">beta launch phase</span> and want to help as many students and institutes as possible. 
                Your feedback will help us build the best education management platform for India! 🇮🇳
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
                * This is a limited-time offer. Pricing may change in the future, but early users will always get special benefits!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            🎉 Limited Time: 100% FREE
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 px-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 opacity-90 font-medium px-4">
            Join thousands using StudyFlow - completely FREE!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 sm:mb-8 px-4">
            <button
              onClick={() => openLogin('student')}
              className="bg-white text-blue-600 font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1 text-base sm:text-lg group"
            >
              <span className="flex items-center justify-center gap-2">
                I'm a Student
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => openLogin('institute')}
              className="bg-white text-purple-600 font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1 text-base sm:text-lg group"
            >
              <span className="flex items-center justify-center gap-2">
                I'm an Institute
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm opacity-90 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Setup in 2 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">StudyFlow</span>
          </div>
          <p className="text-gray-400 text-sm mb-8">
            Complete solution for students and institutes
          </p>
          <div className="border-t border-gray-800 pt-8 text-gray-400 text-sm">
            <p>© 2026 StudyFlow. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <Login 
          onClose={() => setShowLogin(false)}
          mode={loginMode}
        />
      )}
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon, bg, title, description }: {
  icon: React.ReactNode
  bg: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
