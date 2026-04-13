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
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50/50 to-white py-20 px-4">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              For Students & Institutes
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Complete Solution for{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Education Management
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Students: Plan, track & ace your exams | Institutes: Manage students, fees & attendance
            </p>
          </div>

          {/* Two Mode Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Student Card */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-8 hover:border-blue-400 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">For Students</h2>
              <p className="text-gray-600 mb-6">
                AI-powered study planner for JEE, NEET & Board exams
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Smart Study Planner</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Time Tracker & Focus Timer</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Performance Dashboard</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Assignment Manager</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => openLogin('student')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-sm text-gray-500">
                  Free forever • Only ₹100/month for Pro
                </p>
              </div>
            </div>

            {/* Institute Card */}
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-8 hover:border-purple-400 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">For Institutes</h2>
              <p className="text-gray-600 mb-6">
                Complete management system for coaching centers
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Student Management</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Fee Collection & Tracking</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Attendance & Performance</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Automated Reminders</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => openLogin('institute')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  Start Managing Now
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-sm text-gray-500">
                  Free trial • Affordable pricing
                </p>
              </div>
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
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Affordable Pricing
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Student Pricing */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">For Students</h3>
              <div className="grid gap-6">
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Free</h4>
                  <p className="text-gray-500 mb-4">Forever free</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Basic features
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      5 timer sessions/week
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-500 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-bold text-gray-900">Pro</h4>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">Popular</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-gray-900">₹100</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Unlimited everything
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      AI study plans
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Advanced analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Institute Pricing */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">For Institutes</h3>
              <div className="grid gap-6">
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Basic</h4>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-gray-900">₹999</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Up to 200 students
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      All features included
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-500 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-bold text-gray-900">Premium</h4>
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">Best Value</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-gray-900">₹2999</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Unlimited students
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      SMS/WhatsApp integration
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Multi-branch support
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Choose your path and start your journey today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openLogin('student')}
              className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl"
            >
              I'm a Student
            </button>
            <button
              onClick={() => openLogin('institute')}
              className="bg-white text-purple-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl"
            >
              I'm an Institute
            </button>
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
