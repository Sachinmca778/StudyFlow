'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, Announcement, Batch } from '@/lib/institute-types'
import { 
  Plus, Search, Bell, AlertCircle, Calendar, Users, 
  Edit2, Trash2, Eye, Send, Filter, Megaphone
} from 'lucide-react'

type CommunicationCenterProps = {
  institute: Institute
}

export default function CommunicationCenter({ institute }: CommunicationCenterProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'general' as 'general' | 'urgent' | 'event' | 'holiday' | 'exam' | 'fee',
    target_audience: 'all' as 'all' | 'students' | 'parents' | 'staff' | 'specific_batch',
    batch_id: null as string | null,
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    published_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
  })

  useEffect(() => {
    fetchAnnouncements()
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('*')
      .eq('institute_id', institute.id)
      .eq('is_active', true)
      .order('name')

    if (data) setBatches(data)
  }

  const fetchAnnouncements = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select(`
        *,
        batch:batches(name)
      `)
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false })

    if (data) setAnnouncements(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const announcementData = {
      ...formData,
      institute_id: institute.id,
      is_active: true,
      batch_id: formData.target_audience === 'specific_batch' ? formData.batch_id : null,
    }

    if (selectedAnnouncement) {
      const { error } = await supabase
        .from('announcements')
        .update(announcementData)
        .eq('id', selectedAnnouncement.id)
      
      if (!error) {
        alert('Announcement updated successfully!')
        await sendNotifications(selectedAnnouncement.id, announcementData)
        resetForm()
        fetchAnnouncements()
      }
    } else {
      const { data, error } = await supabase
        .from('announcements')
        .insert([announcementData])
        .select()
      
      if (!error && data) {
        alert('Announcement created successfully!')
        await sendNotifications(data[0].id, announcementData)
        resetForm()
        fetchAnnouncements()
      }
    }
  }

  const sendNotifications = async (announcementId: string, announcement: any) => {
    // Get target recipients based on audience
    let recipients: any[] = []

    if (announcement.target_audience === 'all' || announcement.target_audience === 'students') {
      const { data: students } = await supabase
        .from('institute_students')
        .select('id')
        .eq('institute_id', institute.id)
        .eq('status', 'active')
      
      if (students) {
        recipients = [...recipients, ...students.map(s => ({
          institute_id: institute.id,
          recipient_type: 'student',
          recipient_id: s.id,
          notification_type: 'announcement',
          title: announcement.title,
          message: announcement.content,
          is_read: false,
          sent_via: ['app']
        }))]
      }
    }

    if (announcement.target_audience === 'specific_batch' && announcement.batch_id) {
      const { data: students } = await supabase
        .from('institute_students')
        .select('id')
        .eq('institute_id', institute.id)
        .eq('batch_id', announcement.batch_id)
        .eq('status', 'active')
      
      if (students) {
        recipients = students.map(s => ({
          institute_id: institute.id,
          recipient_type: 'student',
          recipient_id: s.id,
          notification_type: 'announcement',
          title: announcement.title,
          message: announcement.content,
          is_read: false,
          sent_via: ['app']
        }))
      }
    }

    // Insert notifications
    if (recipients.length > 0) {
      await supabase.from('notifications').insert(recipients)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)
      
      if (!error) {
        alert('Announcement deleted successfully!')
        fetchAnnouncements()
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      announcement_type: 'general',
      target_audience: 'all',
      batch_id: null,
      priority: 'normal',
      published_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
    })
    setSelectedAnnouncement(null)
    setShowAddModal(false)
  }

  const editAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcement_type: announcement.announcement_type,
      target_audience: announcement.target_audience,
      batch_id: announcement.batch_id,
      priority: announcement.priority,
      published_date: announcement.published_date,
      expiry_date: announcement.expiry_date || '',
    })
    setShowAddModal(true)
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || announcement.announcement_type === filterType
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority
    
    return matchesSearch && matchesType && matchesPriority
  })

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${styles[priority as keyof typeof styles]}`}>
      {priority.toUpperCase()}
    </span>
  }

  const getTypeBadge = (type: string) => {
    const styles = {
      general: 'bg-gray-100 text-gray-700',
      urgent: 'bg-red-100 text-red-700',
      event: 'bg-purple-100 text-purple-700',
      holiday: 'bg-green-100 text-green-700',
      exam: 'bg-blue-100 text-blue-700',
      fee: 'bg-yellow-100 text-yellow-700'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${styles[type as keyof typeof styles]} capitalize`}>
      {type}
    </span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication Center</h2>
          <p className="text-gray-600">Send announcements and notifications</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Megaphone className="w-5 h-5" />
          New Announcement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => a.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => !a.expiry_date || a.expiry_date >= new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => {
                  const date = new Date(a.created_at)
                  const now = new Date()
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="event">Event</option>
            <option value="holiday">Holiday</option>
            <option value="exam">Exam</option>
            <option value="fee">Fee</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No announcements found</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement: any) => (
            <div key={announcement.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    {getPriorityBadge(announcement.priority)}
                    {getTypeBadge(announcement.announcement_type)}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{announcement.content}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <p className="font-medium text-gray-900 capitalize">{announcement.target_audience}</p>
                    </div>
                    {announcement.batch && (
                      <div>
                        <span className="text-gray-500">Batch:</span>
                        <p className="font-medium text-gray-900">{announcement.batch.name}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Published:</span>
                      <p className="font-medium text-gray-900">{new Date(announcement.published_date).toLocaleDateString()}</p>
                    </div>
                    {announcement.expiry_date && (
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <p className="font-medium text-gray-900">{new Date(announcement.expiry_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => editAnnouncement(announcement)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
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
                {selectedAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
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
                    Content *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.announcement_type}
                    onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="event">Event</option>
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam</option>
                    <option value="fee">Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <select
                    required
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="students">Students Only</option>
                    <option value="parents">Parents Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="specific_batch">Specific Batch</option>
                  </select>
                </div>

                {formData.target_audience === 'specific_batch' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Batch *
                    </label>
                    <select
                      required
                      value={formData.batch_id || ''}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Batch</option>
                      {batches.map(batch => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Published Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {selectedAnnouncement ? 'Update Announcement' : 'Create & Send'}
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
