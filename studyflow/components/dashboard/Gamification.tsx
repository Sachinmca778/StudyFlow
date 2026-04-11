'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { StudySession } from '@/lib/types'
import { Trophy, Star, Flame, Award, Crown, Zap, Target, CheckCircle, Gift, Lock } from 'lucide-react'

interface Badge {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  required?: number
  color: string
}

interface LevelInfo {
  currentLevel: number
  currentXP: number
  nextLevelXP: number
  levelName: string
  progressPercentage: number
}

export default function Gamification() {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [levelInfo, setLevelInfo] = useState<LevelInfo>({
    currentLevel: 1,
    currentXP: 0,
    nextLevelXP: 100,
    levelName: 'Beginner',
    progressPercentage: 0,
  })
  const [badges, setBadges] = useState<Badge[]>([])
  const [activeTab, setActiveTab] = useState<'badges' | 'levels' | 'streaks'>('badges')

  useEffect(() => {
    fetchGamificationData()
  }, [profile?.id])

  const fetchGamificationData = async () => {
    if (!profile?.id) return

    setLoading(true)
    try {
      // Fetch all sessions
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_time', { ascending: true })

      if (!sessions || sessions.length === 0) {
        setBadges(getDefaultBadges(0, 0, 0))
        setStreak(0)
        setLongestStreak(0)
        setTotalHours(0)
        setLevelInfo(getLevelInfo(0))
        setLoading(false)
        return
      }

      // Calculate streak
      const streakData = calculateStreak(sessions)
      setStreak(streakData.current)
      setLongestStreakData(streakData.longest)

      // Calculate total hours
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
      const hours = Math.round(totalMinutes / 60 * 10) / 10
      setTotalHours(hours)

      // Calculate level
      const xp = calculateXP(sessions)
      setLevelInfo(getLevelInfo(xp))

      // Generate badges
      const earnedBadges = generateBadges(sessions, hours, streakData.current, streakData.longest)
      setBadges(earnedBadges)
    } catch (error) {
      console.error('Error fetching gamification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (sessions: StudySession[]) => {
    const uniqueDays = new Set(
      sessions.map(s => new Date(s.start_time).toDateString())
    )

    const sortedDays = Array.from(uniqueDays)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate current streak
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toDateString()

      if (sortedDays.some(d => d.toDateString() === dateStr)) {
        currentStreak++
      } else if (i > 0) {
        break
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prevDate = new Date(sortedDays[i - 1])
        const currDate = new Date(sortedDays[i])
        const diff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)

        if (Math.round(diff) === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { current: currentStreak, longest: longestStreak }
  }

  const calculateXP = (sessions: StudySession[]): number => {
    let xp = 0

    sessions.forEach(session => {
      const duration = session.duration || 0
      const rating = session.rating || 3

      // Base XP: 1 XP per minute
      xp += duration

      // Rating bonus
      xp += (rating - 1) * 10

      // Session completion bonus
      if (duration >= 60) xp += 50
      if (duration >= 120) xp += 100
    })

    return Math.round(xp)
  }

  const getLevelInfo = (xp: number): LevelInfo => {
    const levels = [
      { level: 1, name: 'Beginner', xp: 0 },
      { level: 2, name: 'Learner', xp: 100 },
      { level: 3, name: 'Student', xp: 300 },
      { level: 4, name: 'Scholar', xp: 600 },
      { level: 5, name: 'Topper', xp: 1000 },
      { level: 6, name: 'Genius', xp: 1500 },
      { level: 7, name: 'Master', xp: 2500 },
      { level: 8, name: 'Expert', xp: 4000 },
      { level: 9, name: 'Legend', xp: 6000 },
      { level: 10, name: 'Champion', xp: 10000 },
    ]

    let currentLevel = 1
    let currentLevelXP = 0
    let nextLevelXP = 100

    for (let i = levels.length - 1; i >= 0; i--) {
      if (xp >= levels[i].xp) {
        currentLevel = levels[i].level
        currentLevelXP = levels[i].xp
        nextLevelXP = i < levels.length - 1 ? levels[i + 1].xp : levels[i].xp * 1.5
        break
      }
    }

    const progressPercentage = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

    return {
      currentLevel,
      currentXP: xp,
      nextLevelXP: Math.round(nextLevelXP),
      levelName: levels[currentLevel - 1].name,
      progressPercentage: Math.min(Math.round(progressPercentage), 100),
    }
  }

  const generateBadges = (
    sessions: StudySession[],
    totalHours: number,
    currentStreak: number,
    longestStreak: number
  ): Badge[] => {
    const badges: Badge[] = []

    // Study hours badges
    badges.push({
      id: 'hours-1',
      title: 'First Hour',
      description: 'Complete your first hour of study',
      icon: <Star className="w-5 h-5" />,
      unlocked: totalHours >= 1,
      progress: Math.min(totalHours, 1),
      required: 1,
      color: 'from-blue-500 to-cyan-500',
    })

    badges.push({
      id: 'hours-10',
      title: 'Dedicated Student',
      description: 'Study for 10 hours total',
      icon: <BookOpen className="w-5 h-5" />,
      unlocked: totalHours >= 10,
      progress: Math.min(totalHours, 10),
      required: 10,
      color: 'from-green-500 to-emerald-500',
    })

    badges.push({
      id: 'hours-50',
      title: 'Study Master',
      description: 'Complete 50 hours of study',
      icon: <Trophy className="w-5 h-5" />,
      unlocked: totalHours >= 50,
      progress: Math.min(totalHours, 50),
      required: 50,
      color: 'from-purple-500 to-pink-500',
    })

    badges.push({
      id: 'hours-100',
      title: 'Century Club',
      description: 'Reach 100 hours milestone',
      icon: <Crown className="w-5 h-5" />,
      unlocked: totalHours >= 100,
      progress: Math.min(totalHours, 100),
      required: 100,
      color: 'from-amber-500 to-orange-500',
    })

    // Streak badges
    badges.push({
      id: 'streak-3',
      title: 'On Fire!',
      description: '3-day study streak',
      icon: <Flame className="w-5 h-5" />,
      unlocked: currentStreak >= 3,
      progress: Math.min(currentStreak, 3),
      required: 3,
      color: 'from-orange-500 to-red-500',
    })

    badges.push({
      id: 'streak-7',
      title: 'Week Warrior',
      description: '7-day consecutive streak',
      icon: <Flame className="w-5 h-5" />,
      unlocked: currentStreak >= 7,
      progress: Math.min(currentStreak, 7),
      required: 7,
      color: 'from-red-500 to-pink-500',
    })

    badges.push({
      id: 'streak-30',
      title: 'Monthly Champion',
      description: '30-day study streak',
      icon: <Award className="w-5 h-5" />,
      unlocked: currentStreak >= 30,
      progress: Math.min(currentStreak, 30),
      required: 30,
      color: 'from-yellow-500 to-amber-500',
    })

    // Session badges
    const totalSessions = sessions.length
    badges.push({
      id: 'sessions-10',
      title: 'Getting Started',
      description: 'Complete 10 study sessions',
      icon: <Zap className="w-5 h-5" />,
      unlocked: totalSessions >= 10,
      progress: Math.min(totalSessions, 10),
      required: 10,
      color: 'from-cyan-500 to-blue-500',
    })

    badges.push({
      id: 'sessions-100',
      title: 'Century Sessions',
      description: 'Complete 100 study sessions',
      icon: <Target className="w-5 h-5" />,
      unlocked: totalSessions >= 100,
      progress: Math.min(totalSessions, 100),
      required: 100,
      color: 'from-indigo-500 to-purple-500',
    })

    return badges
  }

  const getDefaultBadges = (hours: number, streak: number, sessions: number): Badge[] => {
    return generateBadges([], hours, streak, streak)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Level Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
        <div className="absolute -bottom-30 -left-30 w-80 h-80 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold">{levelInfo.currentLevel}</span>
            </div>
            <div>
              <p className="text-sm opacity-90">Current Level</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{levelInfo.levelName}</h2>
              <p className="text-sm opacity-90">{levelInfo.currentXP} XP</p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to Level {levelInfo.currentLevel + 1}</span>
              <span>{levelInfo.progressPercentage}%</span>
            </div>
            <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${levelInfo.progressPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-sm opacity-90">{levelInfo.nextLevelXP - levelInfo.currentXP} XP to next level</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
          <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{streak}</p>
          <p className="text-xs text-gray-600">Day Streak</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{longestStreak}</p>
          <p className="text-xs text-gray-600">Best Streak</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalHours}h</p>
          <p className="text-xs text-gray-600">Total Hours</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
            activeTab === 'badges' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          🏅 Badges
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
            activeTab === 'levels' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          📊 Levels
        </button>
        <button
          onClick={() => setActiveTab('streaks')}
          className={`px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
            activeTab === 'streaks' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          🔥 Streaks
        </button>
      </div>

      {/* Badges Grid */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`relative bg-white rounded-xl border-2 p-4 text-center transition-all ${
                badge.unlocked
                  ? 'border-transparent shadow-md hover:shadow-lg hover:-translate-y-1'
                  : 'border-gray-200 opacity-50'
              }`}
            >
              {!badge.unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className={`inline-flex p-3 rounded-full bg-gradient-to-br ${badge.color} text-white mb-3 ${
                badge.unlocked ? '' : 'grayscale'
              }`}>
                {badge.icon}
              </div>
              <h4 className="font-bold text-sm text-gray-900 mb-1">{badge.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
              {badge.progress !== undefined && badge.required && (
                <div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${badge.color}`}
                      style={{ width: `${Math.min((badge.progress / badge.required) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {badge.progress}/{badge.required}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Levels Table */}
      {activeTab === 'levels' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Level Progression</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { level: 1, name: 'Beginner', xp: 0 },
              { level: 2, name: 'Learner', xp: 100 },
              { level: 3, name: 'Student', xp: 300 },
              { level: 4, name: 'Scholar', xp: 600 },
              { level: 5, name: 'Topper', xp: 1000 },
              { level: 6, name: 'Genius', xp: 1500 },
              { level: 7, name: 'Master', xp: 2500 },
              { level: 8, name: 'Expert', xp: 4000 },
              { level: 9, name: 'Legend', xp: 6000 },
              { level: 10, name: 'Champion', xp: 10000 },
            ].map((lvl) => (
              <div
                key={lvl.level}
                className={`flex items-center gap-4 p-4 ${
                  lvl.level === levelInfo.currentLevel ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  lvl.level <= levelInfo.currentLevel
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {lvl.level <= levelInfo.currentLevel ? '✓' : lvl.level}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${
                    lvl.level === levelInfo.currentLevel ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {lvl.name}
                  </p>
                  <p className="text-xs text-gray-600">{lvl.xp} XP required</p>
                </div>
                {lvl.level === levelInfo.currentLevel && (
                  <span className="badge badge-info">Current</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaks */}
      {activeTab === 'streaks' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-10 h-10" />
              <div>
                <h3 className="text-2xl font-bold">Current Streak</h3>
                <p className="text-sm opacity-90">{streak} consecutive days</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm">
                🔥 Keep it going! Study today to maintain your streak.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2">Longest Streak</h4>
              <p className="text-3xl font-bold text-orange-600">{longestStreak}</p>
              <p className="text-sm text-gray-600">days</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2">Total Study Days</h4>
              <p className="text-3xl font-bold text-blue-600">
                {streak + Math.floor(streak * 0.5)}
              </p>
              <p className="text-sm text-gray-600">days studied</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Placeholder component
function BookOpen({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
