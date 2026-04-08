'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Subject } from '@/lib/types'
import { Plus, Trash2, Save, User, BookOpen, Bell, Check, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { profile, setProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'subjects' | 'notifications'>('profile')
  const [loading, setLoading] = useState(false)
  
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    daily_study_goal: profile?.daily_study_goal || 120,
  })

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [fetchingSubjects, setFetchingSubjects] = useState(false)
  const [newSubject, setNewSubject] = useState({
    name: '',
    color: '#3b82f6',
    difficulty_level: 3,
    target_percentage: 80,
  })

  const [notifications, setNotifications] = useState({
    study_reminders: true,
    assignment_alerts: true,
    exam_reminders: true,
    weekly_reports: true,
  })

  useEffect(() => {
    if (activeTab === 'subjects' && subjects.length === 0) {
      fetchSubjects()
    }
  }, [activeTab])

  const fetchSubjects = async () => {
    if (!profile?.id || fetchingSubjects) return
    
    setFetchingSubjects(true)
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (data) setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setFetchingSubjects(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile.id)

      if (error) throw error

      // Update store
      setProfile({ ...profile, ...profileData })
      alert('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const addSubject = async () => {
    if (!profile?.id || !newSubject.name) {
      alert('Please enter a subject name')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          user_id: profile.id,
          ...newSubject,
        })
        .select()
        .single()

      if (error) throw error

      setSubjects([...subjects, data])
      setNewSubject({
        name: '',
        color: '#3b82f6',
        difficulty_level: 3,
        target_percentage: 80,
      })
    } catch (error) {
      console.error('Error adding subject:', error)
      alert('Failed to add subject.')
    }
  }

  const deleteSubject = async (subjectId: string) => {
    if (!confirm('Delete this subject? This will also delete all associated study plans and sessions.')) return
    
    try {
      await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      setSubjects(subjects.filter(s => s.id !== subjectId))
    } catch (error) {
      console.error('Error deleting subject:', error)
      alert('Failed to delete subject.')
    }
  }

  const saveNotificationSettings = async () => {
    try {
      // For now, save to localStorage
      // In production, save to database
      localStorage.setItem('notifications', JSON.stringify(notifications))
      alert('✅ Notification settings saved!')
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }

  // Load notification settings
  useEffect(() => {
    const saved = localStorage.getItem('notifications')
    if (saved) {
      try {
        setNotifications(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
  }, [])

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-5 py-2.5 font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Subjects
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-2.5 font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="card-glow">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Profile Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="input"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                className="input bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Study Goal: <span className="text-blue-600 font-bold">{Math.round(profileData.daily_study_goal / 60 * 10) / 10} hours</span>
              </label>
              <input
                type="range"
                min="30"
                max="480"
                step="30"
                value={profileData.daily_study_goal}
                onChange={(e) => setProfileData({ ...profileData, daily_study_goal: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>30 min</span>
                <span>8 hours</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Management */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="card-glow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Subject</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name *</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Physics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                <input
                  type="color"
                  value={newSubject.color}
                  onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                  className="w-full h-11 rounded-xl cursor-pointer border-2 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty Level</label>
                <select
                  value={newSubject.difficulty_level}
                  onChange={(e) => setNewSubject({ ...newSubject, difficulty_level: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={1}>😊 Easy</option>
                  <option value={2}>🙂 Somewhat Easy</option>
                  <option value={3}>😐 Medium</option>
                  <option value={4}>😰 Hard</option>
                  <option value={5}>🤯 Very Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target: <span className="text-blue-600 font-bold">{newSubject.target_percentage}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={newSubject.target_percentage}
                  onChange={(e) => setNewSubject({ ...newSubject, target_percentage: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <button onClick={addSubject} className="btn-primary mt-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Subject
            </button>
          </div>

          <div className="card-glow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Subjects ({subjects.length})</h3>
            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No subjects added yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first subject to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                    <div 
                      className="w-2 h-14 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{subject.name}</p>
                      <p className="text-sm text-gray-600">
                        Difficulty: {subject.difficulty_level}/5 • Target: {subject.target_percentage}%
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="card-glow">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            <NotificationToggle
              title="Study Reminders"
              description="Get reminded to start your study sessions"
              enabled={notifications.study_reminders}
              onToggle={(val) => setNotifications({ ...notifications, study_reminders: val })}
            />

            <NotificationToggle
              title="Assignment Due Alerts"
              description="48hrs, 24hrs, and 1hr before deadline"
              enabled={notifications.assignment_alerts}
              onToggle={(val) => setNotifications({ ...notifications, assignment_alerts: val })}
            />

            <NotificationToggle
              title="Exam Reminders"
              description="7 days, 3 days, and 1 day before exams"
              enabled={notifications.exam_reminders}
              onToggle={(val) => setNotifications({ ...notifications, exam_reminders: val })}
            />

            <NotificationToggle
              title="Weekly Progress Reports"
              description="Receive weekly summary via email"
              enabled={notifications.weekly_reports}
              onToggle={(val) => setNotifications({ ...notifications, weekly_reports: val })}
            />

            <div className="pt-4">
              <button onClick={saveNotificationSettings} className="btn-primary flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Settings
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Note:</strong> Push notifications require enabling in your browser settings. 
                Make sure to allow notifications from StudyFlow to receive alerts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationToggle({ title, description, enabled, onToggle }: {
  title: string
  description: string
  enabled: boolean
  onToggle: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
