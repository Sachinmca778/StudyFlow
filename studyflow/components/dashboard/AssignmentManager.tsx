'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Assignment, Subject, Exam } from '@/lib/types'
import { Plus, Trash2, Edit, Calendar, Award, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function AssignmentManager() {
  const { profile } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [showExamForm, setShowExamForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'assignments' | 'exams'>('assignments')
  const [saving, setSaving] = useState(false)
  
  const [newAssignment, setNewAssignment] = useState({
    subject_id: '',
    title: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    total_marks: 100,
    priority: 3,
  })

  const [newExam, setNewExam] = useState({
    subject_id: '',
    title: '',
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_type: 'unit_test',
    total_marks: 100,
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

      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', profile.id)
        .order('due_date', { ascending: true })

      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', profile.id)
        .order('exam_date', { ascending: true })

      setSubjects(subjectsData || [])
      setAssignments(assignmentsData || [])
      setExams(examsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAssignment = async () => {
    if (!profile?.id || !newAssignment.subject_id || !newAssignment.title) {
      alert('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          user_id: profile.id,
          ...newAssignment,
          due_date: new Date(newAssignment.due_date + 'T23:59:59').toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setAssignments([...assignments, data])
      setShowAssignmentForm(false)
      setNewAssignment({
        subject_id: '',
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        total_marks: 100,
        priority: 3,
      })
    } catch (error) {
      console.error('Error adding assignment:', error)
      alert('Failed to add assignment.')
    } finally {
      setSaving(false)
    }
  }

  const addExam = async () => {
    if (!profile?.id || !newExam.subject_id || !newExam.title) {
      alert('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          user_id: profile.id,
          ...newExam,
          exam_date: new Date(newExam.exam_date + 'T09:00:00').toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setExams([...exams, data])
      setShowExamForm(false)
      setNewExam({
        subject_id: '',
        title: '',
        exam_date: format(new Date(), 'yyyy-MM-dd'),
        exam_type: 'unit_test',
        total_marks: 100,
      })
    } catch (error) {
      console.error('Error adding exam:', error)
      alert('Failed to add exam.')
    } finally {
      setSaving(false)
    }
  }

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      await supabase
        .from('assignments')
        .update({ status })
        .eq('id', assignmentId)

      setAssignments(assignments.map(a => 
        a.id === assignmentId ? { ...a, status: status as any } : a
      ))
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment.')
    }
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Delete this assignment?')) return
    
    try {
      await supabase.from('assignments').delete().eq('id', assignmentId)
      setAssignments(assignments.filter(a => a.id !== assignmentId))
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment.')
    }
  }

  const deleteExam = async (examId: string) => {
    if (!confirm('Delete this exam?')) return
    
    try {
      await supabase.from('exams').delete().eq('id', examId)
      setExams(exams.filter(e => e.id !== examId))
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Failed to delete exam.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const upcomingAssignments = assignments.filter(a => 
    ['pending', 'in_progress'].includes(a.status)
  )
  const completedAssignments = assignments.filter(a => 
    ['submitted', 'graded'].includes(a.status)
  )

  const priorityBadge = (priority: number) => {
    if (priority <= 2) return <span className="badge badge-danger">High</span>
    if (priority === 3) return <span className="badge badge-warning">Medium</span>
    return <span className="badge badge-info">Low</span>
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
            activeTab === 'assignments'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📝 Assignments
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
            activeTab === 'exams'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📚 Exams
        </button>
      </div>

      {activeTab === 'assignments' && (
        <>
          <button
            onClick={() => setShowAssignmentForm(!showAssignmentForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Assignment
          </button>

          {showAssignmentForm && (
            <div className="card-glow animate-scale-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <select
                    value={newAssignment.subject_id}
                    onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    className="input"
                    placeholder="e.g., Physics Homework Chapter 5"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Assignment details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    value={newAssignment.total_marks}
                    onChange={(e) => setNewAssignment({ ...newAssignment, total_marks: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={newAssignment.priority}
                    onChange={(e) => setNewAssignment({ ...newAssignment, priority: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value={1}>🔴 Highest</option>
                    <option value={2}>🟠 High</option>
                    <option value={3}>🟡 Medium</option>
                    <option value={4}>🔵 Low</option>
                    <option value={5}>⚪ Lowest</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={addAssignment} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Assignment
                </button>
                <button onClick={() => setShowAssignmentForm(false)} disabled={saving} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Assignments */}
          {upcomingAssignments.length > 0 ? (
            <div className="card-glow">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ⏰ Upcoming ({upcomingAssignments.length})
              </h3>
              <div className="space-y-3">
                {upcomingAssignments.map(assignment => {
                  const subject = subjects.find(s => s.id === assignment.subject_id)
                  const daysUntilDue = differenceInDays(
                    new Date(assignment.due_date),
                    new Date()
                  )

                  return (
                    <div key={assignment.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">
                            {subject?.name}
                          </p>
                        </div>
                        {priorityBadge(assignment.priority)}
                      </div>
                      
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className={daysUntilDue <= 2 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {daysUntilDue < 0 
                              ? `Overdue by ${Math.abs(daysUntilDue)} days`
                              : daysUntilDue === 0 
                              ? 'Due today!'
                              : daysUntilDue === 1 
                              ? 'Due tomorrow'
                              : `Due in ${daysUntilDue} days`}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {assignment.status === 'pending' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                              className="text-sm btn-primary"
                            >
                              Start
                            </button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'submitted')}
                              className="text-sm btn-primary flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Submit
                            </button>
                          )}
                          <button
                            onClick={() => deleteAssignment(assignment.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="card-glow text-center py-12">
              <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No upcoming assignments</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          )}

          {/* Completed Assignments */}
          {completedAssignments.length > 0 && (
            <div className="card-glow">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ✅ Completed ({completedAssignments.length})
              </h3>
              <div className="space-y-3">
                {completedAssignments.map(assignment => {
                  const subject = subjects.find(s => s.id === assignment.subject_id)
                  
                  return (
                    <div key={assignment.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">{subject?.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {assignment.marks_obtained !== null && assignment.total_marks && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-700">
                                {assignment.marks_obtained}/{assignment.total_marks}
                              </p>
                              <p className="text-xs text-green-600">
                                {Math.round((assignment.marks_obtained / assignment.total_marks) * 100)}%
                              </p>
                            </div>
                          )}
                          <span className="badge badge-success capitalize">
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'exams' && (
        <>
          <button
            onClick={() => setShowExamForm(!showExamForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exam
          </button>

          {showExamForm && (
            <div className="card-glow animate-scale-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Exam</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <select
                    value={newExam.subject_id}
                    onChange={(e) => setNewExam({ ...newExam, subject_id: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Title *</label>
                  <input
                    type="text"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                    className="input"
                    placeholder="e.g., Mid-Term Physics"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Date</label>
                  <input
                    type="date"
                    value={newExam.exam_date}
                    onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Type</label>
                  <select
                    value={newExam.exam_type}
                    onChange={(e) => setNewExam({ ...newExam, exam_type: e.target.value })}
                    className="input"
                  >
                    <option value="unit_test">Unit Test</option>
                    <option value="mid_term">Mid-Term</option>
                    <option value="final">Final Exam</option>
                    <option value="mock">Mock Test</option>
                    <option value="competitive">Competitive (JEE/NEET)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    value={newExam.total_marks}
                    onChange={(e) => setNewExam({ ...newExam, total_marks: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={addExam} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Exam
                </button>
                <button onClick={() => setShowExamForm(false)} disabled={saving} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Exams List */}
          {exams.length > 0 ? (
            <div className="card-glow">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📚 All Exams ({exams.length})
              </h3>
              <div className="space-y-3">
                {exams.map(exam => {
                  const subject = subjects.find(s => s.id === exam.subject_id)
                  const daysUntilExam = differenceInDays(
                    new Date(exam.exam_date),
                    new Date()
                  )

                  return (
                    <div key={exam.id} className={`p-4 rounded-xl border-2 ${
                      daysUntilExam < 0 
                        ? 'bg-green-50 border-green-200' 
                        : daysUntilExam <= 3
                        ? 'bg-red-50 border-red-200'
                        : daysUntilExam <= 7
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-600">
                            {subject?.name} • {exam.exam_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {daysUntilExam < 0 ? (
                            <span className="badge badge-success">Completed</span>
                          ) : daysUntilExam === 0 ? (
                            <span className="badge badge-danger">Today!</span>
                          ) : daysUntilExam === 1 ? (
                            <span className="badge badge-warning">Tomorrow</span>
                          ) : (
                            <span className={`badge ${
                              daysUntilExam <= 3 ? 'badge-danger' : 
                              daysUntilExam <= 7 ? 'badge-warning' : 'badge-info'
                            }`}>
                              {daysUntilExam} days to go
                            </span>
                          )}
                          <button
                            onClick={() => deleteExam(exam.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {exam.marks_obtained !== null && exam.total_marks && (
                        <div className="mt-2 p-3 bg-green-100 rounded-lg">
                          <p className="text-sm font-bold text-green-800">
                            🎯 Score: {exam.marks_obtained}/{exam.total_marks} 
                            ({Math.round((exam.marks_obtained / exam.total_marks) * 100)}%)
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="card-glow text-center py-12">
              <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No exams scheduled</p>
              <p className="text-sm text-gray-400 mt-1">Add your upcoming exams to stay organized</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
