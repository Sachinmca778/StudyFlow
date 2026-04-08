'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { StudyPlan, Assignment, Exam, Subject } from '@/lib/types'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, AlertCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'

export default function CalendarView() {
  const { profile } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', profile.id)

      const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', profile.id)
        .gte('planned_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('planned_date', format(monthEnd, 'yyyy-MM-dd'))

      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', profile.id)
        .gte('due_date', monthStart.toISOString())
        .lte('due_date', monthEnd.toISOString())

      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', profile.id)
        .gte('exam_date', monthStart.toISOString())
        .lte('exam_date', monthEnd.toISOString())

      setSubjects(subjectsData || [])
      setPlans(plansData || [])
      setAssignments(assignmentsData || [])
      setExams(examsData || [])
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, currentDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })

  const firstDayOfMonth = startOfMonth(currentDate).getDay()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEventsForDay = (date: Date) => {
    const events: Array<{ type: string; title: string; color: string; item: any }> = []

    plans
      .filter(p => isSameDay(new Date(p.planned_date + 'T00:00:00'), date))
      .forEach(p => {
        const subject = subjects.find(s => s.id === p.subject_id)
        events.push({
          type: 'plan',
          title: p.topic,
          color: subject?.color || '#3b82f6',
          item: p,
        })
      })

    assignments
      .filter(a => isSameDay(new Date(a.due_date), date))
      .forEach(a => {
        events.push({
          type: 'assignment',
          title: a.title,
          color: '#f59e0b',
          item: a,
        })
      })

    exams
      .filter(e => isSameDay(new Date(e.exam_date), date))
      .forEach(e => {
        events.push({
          type: 'exam',
          title: e.title,
          color: '#ef4444',
          item: e,
        })
      })

    return events
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Calendar */}
      <div className="card-glow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={prevMonth} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={nextMonth} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 sm:h-28 rounded-xl" />
          ))}

          {/* Days */}
          {days.map((day, index) => {
            const events = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`h-24 sm:h-28 p-2 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : isToday
                    ? 'border-blue-500 bg-blue-50'
                    : isCurrentMonth
                    ? 'border-gray-100 bg-white hover:border-gray-200'
                    : 'border-gray-50 bg-gray-50/50 opacity-50'
                }`}
              >
                <p className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </p>
                <div className="space-y-1 overflow-hidden max-h-16">
                  {events.slice(0, 2).map((event, idx) => (
                    <div
                      key={idx}
                      className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium"
                      style={{ backgroundColor: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <p className="text-xs text-gray-500 font-medium">+{events.length - 2} more</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="card-glow animate-scale-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          {selectedDateEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events on this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <div 
                    className="w-2 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {event.type === 'plan' && 'Study Plan'}
                      {event.type === 'assignment' && 'Assignment Due'}
                      {event.type === 'exam' && 'Exam'}
                    </p>
                  </div>
                  {event.type === 'exam' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {event.type === 'assignment' && (
                    <FileText className="w-5 h-5 text-amber-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="card-glow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {subjects.slice(0, 5).map(subject => (
            <div key={subject.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-sm text-gray-700">{subject.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-700">Assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-sm text-gray-700">Exam</span>
          </div>
        </div>
      </div>
    </div>
  )
}
