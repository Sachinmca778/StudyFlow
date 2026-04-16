'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, InstituteStudent, Batch } from '@/lib/institute-types'
import { Plus, Search, Edit, Trash2, Phone, Mail, User } from 'lucide-react'

type StudentManagementProps = {
  institute: Institute
}

export default function StudentManagement({ institute }: StudentManagementProps) {
  const [students, setStudents] = useState<InstituteStudent[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Predefined class levels
  const classLevels = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
    '11th Science', '11th Commerce', '11th Arts',
    '12th Science', '12th Commerce', '12th Arts',
    'Nursery', 'LKG', 'UKG', 'Playgroup',
    'BA 1st Year', 'BA 2nd Year', 'BA 3rd Year',
    'BSc 1st Year', 'BSc 2nd Year', 'BSc 3rd Year',
    'BCom 1st Year', 'BCom 2nd Year', 'BCom 3rd Year',
    'Other'
  ]

  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: '',
    enrollment_number: '',
    class_level: '',
    batch_id: '',
  })

  useEffect(() => {
    fetchStudents()
    fetchBatches()
  }, [institute.id])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('institute_students')
        .select('*')
        .eq('institute_id', institute.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('institute_id', institute.id)
        .eq('is_active', true)

      if (error) throw error
      setBatches(data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('institute_students')
        .insert({
          institute_id: institute.id,
          ...formData,
          batch_id: formData.batch_id || null,
        })

      if (error) throw error

      alert('Student added successfully!')
      setShowAddModal(false)
      fetchStudents()
      resetForm()
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Error adding student')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const { error } = await supabase
        .from('institute_students')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      student_name: '',
      email: '',
      phone: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      enrollment_number: '',
      class_level: '',
      batch_id: '',
    })
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.phone.includes(searchQuery) ||
                         student.enrollment_number?.includes(searchQuery)
    
    const matchesClass = filterClass === 'all' || student.class_level === filterClass
    const matchesBatch = filterBatch === 'all' || student.batch_id === filterBatch
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    
    return matchesSearch && matchesClass && matchesBatch && matchesStatus
  })

  // Get unique classes from students (filter out null/undefined)
  const uniqueClasses = Array.from(
    new Set(
      students
        .map(s => s.class_level)
        .filter((cls): cls is string => Boolean(cls))
    )
  )

  // Stats by class
  const getClassStats = () => {
    const stats: { [key: string]: number } = {}
    students.forEach(student => {
      const cls = student.class_level || 'Unassigned'
      stats[cls] = (stats[cls] || 0) + 1
    })
    return stats
  }

  const classStats = getClassStats()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">{students.length} total students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      {/* Class Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div 
          onClick={() => setFilterClass('all')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            filterClass === 'all' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <p className="text-sm text-gray-600">All Students</p>
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
        </div>
        
        {Object.entries(classStats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cls, count]) => (
            <div
              key={cls}
              onClick={() => setFilterClass(cls)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                filterClass === cls 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <p className="text-sm text-gray-600 truncate">{cls}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.sort().map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="input"
          >
            <option value="all">All Batches</option>
            {batches.map(batch => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {(filterClass !== 'all' || filterBatch !== 'all' || filterStatus !== 'all' || searchQuery) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active Filters:</span>
            {filterClass !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                Class: {filterClass}
                <button onClick={() => setFilterClass('all')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {filterBatch !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                Batch: {batches.find(b => b.id === filterBatch)?.name}
                <button onClick={() => setFilterBatch('all')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-green-900">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-gray-900">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterClass('all')
                setFilterBatch('all')
                setFilterStatus('all')
                setSearchQuery('')
              }}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{student.student_name}</p>
                      <p className="text-sm text-gray-500">{student.enrollment_number}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="flex items-center gap-2 text-gray-900">
                        <Phone className="w-4 h-4" />
                        {student.phone}
                      </p>
                      {student.email && (
                        <p className="flex items-center gap-2 text-gray-500 mt-1">
                          <Mail className="w-4 h-4" />
                          {student.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{student.parent_name || '-'}</p>
                      <p className="text-gray-500">{student.parent_phone || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{student.class_level || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Student</h2>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Level *
                  </label>
                  <select
                    required
                    value={formData.class_level}
                    onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Class</option>
                    <optgroup label="Primary Classes">
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      <option value="Playgroup">Playgroup</option>
                    </optgroup>
                    <optgroup label="School Classes">
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                      <option value="4th">4th</option>
                      <option value="5th">5th</option>
                      <option value="6th">6th</option>
                      <option value="7th">7th</option>
                      <option value="8th">8th</option>
                      <option value="9th">9th</option>
                      <option value="10th">10th</option>
                    </optgroup>
                    <optgroup label="11th Standard">
                      <option value="11th Science">11th Science</option>
                      <option value="11th Commerce">11th Commerce</option>
                      <option value="11th Arts">11th Arts</option>
                    </optgroup>
                    <optgroup label="12th Standard">
                      <option value="12th Science">12th Science</option>
                      <option value="12th Commerce">12th Commerce</option>
                      <option value="12th Arts">12th Arts</option>
                    </optgroup>
                    <optgroup label="Graduation">
                      <option value="BA 1st Year">BA 1st Year</option>
                      <option value="BA 2nd Year">BA 2nd Year</option>
                      <option value="BA 3rd Year">BA 3rd Year</option>
                      <option value="BSc 1st Year">BSc 1st Year</option>
                      <option value="BSc 2nd Year">BSc 2nd Year</option>
                      <option value="BSc 3rd Year">BSc 3rd Year</option>
                      <option value="BCom 1st Year">BCom 1st Year</option>
                      <option value="BCom 2nd Year">BCom 2nd Year</option>
                      <option value="BCom 3rd Year">BCom 3rd Year</option>
                    </optgroup>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={formData.enrollment_number}
                    onChange={(e) => setFormData({ ...formData, enrollment_number: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch
                  </label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input min-h-[80px]"
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
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
