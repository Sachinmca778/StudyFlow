'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute } from '@/lib/institute-types'
import { 
  Users, GraduationCap, IndianRupee, TrendingUp, AlertCircle, 
  CheckCircle, FileText, Bell, Calendar, Award, Clock
} from 'lucide-react'

type AdminOverviewProps = {
  institute: Institute
}

export default function AdminOverview({ institute }: AdminOverviewProps) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalBatches: 0,
    monthlyRevenue: 0,
    pendingFees: 0,
    todayAttendance: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    totalAnnouncements: 0,
    upcomingExams: 0,
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentActivities()
  }, [institute.id])

  const fetchStats = async () => {
    try {
      // Total students
      const { count: totalStudents } = await supabase
        .from('institute_students')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)

      // Active students
      const { count: activeStudents } = await supabase
        .from('institute_students')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .eq('status', 'active')

      // Total batches
      const { count: totalBatches } = await supabase
        .from('batches')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .eq('is_active', true)

      // Monthly revenue (current month)
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      const { data: payments } = await supabase
        .from('fee_payments')
        .select('amount')
        .eq('institute_id', institute.id)
        .eq('status', 'paid')
        .eq('month_year', currentMonth)

      const monthlyRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      // Pending fees
      const { data: pendingPayments } = await supabase
        .from('fee_payments')
        .select('amount')
        .eq('institute_id', institute.id)
        .in('status', ['pending', 'overdue'])

      const pendingFees = pendingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      // Today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { count: todayAttendance } = await supabase
        .from('student_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .eq('attendance_date', today)
        .eq('status', 'present')

      // Total assignments
      const { count: totalAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .eq('is_active', true)

      // Pending assignments (due in next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const { count: pendingAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .gte('due_date', today)
        .lte('due_date', nextWeek.toISOString().split('T')[0])

      // Total announcements (active)
      const { count: totalAnnouncements } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .eq('is_active', true)

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalBatches: totalBatches || 0,
        monthlyRevenue,
        pendingFees,
        todayAttendance: todayAttendance || 0,
        totalAssignments: totalAssignments || 0,
        pendingAssignments: pendingAssignments || 0,
        totalAnnouncements: totalAnnouncements || 0,
        upcomingExams: 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      // Get recent students (last 5)
      const { data: recentStudents } = await supabase
        .from('institute_students')
        .select('student_name, created_at')
        .eq('institute_id', institute.id)
        .order('created_at', { ascending: false })
        .limit(3)

      // Get recent payments (last 5)
      const { data: recentPayments } = await supabase
        .from('fee_payments')
        .select('amount, created_at, student:institute_students(student_name)')
        .eq('institute_id', institute.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(3)

      // Get recent announcements (last 3)
      const { data: recentAnnouncements } = await supabase
        .from('announcements')
        .select('title, created_at')
        .eq('institute_id', institute.id)
        .order('created_at', { ascending: false })
        .limit(2)

      const activities = [
        ...(recentStudents?.map(s => ({
          type: 'student',
          message: `New student enrolled: ${s.student_name}`,
          time: s.created_at,
          color: 'green'
        })) || []),
        ...(recentPayments?.map((p: any) => ({
          type: 'payment',
          message: `Fee payment received: ₹${p.amount} from ${p.student?.student_name}`,
          time: p.created_at,
          color: 'blue'
        })) || []),
        ...(recentAnnouncements?.map(a => ({
          type: 'announcement',
          message: `New announcement: ${a.title}`,
          time: a.created_at,
          color: 'purple'
        })) || []),
      ]

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivities(activities.slice(0, 5))
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Batches',
      value: stats.totalBatches,
      subtitle: 'Running batches',
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      subtitle: 'This month',
      icon: IndianRupee,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString()}`,
      subtitle: 'To be collected',
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Assignments',
      value: stats.totalAssignments,
      subtitle: `${stats.pendingAssignments} due this week`,
      icon: FileText,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Announcements',
      value: stats.totalAnnouncements,
      subtitle: 'Active notices',
      icon: Bell,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with {institute.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Today's Attendance</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900">{stats.todayAttendance}</p>
              <p className="text-sm text-gray-600">Students present</p>
            </div>
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
              style={{ width: `${stats.activeStudents > 0 ? (stats.todayAttendance / stats.activeStudents) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {stats.activeStudents > 0 ? ((stats.todayAttendance / stats.activeStudents) * 100).toFixed(1) : 0}% attendance rate
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span>Pending Assignments</span>
              </div>
              <span className="text-2xl font-bold">{stats.pendingAssignments}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span>Active Announcements</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalAnnouncements}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5" />
                <span>Total Batches</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalBatches}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{getTimeAgo(activity.time)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
