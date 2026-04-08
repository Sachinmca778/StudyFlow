export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  class_level: string | null
  board_type: string | null
  target_exam: string | null
  daily_study_goal: number
  created_at: string
  updated_at: string
}

export type Subject = {
  id: string
  user_id: string
  name: string
  color: string
  difficulty_level: number | null
  target_percentage: number
  current_percentage: number | null
  created_at: string
  updated_at: string
}

export type ClassSchedule = {
  id: string
  user_id: string
  subject_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  room_number: string | null
  teacher_name: string | null
  is_recurring: boolean
  created_at: string
}

export type StudySession = {
  id: string
  user_id: string
  subject_id: string | null
  topic: string | null
  start_time: string
  end_time: string | null
  duration: number | null
  session_type: string
  notes: string | null
  rating: number | null
  created_at: string
}

export type StudyPlan = {
  id: string
  user_id: string
  subject_id: string | null
  topic: string
  planned_date: string
  planned_duration: number
  actual_duration: number | null
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  priority: number
  is_revision: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type Assignment = {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  description: string | null
  due_date: string
  total_marks: number | null
  marks_obtained: number | null
  status: 'pending' | 'in_progress' | 'submitted' | 'graded'
  priority: number
  created_at: string
  updated_at: string
}

export type Exam = {
  id: string
  user_id: string
  title: string
  subject_id: string | null
  exam_date: string
  exam_type: string | null
  total_marks: number | null
  marks_obtained: number | null
  chapters_covered: string[] | null
  created_at: string
  updated_at: string
}

export type FocusSession = {
  id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration: number
  actual_duration: number | null
  session_type: string
  breaks_taken: number
  interruptions: number
  rating: number | null
  created_at: string
}

export type Achievement = {
  id: string
  user_id: string
  type: string
  title: string
  description: string | null
  unlocked_at: string | null
  icon: string | null
  created_at: string
}

export type Referral = {
  id: string
  referrer_id: string
  referred_email: string
  status: 'pending' | 'registered' | 'converted'
  reward_given: boolean
  created_at: string
}

// Database type for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      subjects: {
        Row: Subject
        Insert: Omit<Subject, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>
      }
      class_schedules: {
        Row: ClassSchedule
        Insert: Omit<ClassSchedule, 'id' | 'created_at'>
        Update: Partial<Omit<ClassSchedule, 'id' | 'created_at'>>
      }
      study_sessions: {
        Row: StudySession
        Insert: Omit<StudySession, 'id' | 'created_at'>
        Update: Partial<Omit<StudySession, 'id' | 'created_at'>>
      }
      study_plans: {
        Row: StudyPlan
        Insert: Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>>
      }
      assignments: {
        Row: Assignment
        Insert: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at'>>
      }
      exams: {
        Row: Exam
        Insert: Omit<Exam, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Exam, 'id' | 'created_at' | 'updated_at'>>
      }
      focus_sessions: {
        Row: FocusSession
        Insert: Omit<FocusSession, 'id' | 'created_at'>
        Update: Partial<Omit<FocusSession, 'id' | 'created_at'>>
      }
      achievements: {
        Row: Achievement
        Insert: Omit<Achievement, 'id' | 'created_at'>
        Update: Partial<Omit<Achievement, 'id' | 'created_at'>>
      }
      referrals: {
        Row: Referral
        Insert: Omit<Referral, 'id' | 'created_at'>
        Update: Partial<Omit<Referral, 'id' | 'created_at'>>
      }
    }
  }
}
