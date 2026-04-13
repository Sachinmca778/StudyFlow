'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute } from '@/lib/institute-types'
import { 
  LayoutDashboard, Users, GraduationCap, IndianRupee, 
  Calendar, BarChart3, Settings, LogOut, Menu, X,
  UserCheck, Bell
} from 'lucide-react'

// Import admin components
import AdminOverview from './admin/AdminOverview'
import StudentManagement from './admin/StudentManagement'
import BatchManagement from './admin/BatchManagement'
import FeeManagement from './admin/FeeManagement'
import AttendanceTracker from './admin/AttendanceTracker'
import PerformanceReports from './admin/PerformanceReports'
import FeeReminders from './admin/FeeReminders'
import InstituteSettings from './admin/InstituteSettings'

type InstituteAdminDashboardProps = {
  userId: string
  institute: Institute
}

export default function InstituteAdminDashboard({ userId, institute }: InstituteAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'batches', label: 'Batches', icon: GraduationCap },
    { id: 'fees', label: 'Fee Management', icon: IndianRupee },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-gray-900 truncate">{institute.name}</h2>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'overview' && <AdminOverview institute={institute} />}
          {activeTab === 'students' && <StudentManagement institute={institute} />}
          {activeTab === 'batches' && <BatchManagement institute={institute} />}
          {activeTab === 'fees' && <FeeManagement institute={institute} />}
          {activeTab === 'attendance' && <AttendanceTracker institute={institute} />}
          {activeTab === 'performance' && <PerformanceReports institute={institute} />}
          {activeTab === 'reminders' && <FeeReminders institute={institute} />}
          {activeTab === 'settings' && <InstituteSettings institute={institute} />}
        </div>
      </main>
    </div>
  )
}
