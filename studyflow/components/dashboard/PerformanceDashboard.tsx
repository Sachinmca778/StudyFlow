'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Clock, TrendingUp, Target, Award, Calendar, Zap, BarChart3, Trophy } from 'lucide-react'
import { format, startOfWeek, startOfMonth } from 'date-fns'

export default function PerformanceDashboard() {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalHoursThisWeek: 0,
    totalHoursThisMonth: 0,
    consistencyDays: 0,
    completedPlans: 0,
    pendingAssignments: 0,
    totalSessions: 0,
    subjectBreakdown: [] as any[],
    weeklyData: [] as any[],
  })

  useEffect(() => {
    fetchStats()
  }, [profile?.id])

  const fetchStats = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const monthStart = startOfMonth(new Date())

      // Fetch this week's sessions
      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('start_time', weekStart.toISOString())

      // Fetch this month's sessions
      const { data: monthSessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('start_time', monthStart.toISOString())

      // Fetch completed plans this week
      const { data: completedPlans } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .gte('updated_at', weekStart.toISOString())

      // Fetch pending assignments
      const { data: pendingAssignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', profile.id)
        .in('status', ['pending', 'in_progress'])

      // Fetch subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', profile.id)

      // Calculate stats
      const weekMinutes = weekSessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0
      const monthMinutes = monthSessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0
      
      const totalHoursThisWeek = Math.round(weekMinutes / 60 * 10) / 10
      const totalHoursThisMonth = Math.round(monthMinutes / 60 * 10) / 10

      // Calculate consistency (unique days studied this week)
      const uniqueDays = new Set(weekSessions?.map(s => 
        new Date(s.start_time).toDateString()
      )).size

      // Subject-wise breakdown
      const subjectMap = new Map<string, number>()
      weekSessions?.forEach(session => {
        if (session.subject_id) {
          const current = subjectMap.get(session.subject_id) || 0
          subjectMap.set(session.subject_id, current + (session.duration || 0))
        }
      })

      const subjectBreakdown = (subjects || []).map(subject => ({
        name: subject.name,
        color: subject.color,
        minutes: subjectMap.get(subject.id) || 0,
        hours: Math.round((subjectMap.get(subject.id) || 0) / 60 * 10) / 10,
      })).sort((a, b) => b.minutes - a.minutes)

      // Weekly data for chart (last 7 days)
      const weeklyData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

        const daySessions = weekSessions?.filter(s => {
          const sessionDate = new Date(s.start_time)
          return sessionDate >= dayStart && sessionDate < dayEnd
        })

        const dayMinutes = daySessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0
        
        weeklyData.push({
          day: format(date, 'EEE'),
          date: format(date, 'MMM d'),
          hours: Math.round(dayMinutes / 60 * 10) / 10,
          minutes: dayMinutes,
        })
      }

      setStats({
        totalHoursThisWeek,
        totalHoursThisMonth,
        consistencyDays: uniqueDays,
        completedPlans: completedPlans?.length || 0,
        pendingAssignments: pendingAssignments?.length || 0,
        totalSessions: weekSessions?.length || 0,
        subjectBreakdown,
        weeklyData,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const dailyGoal = (profile?.daily_study_goal || 120) / 60
  const weeklyGoal = dailyGoal * 7
  const progressPercentage = weeklyGoal > 0 ? Math.min((stats.totalHoursThisWeek / weeklyGoal) * 100, 100) : 0

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="This Week"
          value={`${stats.totalHoursThisWeek}h`}
          subtext={`Goal: ${weeklyGoal}h`}
          gradient="from-blue-500 to-blue-600"
          shadow="shadow-blue-500/20"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="This Month"
          value={`${stats.totalHoursThisMonth}h`}
          subtext={`${stats.totalSessions} sessions`}
          gradient="from-purple-500 to-purple-600"
          shadow="shadow-purple-500/20"
        />
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Consistency"
          value={`${stats.consistencyDays}/7`}
          subtext="Days this week"
          gradient="from-emerald-500 to-emerald-600"
          shadow="shadow-emerald-500/20"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Completed"
          value={stats.completedPlans}
          subtext={`${stats.pendingAssignments} pending`}
          gradient="from-amber-500 to-amber-600"
          shadow="shadow-amber-500/20"
        />
      </div>

      {/* Weekly Goal Progress */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Weekly Goal Progress</h3>
            <p className="text-sm text-gray-500">You're doing {progressPercentage >= 80 ? 'amazing' : progressPercentage >= 50 ? 'great' : 'good'}!</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gradient">{Math.round(progressPercentage)}%</p>
          </div>
        </div>
        
        <div className="progress-bar mb-3">
          <div 
            className={`progress-bar-fill bg-gradient-to-r ${progressPercentage >= 100 ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-indigo-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {stats.totalHoursThisWeek}h completed
          </span>
          <span className="text-gray-600">
            {progressPercentage >= 100 
              ? '🎉 Goal achieved!' 
              : `${Math.max(0, Math.round((weeklyGoal - stats.totalHoursThisWeek) * 10) / 10)}h remaining`}
          </span>
        </div>
      </div>

      {/* Weekly Chart + Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="card-glow">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">This Week's Trend</h3>
          </div>
          
          <div className="flex items-end justify-between h-48 gap-3">
            {stats.weeklyData.map((day, index) => {
              const maxMinutes = Math.max(...stats.weeklyData.map(d => d.minutes), 1)
              const heightPercentage = (day.minutes / maxMinutes) * 100
              const isToday = index === 6
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full mb-2" style={{ height: '140px' }}>
                    <div 
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${
                        isToday 
                          ? 'bg-gradient-to-t from-blue-600 to-blue-400' 
                          : 'bg-gradient-to-t from-gray-200 to-gray-100'
                      }`}
                      style={{ height: `${Math.max(heightPercentage, 4)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.hours}h
                    </div>
                  </div>
                  <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {day.day}
                  </p>
                  <p className="text-xs text-gray-600">{day.hours}h</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="card-glow">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Subject Breakdown</h3>
          </div>
          
          {stats.subjectBreakdown.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No study sessions yet</p>
              <p className="text-sm text-gray-400 mt-1">Start studying to see your breakdown</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.subjectBreakdown.map((subject, index) => {
                const percentage = stats.totalHoursThisWeek > 0 
                  ? Math.round((subject.minutes / (stats.totalHoursThisWeek * 60)) * 100)
                  : 0
                  
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-medium text-gray-900">{subject.name}</span>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{subject.hours}h ({percentage}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          backgroundColor: subject.color,
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Motivational Message */}
      <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r ${
        stats.totalHoursThisWeek >= weeklyGoal 
          ? 'from-emerald-500 to-teal-500' 
          : stats.totalHoursThisWeek >= weeklyGoal * 0.5 
          ? 'from-blue-500 to-indigo-500'
          : 'from-purple-500 to-pink-500'
      } text-white`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6" />
            <h3 className="text-xl font-bold">
              {stats.totalHoursThisWeek >= weeklyGoal 
                ? '🎉 Amazing Work!' 
                : stats.totalHoursThisWeek >= weeklyGoal * 0.5 
                ? '💪 Great Progress!'
                : '🚀 Keep Going!'}
            </h3>
          </div>
          <p className="opacity-95">
            {stats.totalHoursThisWeek >= weeklyGoal 
              ? 'You\'ve exceeded your weekly goal. You\'re on track to ace your exams!' 
              : stats.totalHoursThisWeek >= weeklyGoal * 0.5 
              ? 'You\'re halfway through your goal. Keep the momentum going!'
              : 'Start with small consistent sessions. Every minute counts!'}
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtext, gradient, shadow }: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext: string
  gradient: string
  shadow: string
}) {
  return (
    <div className={`stat-card relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`} />
      <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white mb-3 shadow-lg ${shadow}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  )
}
