'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, StudentPerformance, InstituteStudent } from '@/lib/institute-types'
import { Plus, TrendingUp, Award, BarChart3 } from 'lucide-react'

type PerformanceReportsProps = {
  institute: Institute
}

export default function PerformanceReports({ institute }: PerformanceReportsProps) {
  const [performances, setPerformances] = useState<StudentPerformance[]>([])
  const [students, setStudents] = useState<InstituteStudent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    student_id: '',
    exam_name: '',
    exam_date: '',
    subject: '',
    total_marks: 100,
    marks_obtained: 0,
    grade: '',
    rank: 0,
    remarks: '',
  })

  useEffect(() => {
    fetchPerformances()
    fetchStudents()
  }, [institute.id])

  const fetchPerformances = async () => {
    try {
      const { data, error } = await supabase
        .from('student_performance')
        .select('*')
        .eq('institute_id', institute.id)
        .order('exam_date', { ascending: false })

      if (error) throw error
      setPerformances(data || [])
    } catch (error) {
      console.error('Error fetching performances:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('institute_students')
        .select('*')
        .eq('institute_id', institute.id)
        .eq('status', 'active')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleAddPerformance = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const percentage = (formData.marks_obtained / formData.total_marks) * 100

      const { error } = await supabase
        .from('student_performance')
        .insert({
          institute_id: institute.id,
          ...formData,
          percentage,
        })

      if (error) throw error

      alert('Performance record added!')
      setShowAddModal(false)
      fetchPerformances()
      resetForm()
    } catch (error) {
      console.error('Error adding performance:', error)
      alert('Error adding performance')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      exam_name: '',
      exam_date: '',
      subject: '',
      total_marks: 100,
      marks_obtained: 0,
      grade: '',
      rank: 0,
      remarks: '',
    })
  }

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.student_name || 'Unknown'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Reports</h1>
          <p className="text-gray-600">Track student exam results and performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Result
        </button>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {performances.map((perf) => (
                <tr key={perf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{getStudentName(perf.student_id)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{perf.exam_name}</p>
                      {perf.exam_date && (
                        <p className="text-xs text-gray-500">
                          {new Date(perf.exam_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{perf.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {perf.marks_obtained} / {perf.total_marks}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${
                      (perf.percentage || 0) >= 75 ? 'text-green-600' :
                      (perf.percentage || 0) >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {perf.percentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {perf.grade || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{perf.rank || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Performance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Performance Record</h2>
            
            <form onSubmit={handleAddPerformance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student *
                  </label>
                  <select
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.exam_name}
                    onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                    className="input"
                    placeholder="Mid Term Exam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    placeholder="Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks Obtained *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.marks_obtained}
                    onChange={(e) => setFormData({ ...formData, marks_obtained: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="input"
                    placeholder="A+"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rank
                  </label>
                  <input
                    type="number"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Excellent performance..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
