'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { StudySession, Subject, StudyPlan } from '@/lib/types'
import { Lightbulb, TrendingUp, Clock, AlertTriangle, CheckCircle, Brain, Target, Zap, Calendar, BookOpen } from 'lucide-react'
import { format, subDays, eachDayOfInterval, startOfWeek, isSameDay } from 'date-fns'

interface Insight {
  id: string
  type: 'positive' | 'warning' | 'info' | 'success'
  icon: React.ReactNode
  title: string
  description: string
  action?: string
  color: string
}

export default function AIInsights() {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [studyPattern, setStudyPattern] = useState<any>(null)
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([])

  useEffect(() => {
    analyzeStudyPatterns()
  }, [profile?.id])

  const analyzeStudyPatterns = async () => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const daysAgo = 30
      const startDate = subDays(new Date(), daysAgo)

      // Fetch sessions
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: true })

      // Fetch plans
      const { data: plans } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', profile.id)
        .gte('planned_date', startDate.toISOString().split('T')[0])
        .order('planned_date', { ascending: true })

      // Fetch subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', profile.id)

      if (!sessions || sessions.length === 0) {
        setInsights([getNoDataInsight()])
        setLoading(false)
        return
      }

      // Analyze patterns
      const generatedInsights = generateInsights(sessions, plans, subjects, profile)
      setInsights(generatedInsights)

      // Calculate study pattern (time of day preferences)
      const timeOfDayAnalysis = analyzeTimeOfDay(sessions)
      setStudyPattern(timeOfDayAnalysis)

      // Calculate weekly trend
      const trend = calculateWeeklyTrend(sessions)
      setWeeklyTrend(trend)
    } catch (error) {
      console.error('Error analyzing patterns:', error)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = (
    sessions: StudySession[],
    plans: StudyPlan[] | null,
    subjects: Subject[] | null,
    profile: any
  ): Insight[] => {
    const insights: Insight[] = []

    // 1. Time of day analysis
    const timeAnalysis = analyzeTimeOfDay(sessions)
    if (timeAnalysis.morningMinutes > timeAnalysis.eveningMinutes * 1.5) {
      insights.push({
        id: 'time-morning',
        type: 'info',
        icon: <Clock className="w-5 h-5" />,
        title: '🌅 You\'re a Morning Person!',
        description: `You study ${Math.round((timeAnalysis.morningMinutes / (timeAnalysis.morningMinutes + timeAnalysis.eveningMinutes)) * 100)}% more in mornings (6-12 PM). Schedule hard topics during this time.`,
        action: 'Schedule difficult subjects in the morning',
        color: 'from-amber-500 to-orange-500',
      })
    } else if (timeAnalysis.eveningMinutes > timeAnalysis.morningMinutes * 1.5) {
      insights.push({
        id: 'time-evening',
        type: 'info',
        icon: <Clock className="w-5 h-5" />,
        title: '🌙 Night Owl Detected!',
        description: `You study ${Math.round((timeAnalysis.eveningMinutes / (timeAnalysis.morningMinutes + timeAnalysis.eveningMinutes)) * 100)}% more in evenings (6-11 PM). Use mornings for revision.`,
        action: 'Reserve evenings for new topics',
        color: 'from-indigo-500 to-purple-500',
      })
    }

    // 2. Consistency analysis
    const uniqueDays = new Set(sessions.map(s => new Date(s.start_time).toDateString())).size
    const daysStudied = sessions.length > 0 ? uniqueDays : 0
    const totalDays = 30
    const consistencyRate = (daysStudied / totalDays) * 100

    if (consistencyRate >= 80) {
      insights.push({
        id: 'consistency-high',
        type: 'success',
        icon: <CheckCircle className="w-5 h-5" />,
        title: '🔥 Excellent Consistency!',
        description: `You've studied ${daysStudied} out of ${totalDays} days (${Math.round(consistencyRate)}%). This consistency will guarantee exam success!`,
        action: 'Keep it up! You\'re on track',
        color: 'from-emerald-500 to-teal-500',
      })
    } else if (consistencyRate >= 50) {
      insights.push({
        id: 'consistency-medium',
        type: 'warning',
        icon: <TrendingUp className="w-5 h-5" />,
        title: '📈 Improve Consistency',
        description: `You studied ${daysStudied}/${totalDays} days (${Math.round(consistencyRate)}%). Aim for 25+ days for best results.`,
        action: 'Try to study every day, even 30 minutes',
        color: 'from-blue-500 to-indigo-500',
      })
    } else {
      insights.push({
        id: 'consistency-low',
        type: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: '⚠️ Irregular Study Pattern',
        description: `Only ${daysStudied}/${totalDays} days studied. Inconsistent studying is the #1 reason for poor exam performance.`,
        action: 'Set a daily goal of just 30 minutes to start',
        color: 'from-red-500 to-pink-500',
      })
    }

    // 3. Session length analysis
    const avgSessionLength = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
    if (avgSessionLength > 90) {
      insights.push({
        id: 'long-sessions',
        type: 'warning',
        icon: <Brain className="w-5 h-5" />,
        title: '⏰ Long Study Sessions',
        description: `Average session is ${Math.round(avgSessionLength)} minutes. Research shows focus drops after 90 minutes. Take breaks!`,
        action: 'Use 25-minute Pomodoro sessions with 5-min breaks',
        color: 'from-orange-500 to-red-500',
      })
    } else if (avgSessionLength >= 45 && avgSessionLength <= 90) {
      insights.push({
        id: 'good-session-length',
        type: 'success',
        icon: <CheckCircle className="w-5 h-5" />,
        title: '✅ Perfect Session Length',
        description: `Average ${Math.round(avgSessionLength)} min sessions is ideal. This matches the optimal learning window.`,
        action: 'Keep sessions at 45-90 minutes',
        color: 'from-emerald-500 to-green-500',
      })
    } else {
      insights.push({
        id: 'short-sessions',
        type: 'info',
        icon: <Zap className="w-5 h-5" />,
        title: '⚡ Quick Study Bursts',
        description: `Average ${Math.round(avgSessionLength)} min sessions. Try to extend to 45+ minutes for deeper learning.`,
        action: 'Gradually increase session length by 10 min each week',
        color: 'from-cyan-500 to-blue-500',
      })
    }

    // 4. Subject-wise analysis
    if (subjects && sessions.length > 0) {
      const subjectTime: Record<string, number> = {}
      sessions.forEach(session => {
        if (session.subject_id) {
          subjectTime[session.subject_id] = (subjectTime[session.subject_id] || 0) + (session.duration || 0)
        }
      })

      const totalTime = Object.values(subjectTime).reduce((a, b) => a + b, 0)
      const imbalancedSubjects = subjects.filter(subject => {
        const subjectMinutes = subjectTime[subject.id] || 0
        const percentage = (subjectMinutes / totalTime) * 100
        const expectedPercentage = 100 / subjects.length
        return Math.abs(percentage - expectedPercentage) > 15
      })

      if (imbalancedSubjects.length > 0) {
        const mostNeglected = imbalancedSubjects.sort((a, b) => {
          const aPct = ((subjectTime[a.id] || 0) / totalTime) * 100
          const bPct = ((subjectTime[b.id] || 0) / totalTime) * 100
          return aPct - bPct
        })[0]

        const neglectedMinutes = subjectTime[mostNeglected.id] || 0
        insights.push({
          id: 'neglected-subject',
          type: 'warning',
          icon: <BookOpen className="w-5 h-5" />,
          title: `📚 ${mostNeglected.name} Needs Attention!`,
          description: `You've spent only ${Math.round((neglectedMinutes / totalTime) * 100)}% of time on ${mostNeglected.name}. Aim for ${Math.round(100 / subjects.length)}% per subject.`,
          action: `Add ${mostNeglected.name} to tomorrow's study plan`,
          color: 'from-purple-500 to-pink-500',
        })
      }
    }

    // 5. Plan completion rate
    if (plans && plans.length > 0) {
      const completedPlans = plans.filter(p => p.status === 'completed').length
      const completionRate = (completedPlans / plans.length) * 100

      if (completionRate >= 80) {
        insights.push({
          id: 'plan-completion-high',
          type: 'success',
          icon: <Target className="w-5 h-5" />,
          title: '🎯 Excellent Plan Completion!',
          description: `${completedPlans}/${plans.length} (${Math.round(completionRate)}%) study plans completed. You're disciplined and on track!`,
          action: 'Keep following your study plan',
          color: 'from-emerald-500 to-teal-500',
        })
      } else if (completionRate < 50) {
        insights.push({
          id: 'plan-completion-low',
          type: 'warning',
          icon: <Calendar className="w-5 h-5" />,
          title: '📋 Low Plan Completion',
          description: `Only ${completedPlans}/${plans.length} (${Math.round(completionRate)}%) plans completed. Your plans might be too ambitious.`,
          action: 'Reduce daily plan by 20% for better completion',
          color: 'from-amber-500 to-orange-500',
        })
      }
    }

    // 6. Weekend vs Weekday analysis
    const weekendSessions = sessions.filter(s => {
      const day = new Date(s.start_time).getDay()
      return day === 0 || day === 6
    })
    const weekdaySessions = sessions.filter(s => {
      const day = new Date(s.start_time).getDay()
      return day >= 1 && day <= 5
    })

    const weekendMinutes = weekendSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const weekdayMinutes = weekdaySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const weekendPerDay = weekendSessions.length > 0 ? weekendMinutes / weekendSessions.length : 0
    const weekdayPerDay = weekdaySessions.length > 0 ? weekdayMinutes / weekdaySessions.length : 0

    if (weekendPerDay > weekdayPerDay * 1.3) {
      insights.push({
        id: 'weekend-warrior',
        type: 'info',
        icon: <Calendar className="w-5 h-5" />,
        title: '🏖️ Weekend Warrior!',
        description: `You study ${Math.round((weekendPerDay / 60) * 10) / 10}h/day on weekends vs ${Math.round((weekdayPerDay / 60) * 10) / 10}h on weekdays. Spread studying across weekdays for better retention.`,
        action: 'Add 30 min weekday sessions',
        color: 'from-teal-500 to-cyan-500',
      })
    }

    return insights
  }

  const analyzeTimeOfDay = (sessions: StudySession[]) => {
    let morningMinutes = 0 // 6-12
    let afternoonMinutes = 0 // 12-17
    let eveningMinutes = 0 // 17-22
    let nightMinutes = 0 // 22-6

    sessions.forEach(session => {
      const hour = new Date(session.start_time).getHours()
      const duration = session.duration || 0

      if (hour >= 6 && hour < 12) morningMinutes += duration
      else if (hour >= 12 && hour < 17) afternoonMinutes += duration
      else if (hour >= 17 && hour < 22) eveningMinutes += duration
      else nightMinutes += duration
    })

    return { morningMinutes, afternoonMinutes, eveningMinutes, nightMinutes }
  }

  const calculateWeeklyTrend = (sessions: StudySession[]) => {
    const weeks = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i * 7)
      const weekEnd = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), (i - 1) * 7)

      const weekSessions = sessions.filter(s => {
        const date = new Date(s.start_time)
        return date >= weekStart && date < weekEnd
      })

      const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0)

      weeks.push({
        week: `Week ${4 - i}`,
        hours: Math.round(totalMinutes / 60 * 10) / 10,
        minutes: totalMinutes,
        sessions: weekSessions.length,
      })
    }
    return weeks
  }

  const getNoDataInsight = (): Insight => ({
    id: 'no-data',
    type: 'info',
    icon: <Lightbulb className="w-5 h-5" />,
    title: '📊 Start Studying to Get Insights',
    description: 'Complete at least 5 study sessions to receive personalized AI insights about your study patterns.',
    action: 'Go to Time Tracker and start a session',
    color: 'from-blue-500 to-indigo-500',
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
        <div className="absolute -bottom-30 -left-30 w-80 h-80 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-8 h-8 sm:w-10 sm:h-10" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">AI Study Insights</h2>
              <p className="text-sm opacity-90">Personalized analysis of your study patterns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
            <div className={`bg-gradient-to-r ${insight.color} p-4 text-white`}>
              <div className="flex items-center gap-3">
                {insight.icon}
                <h3 className="text-lg font-bold">{insight.title}</h3>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                {insight.description}
              </p>
              {insight.action && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 {insight.action}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Study Pattern Chart */}
      {studyPattern && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Study Time Distribution
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TimeBlock label="Morning (6-12)" minutes={studyPattern.morningMinutes} color="bg-amber-500" icon="🌅" />
            <TimeBlock label="Afternoon (12-17)" minutes={studyPattern.afternoonMinutes} color="bg-orange-500" icon="☀️" />
            <TimeBlock label="Evening (17-22)" minutes={studyPattern.eveningMinutes} color="bg-indigo-500" icon="🌆" />
            <TimeBlock label="Night (22-6)" minutes={studyPattern.nightMinutes} color="bg-purple-500" icon="🌙" />
          </div>
        </div>
      )}

      {/* Weekly Trend */}
      {weeklyTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            4-Week Study Trend
          </h3>
          <div className="flex items-end justify-between h-40 gap-3 sm:gap-4">
            {weeklyTrend.map((week, i) => {
              const maxMinutes = Math.max(...weeklyTrend.map(w => w.minutes), 1)
              const heightPercentage = (week.minutes / maxMinutes) * 100
              const isLast = i === weeklyTrend.length - 1

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full mb-2" style={{ height: '120px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                        isLast ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gray-200'
                      }`}
                      style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                    />
                  </div>
                  <p className={`text-xs ${isLast ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>{week.week}</p>
                  <p className="text-xs text-gray-600">{week.hours}h</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TimeBlock({ label, minutes, color, icon }: {
  label: string
  minutes: number
  color: string
  icon: string
}) {
  const percentage = minutes > 0 ? 100 : 0
  const hours = Math.round(minutes / 60 * 10) / 10

  return (
    <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
      <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-bold">{hours}h</p>
      <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  )
}
