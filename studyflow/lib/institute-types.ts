// Institute Management System Types

export type Institute = {
  id: string
  admin_user_id: string
  name: string
  email: string
  phone: string
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  logo_url: string | null
  registration_number: string | null
  established_year: number | null
  total_students: number
  total_staff: number
  subscription_plan: 'free' | 'basic' | 'premium'
  subscription_expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type InstituteStudent = {
  id: string
  institute_id: string
  student_name: string
  email: string | null
  phone: string
  parent_name: string | null
  parent_phone: string | null
  parent_email: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  address: string | null
  enrollment_number: string | null
  enrollment_date: string
  class_level: string | null
  batch_id: string | null
  status: 'active' | 'inactive' | 'suspended' | 'graduated'
  profile_photo_url: string | null
  created_at: string
  updated_at: string
}

export type Batch = {
  id: string
  institute_id: string
  name: string
  course_name: string
  description: string | null
  start_date: string
  end_date: string | null
  class_level: string | null
  total_seats: number | null
  enrolled_students: number
  fee_amount: number
  schedule_days: string[] | null
  schedule_time: string | null
  teacher_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FeeStructure = {
  id: string
  institute_id: string
  batch_id: string | null
  fee_type: 'admission' | 'monthly' | 'quarterly' | 'yearly' | 'exam'
  amount: number
  description: string | null
  due_day: number | null
  is_active: boolean
  created_at: string
}

export type FeePayment = {
  id: string
  institute_id: string
  student_id: string
  fee_structure_id: string | null
  amount: number
  payment_date: string
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'
  transaction_id: string | null
  receipt_number: string | null
  month_year: string | null
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  notes: string | null
  created_by: string | null
  created_at: string
}

export type FeeReminder = {
  id: string
  institute_id: string
  student_id: string
  amount_due: number
  due_date: string
  reminder_sent_at: string | null
  reminder_type: 'sms' | 'email' | 'whatsapp' | 'call'
  status: 'pending' | 'sent' | 'paid' | 'overdue'
  message: string | null
  created_at: string
}

export type StudentAttendance = {
  id: string
  institute_id: string
  student_id: string
  batch_id: string | null
  attendance_date: string
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
  check_in_time: string | null
  check_out_time: string | null
  notes: string | null
  marked_by: string | null
  created_at: string
}

export type StudentPerformance = {
  id: string
  institute_id: string
  student_id: string
  batch_id: string | null
  exam_name: string
  exam_date: string | null
  subject: string
  total_marks: number
  marks_obtained: number
  percentage: number | null
  grade: string | null
  rank: number | null
  remarks: string | null
  created_at: string
  updated_at: string
}

export type InstituteStaff = {
  id: string
  institute_id: string
  name: string
  email: string | null
  phone: string
  role: 'teacher' | 'admin' | 'accountant' | 'receptionist'
  subjects: string[] | null
  qualification: string | null
  experience_years: number | null
  joining_date: string
  salary: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Assignment = {
  id: string
  institute_id: string
  batch_id: string
  teacher_id: string | null
  title: string
  description: string | null
  subject: string
  assignment_type: 'homework' | 'project' | 'assignment' | 'practical'
  assigned_date: string
  due_date: string
  total_marks: number | null
  attachment_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AssignmentSubmission = {
  id: string
  assignment_id: string
  student_id: string
  submission_date: string
  submission_text: string | null
  attachment_url: string | null
  marks_obtained: number | null
  feedback: string | null
  status: 'pending' | 'submitted' | 'graded' | 'late' | 'missing'
  graded_by: string | null
  graded_at: string | null
  created_at: string
  updated_at: string
}

export type Announcement = {
  id: string
  institute_id: string
  title: string
  content: string
  announcement_type: 'general' | 'urgent' | 'event' | 'holiday' | 'exam' | 'fee'
  target_audience: 'all' | 'students' | 'parents' | 'staff' | 'specific_batch'
  batch_id: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  attachment_url: string | null
  published_date: string
  expiry_date: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  institute_id: string
  recipient_type: 'student' | 'parent' | 'staff'
  recipient_id: string
  notification_type: 'announcement' | 'fee_reminder' | 'assignment' | 'attendance' | 'exam' | 'general'
  title: string
  message: string
  link_url: string | null
  is_read: boolean
  sent_via: string[]
  created_at: string
}

export type LeaveRequest = {
  id: string
  institute_id: string
  student_id: string
  leave_type: 'sick' | 'casual' | 'emergency' | 'other'
  from_date: string
  to_date: string
  total_days: number
  reason: string
  attachment_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approval_date: string | null
  remarks: string | null
  created_at: string
  updated_at: string
}

// Extended types with relations
export type StudentWithBatch = InstituteStudent & {
  batch?: Batch
}

export type FeePaymentWithStudent = FeePayment & {
  student?: InstituteStudent
}

export type AttendanceWithStudent = StudentAttendance & {
  student?: InstituteStudent
}

export type PerformanceWithStudent = StudentPerformance & {
  student?: InstituteStudent
}

export type AssignmentWithBatch = Assignment & {
  batch?: Batch
  teacher?: InstituteStaff
}

export type AssignmentSubmissionWithDetails = AssignmentSubmission & {
  student?: InstituteStudent
  assignment?: Assignment
}

export type LeaveRequestWithStudent = LeaveRequest & {
  student?: InstituteStudent
}
