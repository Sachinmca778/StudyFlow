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
  const [filterClass, setFilterClass] = useState<string>('all')

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
        .order('class_level')
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

  // Get unique classes (filter out null/undefined)
  const uniqueClasses = Array.from(
    new Set(
      students
        .map(s => s.class_level)
        .filter((cls): cls is string => Boolean(cls))
    )
  )

  // Filter students by class
  const filteredStudents = filterClass === 'all' 
    ? students 
    : students.filter(s => s.class_level === filterClass)

  // Get attendance stats
  const getAttendanceStats = () => {
    const present = filteredStudents.filter(s => attendance[s.id] === 'present').length
    const absent = filteredStudents.filter(s => attendance[s.id] === 'absent').length
    const late = filteredStudents.filter(s => attendance[s.id] === 'late').length
    const unmarked = filteredStudents.filter(s => !attendance[s.id]).length
    return { present, absent, late, unmarked }
  }

  const stats = getAttendanceStats()

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-full"
          />
        </div>

        <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Present</p>
          <p className="text-3xl font-bold text-green-700">{stats.present}</p>
        </div>

        <div className="bg-red-50 rounded-xl shadow-sm p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Absent</p>
          <p className="text-3xl font-bold text-red-700">{stats.absent}</p>
        </div>

        <div className="bg-yellow-50 rounded-xl shadow-sm p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">Late</p>
          <p className="text-3xl font-bold text-yellow-700">{stats.late}</p>
        </div>

        <div className="bg-gray-50 rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Unmarked</p>
          <p className="text-3xl font-bold text-gray-700">{stats.unmarked}</p>
        </div>
      </div>

      {/* Class Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by Class:</span>
          <button
            onClick={() => setFilterClass('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterClass === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Classes ({students.length})
          </button>
          {uniqueClasses.sort().map(cls => {
            const count = students.filter(s => s.class_level === cls).length
            return (
              <button
                key={cls}
                onClick={() => setFilterClass(cls)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterClass === cls
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cls} ({count})
              </button>
            )
          })}
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredStudents.length} students
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
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{student.student_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{student.enrollment_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                      {student.class_level || 'N/A'}
                    </span>
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
