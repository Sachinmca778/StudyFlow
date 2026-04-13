'use client'

import { useState } from 'react'
import Login from './auth/Login'
import {
  BookOpen,
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle2,
  X,
  Menu,
  Sparkles,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Star,
  Target,
  Award,
  BarChart3,
  Play,
  Square,
  ChevronRight,
  ArrowUpRight,
  Building2,
  GraduationCap,
  IndianRupee,
  UserCheck
} from 'lucide-react'

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState<'student' | 'institute'>('student')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePreview, setActivePreview] = useState(0)

  const previewTabs = [
    { id: 0, label: 'Dashboard', icon: BarChart3 },
    { id: 1, label: 'Study Planner', icon: Calendar },
    { id: 2, label: 'Time Tracker', icon: Clock },
    { id: 3, label: 'Focus Timer', icon: Zap },
    { id: 4, label: 'Assignments', icon: BookOpen },
  ]

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
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#preview" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Preview</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
              <button
                onClick={() => setShowLogin(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                Get Started Free
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
          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 font-medium py-2">Features</a>
              <a href="#preview" className="block text-gray-700 font-medium py-2">Preview</a>
              <a href="#pricing" className="block text-gray-700 font-medium py-2">Pricing</a>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50/50 to-white py-24 px-4">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6 animate-bounce">
            <Sparkles className="w-4 h-4" />
            Built for Indian Students
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Study Smarter,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            The all-in-one AI study planner for JEE, NEET & Board exams. 
            Plan, track, and ace your exams - all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Start Free Trial
            </button>
            <a href="#preview" className="bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
              See Inside the App
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Only ₹100/month for Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">1000+</p>
              <p className="text-gray-600 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">50K+</p>
              <p className="text-gray-600 mt-1">Study Sessions</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">95%</p>
              <p className="text-gray-600 mt-1">Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">4.8★</p>
              <p className="text-gray-600 mt-1">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Ace Your Exams
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you study efficiently and stay organized
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-blue-600" />}
              bg="bg-blue-50"
              title="Smart Study Planner"
              description="AI generates your personalized weekly study plan based on your exams, subjects, and goals."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-purple-600" />}
              bg="bg-purple-50"
              title="Built-in Time Tracker"
              description="Track study sessions with one click. No switching between apps."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
              bg="bg-emerald-50"
              title="Performance Dashboard"
              description="See your progress, consistency score, and subject-wise breakdown."
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6 text-amber-600" />}
              bg="bg-amber-50"
              title="Assignment Manager"
              description="Never miss a deadline. Track assignments, exams, and grades in one place."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-rose-600" />}
              bg="bg-rose-50"
              title="Focus Timer"
              description="Pomodoro technique built-in. Stay focused and avoid distractions."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-cyan-600" />}
              bg="bg-cyan-50"
              title="Exam Templates"
              description="Pre-built templates for JEE, NEET, CBSE Boards, and college semesters."
            />
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section id="preview" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Live Preview
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Take a Look{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Inside the App
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Beautiful, intuitive interface designed for maximum productivity
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 hide-scrollbar justify-start md:justify-center">
            {previewTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePreview(tab.id)}
                  className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
                    activePreview === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Preview Content */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 animate-scale-in">
            {/* Browser Chrome */}
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 bg-white rounded-lg px-4 py-1.5 text-sm text-gray-500 flex items-center justify-between">
                <span>https://studyflow.app/dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* App Content */}
            <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-[400px] sm:min-h-[500px]">
              {/* Sidebar + Main Layout */}
              <div className="flex flex-col sm:flex-row">
                {/* Sidebar */}
                <div className="w-full sm:w-56 bg-white border-b sm:border-r sm:border-b-0 border-gray-100">
                  <div className="hidden sm:block p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">StudyFlow</span>
                    </div>
                  </div>
                  <div className="hidden sm:block p-3 space-y-1">
                    <SidebarItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" active={activePreview === 0} />
                    <SidebarItem icon={<Calendar className="w-4 h-4" />} label="Study Planner" active={activePreview === 1} />
                    <SidebarItem icon={<Clock className="w-4 h-4" />} label="Time Tracker" active={activePreview === 2} />
                    <SidebarItem icon={<Zap className="w-4 h-4" />} label="Focus Timer" active={activePreview === 3} />
                    <SidebarItem icon={<BookOpen className="w-4 h-4" />} label="Assignments" active={activePreview === 4} />
                  </div>
                  {/* Mobile tabs */}
                  <div className="sm:hidden flex overflow-x-auto gap-1 p-2">
                    <MobileTab icon={<BarChart3 className="w-3 h-3" />} label="Dashboard" active={activePreview === 0} onClick={() => setActivePreview(0)} />
                    <MobileTab icon={<Calendar className="w-3 h-3" />} label="Planner" active={activePreview === 1} onClick={() => setActivePreview(1)} />
                    <MobileTab icon={<Clock className="w-3 h-3" />} label="Tracker" active={activePreview === 2} onClick={() => setActivePreview(2)} />
                    <MobileTab icon={<Zap className="w-3 h-3" />} label="Timer" active={activePreview === 3} onClick={() => setActivePreview(3)} />
                    <MobileTab icon={<BookOpen className="w-3 h-3" />} label="Tasks" active={activePreview === 4} onClick={() => setActivePreview(4)} />
                  </div>
                  <div className="hidden sm:block p-3 mx-2 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        S
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Student</p>
                        <p className="text-xs text-gray-500">JEE 2026</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6">
                  {/* Dashboard Preview */}
                  {activePreview === 0 && <DashboardPreview />}
                  {/* Study Planner Preview */}
                  {activePreview === 1 && <StudyPlannerPreview />}
                  {/* Time Tracker Preview */}
                  {activePreview === 2 && <TimeTrackerPreview />}
                  {/* Focus Timer Preview */}
                  {activePreview === 3 && <FocusTimerPreview />}
                  {/* Assignments Preview */}
                  {activePreview === 4 && <AssignmentsPreview />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why StudyFlow Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Why Students Love{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StudyFlow
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🇮🇳</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Built for India</h3>
              <p className="text-gray-600 leading-relaxed">
                Specifically designed for JEE, NEET, CBSE, and state board students. 
                Not another generic Western app.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Affordable Pricing</h3>
              <p className="text-gray-600 leading-relaxed">
                Just ₹100/month - that's less than ₹3/day. Cheaper than your morning chai!
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">All-in-One App</h3>
              <p className="text-gray-600 leading-relaxed">
                No need for 5 different apps. Planner + Tracker + Timer + Calendar - everything in one place.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Smart scheduling, spaced repetition, and personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Affordable Pricing
              </span>
            </h2>
            <p className="text-lg text-gray-600">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-gray-300 transition-colors">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-500 mb-6">Forever free</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">View study plans</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">5 timer sessions/week</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Basic calendar</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>No analytics</span>
                </li>
              </ul>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-500 p-8 shadow-lg">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">₹100</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited study planning</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited time tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">AI schedule generation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Detailed analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Focus timer + reminders</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Grade prediction</span>
                </li>
              </ul>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              What Students{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Are Saying
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Went from studying 2 hrs/day to 6 hrs with StudyFlow. My JEE rank improved from AIR 50K to 20K!"
              author="Rahul Sharma"
              role="JEE Aspirant, Delhi"
              rating={5}
            />
            <TestimonialCard
              quote="Finally an app that understands Indian exams. The NEET template saved me so much time."
              author="Priya Patel"
              role="NEET Student, Mumbai"
              rating={5}
            />
            <TestimonialCard
              quote="₹100/month is nothing compared to the value. Cheaper than my daily coffee!"
              author="Arjun Reddy"
              role="12th CBSE, Hyderabad"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Study Smarter?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join thousands of students who are acing their exams with StudyFlow
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-lg"
          >
            Start Your Free Trial Now
          </button>
          <p className="mt-4 text-sm opacity-80">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">StudyFlow</span>
              </div>
              <p className="text-gray-400 text-sm">
                The smart study planner for Indian students.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#preview" className="hover:text-white transition-colors">Preview</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 StudyFlow. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  )
}

// Preview Components
function DashboardPreview() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Dashboard</h3>
          <p className="text-sm text-gray-500">Track your progress and stay on track</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Target className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Daily Goal: 2 hrs</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="This Week" value="12.5h" sub="Goal: 14h" gradient="from-blue-500 to-blue-600" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="This Month" value="45h" sub="32 sessions" gradient="from-purple-500 to-purple-600" icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Consistency" value="6/7" sub="Days this week" gradient="from-emerald-500 to-emerald-600" icon={<Target className="w-5 h-5" />} />
        <StatCard label="Completed" value="18" sub="3 pending" gradient="from-amber-500 to-amber-600" icon={<Award className="w-5 h-5" />} />
      </div>

      {/* Chart + Subjects */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Weekly Trend</h4>
          </div>
          <div className="flex items-end justify-between h-32 gap-2">
            {[35, 55, 45, 70, 65, 85, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t-md transition-all ${i === 5 ? 'bg-blue-600' : 'bg-gray-200'}`}
                  style={{ height: `${h}%` }}
                />
                <span className={`text-xs mt-2 ${i === 5 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Subject Breakdown</h4>
          </div>
          <div className="space-y-3">
            <SubjectBar name="Physics" color="bg-blue-500" percentage="45%" hours="5.6h" />
            <SubjectBar name="Chemistry" color="bg-purple-500" percentage="30%" hours="3.8h" />
            <SubjectBar name="Maths" color="bg-pink-500" percentage="25%" hours="3.1h" />
          </div>
        </div>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-lg font-bold mb-1">💪 Great Progress!</p>
          <p className="text-sm opacity-90">You're halfway through your goal. Keep the momentum going!</p>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
      </div>
    </div>
  )
}

function StudyPlannerPreview() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Study Planner</h3>
          <p className="text-sm text-gray-500">AI-powered study scheduling</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900">Monday, April 6</h4>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">3/3 Done!</span>
        </div>
        <div className="space-y-3">
          <PlanItem subject="Physics" topic="Thermodynamics - Chapter 5" duration="90 min" color="bg-blue-500" status="completed" />
          <PlanItem subject="Chemistry" topic="Organic Revisions" duration="60 min" color="bg-purple-500" status="completed" />
          <PlanItem subject="Mathematics" topic="Integration Practice" duration="60 min" color="bg-pink-500" status="completed" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900">Tuesday, April 7</h4>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">1/3 In Progress</span>
        </div>
        <div className="space-y-3">
          <PlanItem subject="Mathematics" topic="Mock Test - Integration" duration="120 min" color="bg-pink-500" status="in-progress" />
          <PlanItem subject="Physics" topic="Problem Solving" duration="60 min" color="bg-blue-500" status="pending" />
          <PlanItem subject="Chemistry" topic="Inorganic Notes Review" duration="45 min" color="bg-purple-500" status="pending" />
        </div>
      </div>
    </div>
  )
}

function TimeTrackerPreview() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Time Tracker</h3>
        <p className="text-sm text-gray-500">Log and monitor your study sessions</p>
      </div>

      {/* Active Session Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <p className="text-sm opacity-90 mb-2">Currently Studying</p>
          <h4 className="text-2xl font-bold mb-2">Physics - Thermodynamics</h4>
          <p className="text-5xl font-mono font-bold mb-4">01:23:45</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Session in progress...</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-600 mb-1">This Week</p>
          <p className="text-2xl font-bold text-blue-600">12.5h</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-600 mb-1">Sessions</p>
          <p className="text-2xl font-bold text-purple-600">15</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-600 mb-1">Avg/Session</p>
          <p className="text-2xl font-bold text-emerald-600">50m</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3">Recent Sessions</h4>
        <div className="space-y-2">
          <SessionItem subject="Physics" topic="Thermodynamics" duration="90 min" rating={4} color="bg-blue-500" />
          <SessionItem subject="Chemistry" topic="Organic Chemistry" duration="60 min" rating={5} color="bg-purple-500" />
          <SessionItem subject="Mathematics" topic="Integration" duration="75 min" rating={3} color="bg-pink-500" />
        </div>
      </div>
    </div>
  )
}

function FocusTimerPreview() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Focus Timer</h3>
        <p className="text-sm text-gray-500">Stay focused with Pomodoro technique</p>
      </div>

      {/* Timer */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl p-12 text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
        <div className="absolute -bottom-30 -left-30 w-80 h-80 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm mb-6">🎯 Focus Time</span>
          <p className="text-7xl font-mono font-bold mb-6">18:32</p>
          <div className="w-full max-w-md mx-auto h-3 bg-white/20 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: '60%' }} />
          </div>
          <p className="text-sm opacity-80">60% complete</p>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-600 mb-1">Sessions</p>
          <p className="text-3xl font-bold text-blue-600">4</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-600 mb-1">Mode</p>
          <p className="text-3xl font-bold text-purple-600">Focus</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-600 mb-1">Focus Time</p>
          <p className="text-3xl font-bold text-emerald-600">3.2h</p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-5">
        <p className="font-bold mb-2">🎯 Stay Focused!</p>
        <ul className="text-sm opacity-95 space-y-1">
          <li>• Put your phone on silent mode</li>
          <li>• Close unnecessary browser tabs</li>
          <li>• Use breaks to stretch and relax</li>
        </ul>
      </div>
    </div>
  )
}

function AssignmentsPreview() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Assignments</h3>
        <p className="text-sm text-gray-500">Manage tasks and exams</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          <button className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg text-sm shadow-sm">Assignments</button>
          <button className="px-4 py-2 text-gray-600 font-semibold rounded-lg text-sm hover:bg-gray-50">Exams</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">Physics - Chapter 5 Homework</p>
                <p className="text-sm text-gray-600 mt-1">Due in 2 days</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">High</span>
            </div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">Chemistry Lab Report</p>
                <p className="text-sm text-gray-600 mt-1">Due in 5 days</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Medium</span>
            </div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">Mathematics Mock Test</p>
                <p className="text-sm text-gray-600 mt-1">Due in 7 days</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Medium</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3">📚 Upcoming Exams</h4>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Physics Mid-Term</p>
            <p className="text-sm text-gray-600">Chapters 4, 5, 6</p>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">3 days to go</span>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ label, value, sub, gradient, icon }: {
  label: string
  value: string
  sub: string
  gradient: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${gradient} text-white mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  )
}

function SubjectBar({ name, color, percentage, hours }: {
  name: string
  color: string
  percentage: string
  hours: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded ${color}`} />
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </div>
        <span className="text-xs text-gray-600">{hours} ({percentage})</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: percentage }} />
      </div>
    </div>
  )
}

function PlanItem({ subject, topic, duration, color, status }: {
  subject: string
  topic: string
  duration: string
  color: string
  status: string
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      status === 'completed' ? 'bg-emerald-50 border border-emerald-100' :
      status === 'in-progress' ? 'bg-blue-50 border border-blue-100' :
      'bg-gray-50 border border-gray-100'
    }`}>
      <div className={`w-2 h-10 rounded ${color}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {topic}
        </p>
        <p className="text-xs text-gray-600">{duration}</p>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
        status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {status.replace('-', ' ')}
      </span>
    </div>
  )
}

function SessionItem({ subject, topic, duration, rating, color }: {
  subject: string
  topic: string
  duration: string
  rating: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`w-2 h-8 rounded ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{subject} - {topic}</p>
        <p className="text-xs text-gray-600">{duration}</p>
      </div>
      <span className="text-xs">{'⭐'.repeat(rating)}</span>
    </div>
  )
}

function SidebarItem({ icon, label, active }: {
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  )
}

function MobileTab({ icon, label, active, onClick }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function FeatureCard({ icon, bg, title, description }: {
  icon: React.ReactNode
  bg: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={`inline-flex p-3 ${bg} rounded-xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({ quote, author, role, rating }: {
  quote: string
  author: string
  role: string
  rating: number
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex mb-3">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
        ))}
      </div>
      <p className="text-gray-700 mb-4 leading-relaxed">"{quote}"</p>
      <div>
        <p className="font-semibold text-gray-900">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  )
}
