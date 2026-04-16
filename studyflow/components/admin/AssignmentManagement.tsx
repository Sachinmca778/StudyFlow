'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, Assignment, AssignmentSubmission, Batch } from '@/lib/institute-types'
import { 
  Plus, Search, Filter, Calendar, Clock, CheckCircle, 
  XCircle, Edit2, Trash2, Eye, FileText, Upload, Download
} from 'lucide-react'

type AssignmentManagementProps = {
  institute: Institute
}

export default function AssignmentManagement({ institute }: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    assignment_type: 'homework' as 'homework' | 'project' | 'assignment' | 'practical',
    batch_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_marks: 100,
  })

  useEffect(() => {
    fetchAssignments()
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('institute_id', institute.id)
      .eq('is_active', true)
      .order('name')

    if (data) setBatches(data)
  }

  const fetchAssignments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        batch:batches(name, course_name)
      `)
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false })

    if (data) setAssignments(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const assignmentData = {
      ...formData,
      institute_id: institute.id,
      is_active: true,
    }

    if (selectedAssignment) {
      const { error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', selectedAssignment.id)
      
      if (!error) {
        alert('Assignment updated successfully!')
        resetForm()
        fetchAssignments()
      }
    } else {
      const { error } = await supabase
        .from('assignments')
        .insert([assignmentData])
      
      if (!error) {
        alert('Assignment created successfully!')
        resetForm()
        fetchAssignments()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)
      
      if (!error) {
        alert('Assignment deleted successfully!')
        fetchAssignments()
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      assignment_type: 'homework',
      batch_id: '',
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: '',
      total_marks: 100,
    })
    setSelectedAssignment(null)
    setShowAddModal(false)
  }

  const editAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      subject: assignment.subject,
      assignment_type: assignment.assignment_type,
      batch_id: assignment.batch_id,
      assigned_date: assignment.assigned_date,
      due_date: assignment.due_date,
      total_marks: assignment.total_marks || 100,
    })
    setShowAddModal(true)
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBatch = filterBatch === 'all' || assignment.batch_id === filterBatch
    const today = new Date().toISOString().split('T')[0]
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && assignment.due_date >= today) ||
                         (filterStatus === 'expired' && assignment.due_date < today)
    
    return matchesSearch && matchesBatch && matchesStatus
  })

  const getStatusBadge = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (dueDate < today) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Expired</span>
    } else if (dueDate === today) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Due Today</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignment Management</h2>
          <p className="text-gray-600">Create and manage homework & assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Assignment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Batches</option>
            {batches.map(batch => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assignments found</p>
          </div>
        ) : (
          filteredAssignments.map((assignment: any) => (
            <div key={assignment.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    {getStatusBadge(assignment.due_date)}
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                      {assignment.assignment_type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Subject:</span>
                      <p className="font-medium text-gray-900">{assignment.subject}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Batch:</span>
                      <p className="font-medium text-gray-900">{assignment.batch?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <p className="font-medium text-gray-900">{new Date(assignment.due_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Marks:</span>
                      <p className="font-medium text-gray-900">{assignment.total_marks || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => editAssignment(assignment)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="homework">Homework</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch *
                  </label>
                  <select
                    required
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>{batch.name} - {batch.course_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.assigned_date}
                    onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {selectedAssignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
