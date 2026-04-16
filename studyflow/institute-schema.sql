-- Institute Management System Database Schema
-- Run this AFTER running the main supabase-schema.sql

-- Institutes table
CREATE TABLE public.institutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  logo_url TEXT,
  registration_number TEXT,
  established_year INTEGER,
  total_students INTEGER DEFAULT 0,
  total_staff INTEGER DEFAULT 0,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches/Courses table (Create this BEFORE institute_students)
CREATE TABLE public.batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  class_level TEXT,
  total_seats INTEGER,
  enrolled_students INTEGER DEFAULT 0,
  fee_amount DECIMAL(10, 2) NOT NULL,
  schedule_days TEXT[], -- ['Monday', 'Wednesday', 'Friday']
  schedule_time TEXT, -- '10:00 AM - 12:00 PM'
  teacher_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Institute Students table (Create this AFTER batches)
CREATE TABLE public.institute_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  enrollment_number TEXT UNIQUE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  class_level TEXT,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated')),
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Structures table
CREATE TABLE public.fee_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL, -- 'admission', 'monthly', 'quarterly', 'yearly', 'exam'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  due_day INTEGER, -- day of month for recurring fees
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Payments table
CREATE TABLE public.fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'cheque')),
  transaction_id TEXT,
  receipt_number TEXT,
  month_year TEXT, -- 'January 2026'
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Reminders table
CREATE TABLE public.fee_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  amount_due DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_type TEXT DEFAULT 'sms' CHECK (reminder_type IN ('sms', 'email', 'whatsapp', 'call')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Attendance table
CREATE TABLE public.student_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, attendance_date)
);

-- Student Performance table
CREATE TABLE public.student_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  exam_name TEXT NOT NULL,
  exam_date DATE,
  subject TEXT NOT NULL,
  total_marks INTEGER NOT NULL,
  marks_obtained INTEGER NOT NULL,
  percentage DECIMAL(5, 2),
  grade TEXT,
  rank INTEGER,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Institute Staff table
CREATE TABLE public.institute_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  role TEXT NOT NULL, -- 'teacher', 'admin', 'accountant', 'receptionist'
  subjects TEXT[], -- subjects they teach
  qualification TEXT,
  experience_years INTEGER,
  joining_date DATE DEFAULT CURRENT_DATE,
  salary DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Institute admins can only access their institute data

-- Institutes policies
CREATE POLICY "Admins can view own institute" ON public.institutes
  FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can update own institute" ON public.institutes
  FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can insert own institute" ON public.institutes
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

-- Institute Students policies
CREATE POLICY "Admins can view own institute students" ON public.institute_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_students.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert own institute students" ON public.institute_students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_students.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update own institute students" ON public.institute_students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_students.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete own institute students" ON public.institute_students
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_students.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Batches policies
CREATE POLICY "Admins can manage own institute batches" ON public.batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = batches.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Fee structures policies
CREATE POLICY "Admins can manage own institute fee structures" ON public.fee_structures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = fee_structures.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Fee payments policies
CREATE POLICY "Admins can manage own institute fee payments" ON public.fee_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = fee_payments.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Fee reminders policies
CREATE POLICY "Admins can manage own institute fee reminders" ON public.fee_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = fee_reminders.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Attendance policies
CREATE POLICY "Admins can manage own institute attendance" ON public.student_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = student_attendance.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Performance policies
CREATE POLICY "Admins can manage own institute performance" ON public.student_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = student_performance.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Staff policies
CREATE POLICY "Admins can manage own institute staff" ON public.institute_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_staff.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER set_updated_at_institutes
  BEFORE UPDATE ON public.institutes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_institute_students
  BEFORE UPDATE ON public.institute_students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_batches
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_student_performance
  BEFORE UPDATE ON public.student_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_institute_staff
  BEFORE UPDATE ON public.institute_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Timetable/Schedule table
CREATE TABLE public.timetable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  room_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homework/Assignments table
CREATE TABLE public.homework (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_marks INTEGER,
  attachment_url TEXT,
  assigned_by UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homework Submissions table
CREATE TABLE public.homework_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_text TEXT,
  attachment_url TEXT,
  marks_obtained INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'missing')),
  graded_by UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Library Books table
CREATE TABLE public.library_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  book_title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  publisher TEXT,
  publication_year INTEGER,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  shelf_location TEXT,
  price DECIMAL(10, 2),
  language TEXT DEFAULT 'English',
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Library Issue/Return table
CREATE TABLE public.library_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.institute_staff(id) ON DELETE CASCADE,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  fine_amount DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
  issued_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Management table
CREATE TABLE public.institute_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  expense_type TEXT NOT NULL, -- 'salary', 'rent', 'utilities', 'maintenance', 'supplies', 'other'
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'cheque')),
  vendor_name TEXT,
  invoice_number TEXT,
  description TEXT,
  receipt_url TEXT,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications/SMS Log table
CREATE TABLE public.institute_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'staff', 'all')),
  recipient_id UUID, -- student_id or staff_id
  notification_type TEXT NOT NULL, -- 'fee_reminder', 'attendance', 'exam', 'announcement', 'homework'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'push', 'in_app')),
  phone_number TEXT,
  email_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'read')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  certificate_type TEXT NOT NULL, -- 'completion', 'achievement', 'participation', 'merit'
  certificate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_date DATE DEFAULT CURRENT_DATE,
  course_name TEXT,
  grade TEXT,
  percentage DECIMAL(5, 2),
  template_url TEXT,
  certificate_url TEXT, -- generated PDF URL
  issued_by UUID REFERENCES auth.users(id),
  signature_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events/Holidays table
CREATE TABLE public.institute_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('holiday', 'exam', 'sports', 'cultural', 'meeting', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_holiday BOOLEAN DEFAULT false,
  notify_students BOOLEAN DEFAULT true,
  notify_parents BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for new tables
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Admins can manage timetable" ON public.timetable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = timetable.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage homework" ON public.homework
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = homework.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage homework submissions" ON public.homework_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.homework h
      JOIN public.institutes i ON i.id = h.institute_id
      WHERE h.id = homework_submissions.homework_id 
      AND i.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage library books" ON public.library_books
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = library_books.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage library transactions" ON public.library_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = library_transactions.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage expenses" ON public.institute_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_expenses.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage notifications" ON public.institute_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_notifications.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = certificates.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage events" ON public.institute_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = institute_events.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Create updated_at triggers for new tables
CREATE TRIGGER set_updated_at_timetable
  BEFORE UPDATE ON public.timetable
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_homework
  BEFORE UPDATE ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_library_books
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_institute_expenses
  BEFORE UPDATE ON public.institute_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_institute_events
  BEFORE UPDATE ON public.institute_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Homework/Assignments table
CREATE TABLE public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  assignment_type TEXT DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'project', 'assignment', 'practical')),
  assigned_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_marks INTEGER,
  attachment_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment Submissions table
CREATE TABLE public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_text TEXT,
  attachment_url TEXT,
  marks_obtained INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'late', 'missing')),
  graded_by UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Announcements/Notices table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT DEFAULT 'general' CHECK (announcement_type IN ('general', 'urgent', 'event', 'holiday', 'exam', 'fee')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'parents', 'staff', 'specific_batch')),
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  attachment_url TEXT,
  published_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'staff')),
  recipient_id UUID NOT NULL, -- Can be student_id or staff_id
  notification_type TEXT NOT NULL CHECK (notification_type IN ('announcement', 'fee_reminder', 'assignment', 'attendance', 'exam', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_via TEXT[] DEFAULT ARRAY['app'], -- ['app', 'email', 'sms']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Leave Requests table
CREATE TABLE public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT DEFAULT 'sick' CHECK (leave_type IN ('sick', 'casual', 'emergency', 'other')),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Assignments policies
CREATE POLICY "Admins can manage own institute assignments" ON public.assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = assignments.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Assignment Submissions policies
CREATE POLICY "Admins can manage own institute submissions" ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      JOIN public.institutes ON institutes.id = assignments.institute_id
      WHERE assignments.id = assignment_submissions.assignment_id
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Announcements policies
CREATE POLICY "Admins can manage own institute announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = announcements.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Admins can manage own institute notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = notifications.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Leave Requests policies
CREATE POLICY "Admins can manage own institute leave requests" ON public.leave_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institutes 
      WHERE institutes.id = leave_requests.institute_id 
      AND institutes.admin_user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER set_updated_at_assignments
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_assignment_submissions
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_announcements
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_leave_requests
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_institute_students_institute_id ON public.institute_students(institute_id);
CREATE INDEX idx_institute_students_batch_id ON public.institute_students(batch_id);
CREATE INDEX idx_batches_institute_id ON public.batches(institute_id);
CREATE INDEX idx_fee_payments_institute_id ON public.fee_payments(institute_id);
CREATE INDEX idx_fee_payments_student_id ON public.fee_payments(student_id);
CREATE INDEX idx_fee_reminders_institute_id ON public.fee_reminders(institute_id);
CREATE INDEX idx_fee_reminders_student_id ON public.fee_reminders(student_id);
CREATE INDEX idx_student_attendance_institute_id ON public.student_attendance(institute_id);
CREATE INDEX idx_student_attendance_student_id ON public.student_attendance(student_id);
CREATE INDEX idx_student_attendance_date ON public.student_attendance(attendance_date);
CREATE INDEX idx_student_performance_institute_id ON public.student_performance(institute_id);
CREATE INDEX idx_student_performance_student_id ON public.student_performance(student_id);
CREATE INDEX idx_institute_staff_institute_id ON public.institute_staff(institute_id);
CREATE INDEX idx_assignments_institute_id ON public.assignments(institute_id);
CREATE INDEX idx_assignments_batch_id ON public.assignments(batch_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX idx_announcements_institute_id ON public.announcements(institute_id);
CREATE INDEX idx_notifications_institute_id ON public.notifications(institute_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, recipient_type);
CREATE INDEX idx_leave_requests_institute_id ON public.leave_requests(institute_id);
CREATE INDEX idx_leave_requests_student_id ON public.leave_requests(student_id);
CREATE INDEX idx_timetable_institute_id ON public.timetable(institute_id);
CREATE INDEX idx_timetable_batch_id ON public.timetable(batch_id);
CREATE INDEX idx_homework_institute_id ON public.homework(institute_id);
CREATE INDEX idx_homework_batch_id ON public.homework(batch_id);
CREATE INDEX idx_homework_submissions_homework_id ON public.homework_submissions(homework_id);
CREATE INDEX idx_homework_submissions_student_id ON public.homework_submissions(student_id);
CREATE INDEX idx_library_books_institute_id ON public.library_books(institute_id);
CREATE INDEX idx_library_transactions_institute_id ON public.library_transactions(institute_id);
CREATE INDEX idx_library_transactions_book_id ON public.library_transactions(book_id);
CREATE INDEX idx_library_transactions_student_id ON public.library_transactions(student_id);
CREATE INDEX idx_institute_expenses_institute_id ON public.institute_expenses(institute_id);
CREATE INDEX idx_institute_expenses_date ON public.institute_expenses(expense_date);
CREATE INDEX idx_institute_notifications_institute_id ON public.institute_notifications(institute_id);
CREATE INDEX idx_certificates_institute_id ON public.certificates(institute_id);
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_institute_events_institute_id ON public.institute_events(institute_id);
CREATE INDEX idx_institute_events_date ON public.institute_events(event_date);
