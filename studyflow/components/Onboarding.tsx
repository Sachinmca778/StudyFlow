'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const router = useRouter()
  const { profile, setProfile } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    class_level: profile?.class_level || '',
    board_type: profile?.board_type || '',
    target_exam: profile?.target_exam || '',
    daily_study_goal: profile?.daily_study_goal || 120,
    subjects: [] as Array<{ name: string; color: string; difficulty_level: number }>,
  })

  const classLevels = ['11th', '12th', 'College 1st Year', 'College 2nd Year', 'Dropper']
  const boardTypes = ['CBSE', 'ICSE', 'State Board', 'University']
  const targetExams = ['JEE Mains', 'JEE Advanced', 'NEET', 'Board Exams', 'College Semester', 'None']
  
  const subjectColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#06b6d4', '#ef4444', '#6366f1'
  ]

  const handleNext = () => {
    if (step === 1 && !formData.class_level) return
    if (step === 2 && !formData.board_type) return
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { name: '', color: subjectColors[formData.subjects.length % subjectColors.length], difficulty_level: 3 }]
    })
  }

  const updateSubject = (index: number, field: string, value: any) => {
    const updated = [...formData.subjects]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, subjects: updated })
  }

  const removeSubject = (index: number) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          class_level: formData.class_level,
          board_type: formData.board_type,
          target_exam: formData.target_exam,
          daily_study_goal: formData.daily_study_goal,
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      // Insert subjects
      if (formData.subjects.length > 0) {
        const subjectsToInsert = formData.subjects.map(s => ({
          user_id: profile.id,
          name: s.name,
          color: s.color,
          difficulty_level: s.difficulty_level,
        }))

        const { error: subjectsError } = await supabase
          .from('subjects')
          .insert(subjectsToInsert)

        if (subjectsError) throw subjectsError
      }

      // Update local store
      setProfile({
        ...profile,
        class_level: formData.class_level,
        board_type: formData.board_type,
        target_exam: formData.target_exam,
        daily_study_goal: formData.daily_study_goal,
      })

      onComplete()
    } catch (error) {
      console.error('Error saving onboarding:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s <= step 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">What's your class?</h2>
              <p className="text-gray-600 mb-6">This helps us customize your study plan</p>
              
              <div className="space-y-3">
                {classLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, class_level: level })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      formData.class_level === level
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{level}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Select your board</h2>
              <p className="text-gray-600 mb-6">We'll align study plans with your curriculum</p>
              
              <div className="space-y-3">
                {boardTypes.map((board) => (
                  <button
                    key={board}
                    onClick={() => setFormData({ ...formData, board_type: board })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      formData.board_type === board
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{board}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Target exam?</h2>
              <p className="text-gray-600 mb-6">We'll create exam-specific templates</p>
              
              <div className="space-y-3">
                {targetExams.map((exam) => (
                  <button
                    key={exam}
                    onClick={() => setFormData({ ...formData, target_exam: exam })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      formData.target_exam === exam
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{exam}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Add your subjects</h2>
              <p className="text-gray-600 mb-6">Add subjects you're studying (you can add more later)</p>
              
              <div className="space-y-4 mb-6">
                {formData.subjects.map((subject, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) => updateSubject(index, 'name', e.target.value)}
                        placeholder="Subject name (e.g., Physics)"
                        className="flex-1 input"
                      />
                      <button
                        onClick={() => removeSubject(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <select
                        value={subject.difficulty_level}
                        onChange={(e) => updateSubject(index, 'difficulty_level', parseInt(e.target.value))}
                        className="input"
                      >
                        <option value={1}>Easy</option>
                        <option value={2}>Somewhat Easy</option>
                        <option value={3}>Medium</option>
                        <option value={4}>Hard</option>
                        <option value={5}>Very Hard</option>
                      </select>
                      <input
                        type="color"
                        value={subject.color}
                        onChange={(e) => updateSubject(index, 'color', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addSubject}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-600 hover:text-primary-600 transition-colors"
                >
                  + Add Subject
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily study goal (minutes): {formData.daily_study_goal}
                </label>
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="30"
                  value={formData.daily_study_goal}
                  onChange={(e) => setFormData({ ...formData, daily_study_goal: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>30 min</span>
                  <span>{Math.round(formData.daily_study_goal / 60 * 10) / 10} hours</span>
                  <span>8 hours</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 btn-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 btn-primary"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Get Started'}
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
