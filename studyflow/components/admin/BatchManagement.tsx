'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, Batch } from '@/lib/institute-types'
import { Plus, Edit, Trash2, Users, Calendar, IndianRupee } from 'lucide-react'

type BatchManagementProps = {
  institute: Institute
}

export default function BatchManagement({ institute }: BatchManagementProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    course_name: '',
    description: '',
    start_date: '',
    end_date: '',
    class_level: '',
    total_seats: 30,
    fee_amount: 0,
    schedule_days: [] as string[],
    schedule_time: '',
    teacher_name: '',
  })

  useEffect(() => {
    fetchBatches()
  }, [institute.id])

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('institute_id', institute.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBatches(data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('batches')
        .insert({
          institute_id: institute.id,
          ...formData,
        })

      if (error) throw error

      alert('Batch created successfully!')
      setShowAddModal(false)
      fetchBatches()
      resetForm()
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Error creating batch')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchBatches()
    } catch (error) {
      console.error('Error deleting batch:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      course_name: '',
      description: '',
      start_date: '',
      end_date: '',
      class_level: '',
      total_seats: 30,
      fee_amount: 0,
      schedule_days: [],
      schedule_time: '',
      teacher_name: '',
    })
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day]
    }))
  }

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Management</h1>
          <p className="text-gray-600">{batches.length} total batches</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Batch
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{batch.name}</h3>
                <p className="text-sm text-gray-600">{batch.course_name}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                batch.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {batch.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{batch.enrolled_students} / {batch.total_seats} students</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(batch.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <IndianRupee className="w-4 h-4" />
                <span>₹{batch.fee_amount.toLocaleString()}</span>
              </div>
            </div>

            {batch.schedule_days && batch.schedule_days.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Schedule:</p>
                <div className="flex flex-wrap gap-1">
                  {batch.schedule_days.map((day) => (
                    <span key={day} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {day.slice(0, 3)}
                    </span>
                  ))}
                </div>
                {batch.schedule_time && (
                  <p className="text-xs text-gray-600 mt-1">{batch.schedule_time}</p>
                )}
              </div>
            )}

            {batch.teacher_name && (
              <p className="text-sm text-gray-600 mb-4">
                Teacher: {batch.teacher_name}
              </p>
            )}

            <div className="flex gap-2">
              <button className="flex-1 btn-secondary text-sm">
                <Edit className="w-4 h-4 inline mr-1" />
                Edit
              </button>
              <button 
                onClick={() => handleDeleteBatch(batch.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Batch</h2>
            
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="JEE 2026 Batch A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    className="input"
                    placeholder="JEE Preparation"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Batch details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Level
                  </label>
                  <input
                    type="text"
                    value={formData.class_level}
                    onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                    className="input"
                    placeholder="11th, 12th, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.total_seats}
                    onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Name
                  </label>
                  <input
                    type="text"
                    value={formData.teacher_name}
                    onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.schedule_days.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time
                  </label>
                  <input
                    type="text"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    className="input"
                    placeholder="10:00 AM - 12:00 PM"
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
                  {loading ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
