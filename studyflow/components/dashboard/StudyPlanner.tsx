'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Subject, StudyPlan } from '@/lib/types'
import { generateStudyPlan } from '@/lib/planner-algorithm'
import { Plus, Trash2, Check, X, Loader2, Sparkles, SkipForward, Clock, BookOpen } from 'lucide-react'
import { format, addDays } from 'date-fns'

export default function StudyPlanner() {
  const { profile } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPlan, setNewPlan] = useState({
    subject_id: '',
    topic: '',
    planned_date: format(new Date(), 'yyyy-MM-dd'),
    planned_duration: 60,
    priority: 3,
    is_revision: false,
  })

  useEffect(() => {
    fetchData()
  }, [profile?.id])

  const fetchData = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      
      const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', profile.id)
        .gte('planned_date', format(weekStart, 'yyyy-MM-dd'))
        .order('planned_date', { ascending: true })

      setSubjects(subjectsData || [])
      setPlans(plansData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (!profile?.id || subjects.length === 0) {
      alert('Please add subjects first in Settings')
      return
    }
    
    setGenerating(true)
    try {
      const weakSubjects = subjects
        .filter(s => s.current_percentage && s.current_percentage < s.target_percentage - 20)
        .map(s => s.id)

      const generated = generateStudyPlan({
        subjects,
        availableHoursPerDay: (profile.daily_study_goal || 120) / 60,
        weakSubjects,
      })

      const plansToInsert = generated.studyPlans.map(p => ({
        ...p,
        user_id: profile.id,
      }))

      const { error } = await supabase
        .from('study_plans')
        .insert(plansToInsert)

      if (error) throw error

      alert(`✅ Generated ${plansToInsert.length} study plans for the week!`)
      fetchData()
    } catch (error) {
      console.error('Error generating plan:', error)
      alert('Failed to generate plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAddPlan = async () => {
    if (!profile?.id || !newPlan.subject_id || !newPlan.topic) {
      alert('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          user_id: profile.id,
          ...newPlan,
        })
        .select()
        .single()

      if (error) throw error

      setPlans([...plans, data])
      setShowForm(false)
      setNewPlan({
        subject_id: '',
        topic: '',
        planned_date: format(new Date(), 'yyyy-MM-dd'),
        planned_duration: 60,
        priority: 3,
        is_revision: false,
      })
    } catch (error) {
      console.error('Error adding plan:', error)
      alert('Failed to add plan.')
    } finally {
      setSaving(false)
    }
  }

  const updatePlanStatus = async (planId: string, status: string) => {
    try {
      await supabase
        .from('study_plans')
        .update({ status })
        .eq('id', planId)

      setPlans(plans.map(p => p.id === planId ? { ...p, status: status as any } : p))
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Failed to update plan.')
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Delete this study plan?')) return
    
    try {
      await supabase
        .from('study_plans')
        .delete()
        .eq('id', planId)

      setPlans(plans.filter(p => p.id !== planId))
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Failed to delete plan.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Group plans by date
  const plansByDate = new Map<string, StudyPlan[]>()
  plans.forEach(plan => {
    const date = plan.planned_date
    if (!plansByDate.has(date)) {
      plansByDate.set(date, [])
    }
    plansByDate.get(date)!.push(plan)
  })

  const sortedDates = Array.from(plansByDate.keys()).sort()

  // If no subjects, show prompt to add them
  if (subjects.length === 0 && !loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="card-glow text-center py-16">
          <BookOpen className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Subjects Added Yet</h3>
          <p className="text-gray-500 mb-2">You need to add subjects before creating a study plan.</p>
          <p className="text-sm text-gray-400 mb-8">Add your subjects like Physics, Chemistry, Maths, etc.</p>
          
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
                // Quick add common subjects
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
              Quick Add: Physics, Chemistry, Maths
            </button>
          </div>
        </div>
      </div>
    )
  }

  const priorityColors = {
    1: 'bg-red-100 text-red-700 border-red-200',
    2: 'bg-orange-100 text-orange-700 border-orange-200',
    3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    4: 'bg-blue-100 text-blue-700 border-blue-200',
    5: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  const statusColors = {
    pending: 'badge-warning',
    in_progress: 'badge-info',
    completed: 'badge-success',
    skipped: 'badge-purple',
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGeneratePlan}
          disabled={generating || subjects.length === 0}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {generating ? 'Generating...' : '✨ AI Generate Weekly Plan'}
        </button>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Manual Plan
        </button>
      </div>

      {/* Add Plan Form */}
      {showForm && (
        <div className="card-glow animate-scale-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add Study Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
              <select
                value={newPlan.subject_id}
                onChange={(e) => setNewPlan({ ...newPlan, subject_id: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic *</label>
              <input
                type="text"
                value={newPlan.topic}
                onChange={(e) => setNewPlan({ ...newPlan, topic: e.target.value })}
                className="input"
                placeholder="e.g., Chapter 5 - Thermodynamics"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={newPlan.planned_date}
                onChange={(e) => setNewPlan({ ...newPlan, planned_date: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration: {newPlan.planned_duration} min
              </label>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={newPlan.planned_duration}
                onChange={(e) => setNewPlan({ ...newPlan, planned_duration: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={newPlan.priority}
                onChange={(e) => setNewPlan({ ...newPlan, priority: parseInt(e.target.value) })}
                className="input"
              >
                <option value={1}>🔴 Highest</option>
                <option value={2}>🟠 High</option>
                <option value={3}>🟡 Medium</option>
                <option value={4}>🔵 Low</option>
                <option value={5}>⚪ Lowest</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_revision"
                checked={newPlan.is_revision}
                onChange={(e) => setNewPlan({ ...newPlan, is_revision: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="is_revision" className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Revision Session
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleAddPlan} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Plan
            </button>
            <button onClick={() => setShowForm(false)} disabled={saving} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans by Date */}
      {sortedDates.length === 0 ? (
        <div className="card-glow text-center py-16">
          <Sparkles className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg mb-2">No study plans yet</p>
          <p className="text-sm text-gray-400 mb-6">Generate your first AI-powered study plan or add manually</p>
          <button onClick={handleGeneratePlan} className="btn-primary">
            <Sparkles className="w-5 h-5 inline mr-2" />
            Generate Your First Plan
          </button>
        </div>
      ) : (
        sortedDates.map(date => {
          const dateObj = new Date(date + 'T00:00:00')
          const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dayPlans = plansByDate.get(date) || []
          const completedCount = dayPlans.filter(p => p.status === 'completed').length
          
          return (
            <div key={date} className="card-glow animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {format(dateObj, 'EEEE, MMMM d')}
                    {isToday && <span className="ml-2 badge badge-info">Today</span>}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {completedCount}/{dayPlans.length} completed
                  </p>
                </div>
                {completedCount === dayPlans.length && dayPlans.length > 0 && (
                  <span className="badge badge-success">✓ All Done!</span>
                )}
              </div>
              
              <div className="space-y-3">
                {dayPlans.map(plan => {
                  const subject = subjects.find(s => s.id === plan.subject_id)
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        plan.status === 'completed' 
                          ? 'bg-green-50 border-green-200 opacity-75' 
                          : plan.status === 'skipped'
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : 'bg-white border-gray-100'
                      }`}
                    >
                      <div 
                        className="w-2 h-14 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject?.color || '#999' }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-semibold text-gray-900 ${
                            plan.status === 'completed' ? 'line-through' : ''
                          }`}>
                            {plan.topic}
                          </p>
                          {plan.is_revision && (
                            <span className="badge badge-purple text-xs">Revision</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>{subject?.name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {plan.planned_duration} min
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className={`badge ${priorityColors[plan.priority as keyof typeof priorityColors]} text-xs`}>
                            P{plan.priority}
                          </span>
                        </p>
                      </div>

                      <span className={`badge ${statusColors[plan.status]} flex-shrink-0 capitalize`}>
                        {plan.status.replace('_', ' ')}
                      </span>

                      <div className="flex gap-1 flex-shrink-0">
                        {plan.status === 'pending' && (
                          <button
                            onClick={() => updatePlanStatus(plan.id, 'in_progress')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Start"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {plan.status === 'in_progress' && (
                          <button
                            onClick={() => updatePlanStatus(plan.id, 'completed')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(plan.status === 'pending' || plan.status === 'in_progress') && (
                          <button
                            onClick={() => updatePlanStatus(plan.id, 'skipped')}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Skip"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
