'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Target } from 'lucide-react'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

export default function FocusTimer() {
  const { profile } = useAuthStore()
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<TimerMode>('work')
  const [sessions, setSessions] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [customDuration, setCustomDuration] = useState(25)
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)

  const workDuration = customDuration * 60
  const shortBreakDuration = 5 * 60
  const longBreakDuration = 15 * 60

  const totalDuration = mode === 'work' 
    ? workDuration 
    : mode === 'shortBreak' 
    ? shortBreakDuration 
    : longBreakDuration

  // Fixed interval bug - only recreate interval when isRunning changes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer will complete on next render
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleTimerComplete()
    }
  }, [timeLeft, isRunning])

  // Update document title
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    const modeLabel = mode === 'work' ? '🎯 Focus' : '☕ Break'
    document.title = isRunning ? `${timeStr} - ${modeLabel}` : 'StudyFlow - Focus Timer'
    
    return () => {
      document.title = 'StudyFlow - Smart Study Planner'
    }
  }, [timeLeft, mode, isRunning])

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false)
    
    if (soundEnabled) {
      playNotificationSound()
    }

    if (mode === 'work') {
      const newSessions = sessions + 1
      setSessions(newSessions)

      // Save to database
      if (profile?.id) {
        setSaving(true)
        try {
          const startTime = new Date(Date.now() - workDuration * 1000)
          await supabase
            .from('focus_sessions')
            .insert({
              user_id: profile.id,
              start_time: startTime.toISOString(),
              end_time: new Date().toISOString(),
              duration: customDuration,
              actual_duration: customDuration,
              session_type: 'pomodoro',
            })
        } catch (error) {
          console.error('Error saving focus session:', error)
        } finally {
          setSaving(false)
        }
      }

      // Switch to break
      if (newSessions % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(longBreakDuration)
      } else {
        setMode('shortBreak')
        setTimeLeft(shortBreakDuration)
      }
    } else {
      // Break completed, start work
      setMode('work')
      setTimeLeft(workDuration)
    }
  }, [mode, sessions, soundEnabled, customDuration, workDuration, shortBreakDuration, longBreakDuration, profile?.id])

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    if (mode === 'work') {
      setTimeLeft(workDuration)
    } else if (mode === 'shortBreak') {
      setTimeLeft(shortBreakDuration)
    } else {
      setTimeLeft(longBreakDuration)
    }
  }

  const skipToNext = () => {
    setIsRunning(false)
    if (mode === 'work') {
      if ((sessions + 1) % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(longBreakDuration)
      } else {
        setMode('shortBreak')
        setTimeLeft(shortBreakDuration)
      }
    } else {
      setMode('work')
      setTimeLeft(workDuration)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }

  const modeConfig = {
    work: {
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      label: '🎯 Focus Time',
      bgLight: 'from-blue-50 to-indigo-50',
    },
    shortBreak: {
      gradient: 'from-emerald-500 to-teal-500',
      label: '☕ Short Break',
      bgLight: 'from-emerald-50 to-teal-50',
    },
    longBreak: {
      gradient: 'from-purple-500 to-pink-500',
      label: '🌴 Long Break',
      bgLight: 'from-purple-50 to-pink-50',
    },
  }

  const config = modeConfig[mode]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Timer Display */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${config.gradient} text-white p-12 shadow-2xl animate-scale-in`}>
        {/* Decorative elements */}
        <div className="absolute -top-30 -right-30 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />
        
        <div className="relative z-10">
          {/* Mode Label */}
          <div className="text-center mb-6">
            <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
              {config.label}
            </span>
          </div>
          
          {/* Timer */}
          <div className="text-center mb-8">
            <div className="text-8xl sm:text-9xl font-bold mb-4 font-mono tracking-wider">
              {formatTime(timeLeft)}
            </div>
            
            {/* Progress Ring */}
            <div className="max-w-md mx-auto">
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <p className="text-sm mt-2 opacity-80">
                {Math.round(getProgress())}% complete
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={resetTimer}
              className="p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all hover:scale-110"
              title="Reset"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            
            <button
              onClick={toggleTimer}
              disabled={saving}
              className="p-8 bg-white rounded-2xl hover:bg-opacity-90 transition-all shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50"
            >
              {isRunning ? (
                <Pause className="w-14 h-14 text-blue-600" />
              ) : (
                <Play className="w-14 h-14 text-blue-600 ml-1" />
              )}
            </button>
            
            <button
              onClick={skipToNext}
              className="p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all hover:scale-110"
              title="Skip to Next"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all hover:scale-110"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Session Counter */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-sm text-gray-600 mb-1">Sessions</p>
          <p className="text-3xl font-bold text-blue-600">{sessions}</p>
          <p className="text-xs text-gray-500 mt-1">Completed today</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-gray-600 mb-1">Mode</p>
          <p className="text-3xl font-bold text-purple-600 capitalize">
            {mode === 'work' ? 'Focus' : 'Break'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {sessions % 4 === 3 ? 'Long break next' : 'Short break next'}
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-gray-600 mb-1">Focus Time</p>
          <p className="text-3xl font-bold text-emerald-600">
            {Math.round((sessions * customDuration) / 60 * 10) / 10}h
          </p>
          <p className="text-xs text-gray-500 mt-1">Total today</p>
        </div>
      </div>

      {/* Settings */}
      <div className="card-glow">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-lg font-bold text-gray-900">⚙️ Timer Settings</span>
          <span className="text-gray-400">{showSettings ? '▲' : '▼'}</span>
        </button>
        
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Duration: <span className="font-bold text-blue-600">{customDuration} minutes</span>
              </label>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(parseInt(e.target.value))
                  if (mode === 'work' && !isRunning) {
                    setTimeLeft(parseInt(e.target.value) * 60)
                  }
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15 min</span>
                <span>60 min</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Pomodoro Technique:</strong> Study for {customDuration} minutes, then take a 5-minute break. 
                After 4 sessions, take a 15-minute long break. This helps maintain focus and avoid burnout!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-3">🎯 Stay Focused!</h3>
          <ul className="space-y-2 opacity-95">
            <li>• Put your phone on silent mode</li>
            <li>• Close unnecessary browser tabs</li>
            <li>• Keep water bottle nearby</li>
            <li>• Use breaks to stretch and relax</li>
            <li>• Track your progress in the Time Tracker</li>
          </ul>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
      </div>
    </div>
  )
}
