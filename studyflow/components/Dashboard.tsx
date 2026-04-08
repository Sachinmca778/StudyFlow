'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  BookOpen, 
  FileText, 
  Timer, 
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Target
} from 'lucide-react'
import StudyPlanner from './dashboard/StudyPlanner'
import TimeTracker from './dashboard/TimeTracker'
import CalendarView from './dashboard/CalendarView'
import AssignmentManager from './dashboard/AssignmentManager'
import PerformanceDashboard from './dashboard/PerformanceDashboard'
import FocusTimer from './dashboard/FocusTimer'
import SettingsPage from './dashboard/Settings'

export default function Dashboard() {
  const { profile, signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'blue' },
    { id: 'planner', label: 'Study Planner', icon: BookOpen, color: 'indigo' },
    { id: 'tracker', label: 'Time Tracker', icon: Clock, color: 'purple' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'pink' },
    { id: 'assignments', label: 'Assignments', icon: FileText, color: 'amber' },
    { id: 'focus', label: 'Focus Timer', icon: Timer, color: 'emerald' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'slate' },
  ]

  const getGradient = (color: string) => {
    const gradients: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      indigo: 'from-indigo-500 to-indigo-600',
      purple: 'from-purple-500 to-purple-600',
      pink: 'from-pink-500 to-pink-600',
      amber: 'from-amber-500 to-amber-600',
      emerald: 'from-emerald-500 to-emerald-600',
      slate: 'from-slate-500 to-slate-600',
    }
    return gradients[color] || gradients.blue
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PerformanceDashboard />
      case 'planner':
        return <StudyPlanner />
      case 'tracker':
        return <TimeTracker />
      case 'calendar':
        return <CalendarView />
      case 'assignments':
        return <AssignmentManager />
      case 'focus':
        return <FocusTimer />
      case 'settings':
        return <SettingsPage />
      default:
        return <PerformanceDashboard />
    }
  }

  const activeItem = navItems.find(item => item.id === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 z-50 lg:translate-x-0 border-r border-gray-100 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    StudyFlow
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-4 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {(profile?.full_name || profile?.email || 'S')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {profile?.full_name || 'Student'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {profile?.class_level || 'Setup Profile'} • {profile?.target_exam || 'No Exam'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${getGradient(item.color)} text-white shadow-lg`
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeItem?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeTab === 'dashboard' && 'Track your progress and stay on track'}
                  {activeTab === 'planner' && 'AI-powered study scheduling'}
                  {activeTab === 'tracker' && 'Log and monitor your study sessions'}
                  {activeTab === 'calendar' && 'View your schedule at a glance'}
                  {activeTab === 'assignments' && 'Manage tasks and exams'}
                  {activeTab === 'focus' && 'Stay focused with Pomodoro technique'}
                  {activeTab === 'settings' && 'Customize your experience'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Daily Goal Badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                <Target className="w-4 h-4 text-emerald-600" />
                <div className="text-right">
                  <p className="text-xs text-emerald-700">Daily Goal</p>
                  <p className="font-bold text-emerald-900">
                    {Math.round((profile?.daily_study_goal || 120) / 60 * 10) / 10} hrs
                  </p>
                </div>
              </div>
              
              {/* User Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer">
                {(profile?.full_name || profile?.email || 'S')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 animate-fade-in">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
