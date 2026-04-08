'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Subject, StudySession } from '@/lib/types'
import { Play, Square, Plus, Trash2, Clock, Loader2, CheckCircle2, Star, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

export default function TimeTracker() {
  const { profile } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<{
    subject_id: string
    topic: string
    startTime: Date
  } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSession, setNewSession] = useState({
    subject_id: '',
    topic: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: 60,
    session_type: 'self_study',
    rating: 3,
  })

  useEffect(() => {
    fetchData()
  }, [profile?.id])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeSession) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeSession])

  const fetchData = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', profile.id)
        .order('name')

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('start_time', weekAgo.toISOString())
        .order('start_time', { ascending: false })

      setSubjects(subjectsData || [])
      setSessions(sessionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startSession = (subjectId?: string) => {
    if (subjectId) {
      setActiveSession({
        subject_id: subjectId,
        topic: '',
        startTime: new Date(),
      })
    } else {
      setShowForm(true)
    }
  }

  const stopSession = async () => {
    if (!activeSession || !profile?.id) return
    
    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - activeSession.startTime.getTime()) / 60000)

    if (duration < 1) {
      alert('Session too short! Study for at least 1 minute.')
      return
    }

    setSaving(true)
    try {
      await supabase
        .from('study_sessions')
        .insert({
          user_id: profile.id,
          subject_id: activeSession.subject_id || null,
          topic: activeSession.topic || null,
          start_time: activeSession.startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration,
          session_type: 'self_study',
        })

      setActiveSession(null)
      setElapsed(0)
      fetchData()
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Failed to save session.')
    } finally {
      setSaving(false)
    }
  }

  const addManualSession = async () => {
    if (!profile?.id || !newSession.subject_id) {
      alert('Please select a subject')
      return
    }
    
    setSaving(true)
    try {
      // Fix timezone bug: create date in local timezone
      const [year, month, day] = newSession.date.split('-').map(Number)
      const startTime = new Date(year, month - 1, day, 9, 0, 0) // 9 AM local time
      const endTime = new Date(startTime.getTime() + newSession.duration * 60000)

      await supabase
        .from('study_sessions')
        .insert({
          user_id: profile.id,
          subject_id: newSession.subject_id,
          topic: newSession.topic || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: newSession.duration,
          session_type: newSession.session_type,
          rating: newSession.rating,
        })

      setShowForm(false)
      setNewSession({
        subject_id: '',
        topic: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        duration: 60,
        session_type: 'self_study',
        rating: 3,
      })
      fetchData()
    } catch (error) {
      console.error('Error adding session:', error)
      alert('Failed to add session.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return
    
    try {
      await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId)

      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session.')
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const totalHoursThisWeek = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
  const avgSession = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
    : 0

  // If no subjects, show prompt to add them
  if (subjects.length === 0 && !loading && !activeSession) {
    return (
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">0h</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg/Session</p>
                <p className="text-2xl font-bold text-gray-900">0m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-glow text-center py-16">
          <Clock className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Subjects Added Yet</h3>
          <p className="text-gray-500 mb-2">Add subjects to start tracking your study time.</p>
          <p className="text-sm text-gray-400 mb-8">You can't start a session without subjects.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a 
              href="/dashboard?tab=settings" 
              className="btn-primary inline-flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Go to Settings → Add Subjects
            </a>
            <button 
              onClick={async () => {
                if (!profile?.id) return
                const commonSubjects = [
                  { name: 'Physics', color: '#3b82f6', difficulty_level: 4, target_percentage: 85 },
                  { name: 'Chemistry', color: '#8b5cf6', difficulty_level: 3, target_percentage: 80 },
                  { name: 'Mathematics', color: '#ec4899', difficulty_level: 5, target_percentage: 90 },
                ]
                
                try {
                  const { data, error } = await supabase
                    .from('subjects')
                    .insert(commonSubjects.map(s => ({ user_id: profile.id, ...s })))
                    .select()
                  
                  if (error) throw error
                  if (data) {
                    setSubjects(data)
                    alert('✅ Physics, Chemistry, Mathematics added!')
                  }
                } catch (error) {
                  console.error('Error adding subjects:', error)
                  alert('Failed to add subjects. Please try again.')
                }
              }}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Quick Add: PCM
            </button>
          </div>
        </div>
      </div>
    )
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
      {/* Active Session */}
      {activeSession && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-2xl animate-scale-in">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
          <div className="absolute -bottom-30 -left-20 w-80 h-80 bg-white/5 rounded-full" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1 font-medium">Currently Studying</p>
              <h3 className="text-2xl font-bold mb-2">
                {subjects.find(s => s.id === activeSession.subject_id)?.name || 'Subject'}
              </h3>
              {activeSession.topic && (
                <p className="text-sm opacity-90">{activeSession.topic}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm">Session in progress...</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-mono font-bold mb-4 tracking-wider">
                {formatTime(elapsed)}
              </div>
              <button
                onClick={stopSession}
                disabled={saving}
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                {saving ? 'Saving...' : 'Stop & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalHoursThisWeek * 10) / 10}h</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg/Session</p>
              <p className="text-2xl font-bold text-gray-900">{avgSession}m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      {!activeSession && (
        <div className="card-glow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Start Session</h3>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">No subjects added yet</p>
              <p className="text-sm text-gray-400">Go to Settings → Subjects to add your subjects</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => startSession(subject.id)}
                  className="group p-4 rounded-xl border-2 hover:border-transparent transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ 
                    borderColor: `${subject.color}30`,
                    backgroundColor: `${subject.color}08`
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name[0]}
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{subject.name}</p>
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full mt-4 btn-secondary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Manual Entry
          </button>
        </div>
      )}

      {/* Manual Entry Form */}
      {showForm && (
        <div className="card-glow animate-scale-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add Study Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
              <select
                value={newSession.subject_id}
                onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic (optional)</label>
              <input
                type="text"
                value={newSession.topic}
                onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                className="input"
                placeholder="e.g., Chapter 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration: {newSession.duration} min
              </label>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={newSession.duration}
                onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={newSession.session_type}
                onChange={(e) => setNewSession({ ...newSession, session_type: e.target.value })}
                className="input"
              >
                <option value="self_study">Self Study</option>
                <option value="class">Class</option>
                <option value="revision">Revision</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rating: {'⭐'.repeat(newSession.rating)}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setNewSession({ ...newSession, rating: star })}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {star <= newSession.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={addManualSession} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Session
            </button>
            <button onClick={() => setShowForm(false)} disabled={saving} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="card-glow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No sessions yet</p>
            <p className="text-sm text-gray-400 mt-1">Start studying to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 10).map(session => {
              const subject = subjects.find(s => s.id === session.subject_id)
              return (
                <div key={session.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                  <div 
                    className="w-1 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject?.color || '#999' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {subject?.name || 'Unknown'} 
                      {session.topic && <span className="text-gray-500 font-normal ml-2">- {session.topic}</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(session.start_time), 'MMM d, h:mm a')} • {session.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {session.rating && (
                      <span className="text-sm">{'⭐'.repeat(session.rating)}</span>
                    )}
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
