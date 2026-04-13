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

-- Institute Students table
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

-- Batches/Courses table
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
