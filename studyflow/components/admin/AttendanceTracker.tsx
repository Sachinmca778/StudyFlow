'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, InstituteStudent, StudentAttendance } from '@/lib/institute-types'
import { Calendar, Check, X, Clock, FileText } from 'lucide-react'

type AttendanceTrackerProps = {
  institute: Institute
}

export default function AttendanceTracker({ institute }: AttendanceTrackerProps) {
  const [students, setStudents] = useState<InstituteStudent[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchAttendance()
  }, [institute.id, selectedDate])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('institute_students')
        .select('*')
        .eq('institute_id', institute.id)
        .eq('status', 'active')
        .order('student_name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('institute_id', institute.id)
        .eq('attendance_date', selectedDate)

      if (error) throw error
      
      const attendanceMap: Record<string, string> = {}
      data?.forEach(record => {
        attendanceMap[record.student_id] = record.status
      })
      setAttendance(attendanceMap)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const markAttendance = async (studentId: string, status: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('student_attendance')
        .upsert({
          institute_id: institute.id,
          student_id: studentId,
          attendance_date: selectedDate,
          status,
          marked_by: user.user?.id,
        }, {
          onConflict: 'student_id,attendance_date'
        })

      if (error) throw error
      
      setAttendance(prev => ({ ...prev, [studentId]: status }))
    } catch (error) {
      console.error('Error marking attendance:', error)
    }
  }

  const saveAllAttendance = async () => {
    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const records = students.map(student => ({
        institute_id: institute.id,
        student_id: student.id,
        attendance_date: selectedDate,
        status: attendance[student.id] || 'absent',
        marked_by: user.user?.id,
      }))

      const { error } = await supabase
        .from('student_attendance')
        .upsert(records, {
          onConflict: 'student_id,attendance_date'
        })

      if (error) throw error
      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance')
    } finally {
      setLoading(false)
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Tracker</h1>
        <p className="text-gray-600">Mark daily attendance for students</p>
      </div>

      {/* Date Selector & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Present</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{presentCount}</p>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Absent</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{absentCount}</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{students.length}</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mark Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{student.student_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{student.enrollment_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{student.class_level}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          attendance[student.id] === 'present'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          attendance[student.id] === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'late')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          attendance[student.id] === 'late'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAllAttendance}
          disabled={loading}
          className="btn-primary px-8"
        >
          {loading ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}
