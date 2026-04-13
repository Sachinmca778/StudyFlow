'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, FeeReminder, InstituteStudent } from '@/lib/institute-types'
import { Bell, Send, Phone, Mail, MessageSquare } from 'lucide-react'

type FeeRemindersProps = {
  institute: Institute
}

export default function FeeReminders({ institute }: FeeRemindersProps) {
  const [reminders, setReminders] = useState<FeeReminder[]>([])
  const [students, setStudents] = useState<InstituteStudent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReminders()
    fetchStudents()
  }, [institute.id])

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_reminders')
        .select('*')
        .eq('institute_id', institute.id)
        .order('due_date', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
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

  const generateReminders = async () => {
    setLoading(true)
    try {
      // Get students with pending fees
      const { data: pendingPayments } = await supabase
        .from('fee_payments')
        .select('student_id, amount, month_year')
        .eq('institute_id', institute.id)
        .in('status', ['pending', 'overdue'])

      if (!pendingPayments || pendingPayments.length === 0) {
        alert('No pending fees found!')
        return
      }

      // Create reminders
      const reminderRecords = pendingPayments.map(payment => ({
        institute_id: institute.id,
        student_id: payment.student_id,
        amount_due: payment.amount,
        due_date: new Date().toISOString().split('T')[0],
        reminder_type: 'sms' as const,
        status: 'pending' as const,
        message: `Dear Parent, Fee payment of ₹${payment.amount} for ${payment.month_year} is pending. Please pay at the earliest. - ${institute.name}`,
      }))

      const { error } = await supabase
        .from('fee_reminders')
        .insert(reminderRecords)

      if (error) throw error

      alert(`${reminderRecords.length} reminders generated!`)
      fetchReminders()
    } catch (error) {
      console.error('Error generating reminders:', error)
      alert('Error generating reminders')
    } finally {
      setLoading(false)
    }
  }

  const sendReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('fee_reminders')
        .update({
          status: 'sent',
          reminder_sent_at: new Date().toISOString(),
        })
        .eq('id', reminderId)

      if (error) throw error

      alert('Reminder marked as sent! (SMS integration pending)')
      fetchReminders()
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const getStudentInfo = (studentId: string) => {
    return students.find(s => s.id === studentId)
  }

  const pendingReminders = reminders.filter(r => r.status === 'pending')
  const sentReminders = reminders.filter(r => r.status === 'sent')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Reminders</h1>
          <p className="text-gray-600">Send automated fee payment reminders</p>
        </div>
        <button
          onClick={generateReminders}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Bell className="w-5 h-5" />
          {loading ? 'Generating...' : 'Generate Reminders'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Pending</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{pendingReminders.length}</p>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Sent</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{sentReminders.length}</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{reminders.length}</p>
        </div>
      </div>

      {/* Pending Reminders */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Reminders</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingReminders.map((reminder) => {
                  const student = getStudentInfo(reminder.student_id)
                  return (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{student?.student_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{student?.parent_phone || student?.phone}</p>
                          <p className="text-gray-500">{student?.parent_email || student?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600">
                          ₹{Number(reminder.amount_due).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(reminder.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 max-w-xs truncate">
                          {reminder.message}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => sendReminder(reminder.id)}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sent Reminders */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Sent Reminders</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sentReminders.map((reminder) => {
                  const student = getStudentInfo(reminder.student_id)
                  return (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{student?.student_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{Number(reminder.amount_due).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {reminder.reminder_sent_at 
                            ? new Date(reminder.reminder_sent_at).toLocaleString()
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Sent
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
