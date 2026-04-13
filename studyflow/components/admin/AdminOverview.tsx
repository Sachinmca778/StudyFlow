'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute } from '@/lib/institute-types'
import { Users, GraduationCap, IndianRupee, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

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
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
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

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalBatches: totalBatches || 0,
        monthlyRevenue,
        pendingFees,
        todayAttendance: todayAttendance || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Batches',
      value: stats.totalBatches,
      subtitle: 'Running batches',
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      subtitle: 'This month',
      icon: IndianRupee,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pendingFees.toLocaleString()}`,
      subtitle: 'To be collected',
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              + Add New Student
            </button>
            <button className="w-full btn-secondary text-left">
              + Create New Batch
            </button>
            <button className="w-full btn-secondary text-left">
              📝 Mark Today's Attendance
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Attendance</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.todayAttendance}</p>
              <p className="text-sm text-gray-600">Students present</p>
            </div>
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${(stats.todayAttendance / stats.activeStudents) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {((stats.todayAttendance / stats.activeStudents) * 100).toFixed(1)}% attendance rate
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New student enrolled</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Fee payment received</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New batch created</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
