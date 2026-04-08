import { Subject, StudyPlan } from '@/lib/types'
import { format, addDays, startOfWeek } from 'date-fns'

interface PlannerInput {
  subjects: Subject[]
  availableHoursPerDay: number
  examDate?: string
  weakSubjects?: string[] // subject IDs
}

interface GeneratedPlan {
  studyPlans: Omit<StudyPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
}

export function generateStudyPlan(input: PlannerInput): GeneratedPlan {
  const { subjects, availableHoursPerDay, examDate, weakSubjects = [] } = input
  
  const plans: GeneratedPlan['studyPlans'] = []
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday start
  
  // Calculate study time allocation based on difficulty and weakness
  const subjectPriorities = subjects.map(subject => {
    let priority = subject.difficulty_level || 3
    
    // Increase priority for weak subjects
    if (weakSubjects.includes(subject.id)) {
      priority = Math.min(5, priority + 1)
    }
    
    return {
      subjectId: subject.id,
      priority,
      name: subject.name,
      targetPercentage: subject.target_percentage,
      currentPercentage: subject.current_percentage,
    }
  })
  
  const totalPriority = subjectPriorities.reduce((sum, s) => sum + s.priority, 0)
  const availableMinutesPerDay = availableHoursPerDay * 60
  
  // Generate plan for next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = addDays(weekStart, day)
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    
    // Distribute time based on priority
    let remainingMinutes = availableMinutesPerDay
    
    subjectPriorities.forEach((subject, index) => {
      if (remainingMinutes <= 0) return
      
      const allocation = Math.round(
        (subject.priority / totalPriority) * availableMinutesPerDay
      )
      
      // Allocate time to subject
      const actualTime = Math.min(allocation, remainingMinutes)
      remainingMinutes -= actualTime
      
      if (actualTime > 0) {
        // Determine if this should be revision
        const needsRevision = subject.currentPercentage && 
          subject.currentPercentage < subject.targetPercentage - 20
        
        plans.push({
          subject_id: subject.subjectId,
          topic: `Study ${subject.name}`,
          planned_date: dateStr,
          planned_duration: actualTime,
          status: 'pending',
          priority: subject.priority,
          is_revision: needsRevision || false,
          notes: null,
        })
      }
    })
    
    // Add spaced repetition revision for previous topics
    if (day > 0 && day % 2 === 0) {
      const revisionSubject = subjectPriorities[day % subjectPriorities.length]
      plans.push({
        subject_id: revisionSubject.subjectId,
        topic: `Revision - ${revisionSubject.name}`,
        planned_date: dateStr,
        planned_duration: 30,
        status: 'pending',
        priority: 2,
        is_revision: true,
        notes: null,
      })
    }
  }
  
  return { studyPlans: plans }
}

export function calculateStudyStats(studySessions: any[]) {
  const totalMinutes = studySessions.reduce((sum, session) => {
    return sum + (session.duration || 0)
  }, 0)
  
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10
  
  const uniqueDays = new Set(
    studySessions.map(session => 
      new Date(session.start_time).toDateString()
    )
  ).size
  
  const averageRating = studySessions.filter(s => s.rating).length > 0
    ? studySessions.reduce((sum, s) => sum + (s.rating || 0), 0) / 
      studySessions.filter(s => s.rating).length
    : 0
  
  return {
    totalHours,
    totalMinutes,
    consistencyDays: uniqueDays,
    averageRating: Math.round(averageRating * 10) / 10,
  }
}

export function getSubjectWiseBreakdown(studySessions: any[], subjects: Subject[]) {
  const subjectMap = new Map<string, number>()
  
  studySessions.forEach(session => {
    if (session.subject_id) {
      const current = subjectMap.get(session.subject_id) || 0
      subjectMap.set(session.subject_id, current + (session.duration || 0))
    }
  })
  
  return subjects.map(subject => ({
    subjectId: subject.id,
    subjectName: subject.name,
    color: subject.color,
    minutes: subjectMap.get(subject.id) || 0,
    hours: Math.round((subjectMap.get(subject.id) || 0) / 60 * 10) / 10,
  }))
}
