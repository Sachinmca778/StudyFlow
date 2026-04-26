-- ============================================================
-- STUDYFLOW - COMPLETE DATABASE SCHEMA
-- Institute Management System - All Tables in One File
-- Run this ONCE in Supabase SQL Editor (Fresh Setup)
-- ============================================================

-- ============================================================
-- STEP 0: CLEANUP (Drop everything if re-running)
-- ============================================================

DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.institute_staff CASCADE;
DROP TABLE IF EXISTS public.student_performance CASCADE;
DROP TABLE IF EXISTS public.student_attendance CASCADE;
DROP TABLE IF EXISTS public.fee_reminders CASCADE;
DROP TABLE IF EXISTS public.fee_payments CASCADE;
DROP TABLE IF EXISTS public.fee_structures CASCADE;
DROP TABLE IF EXISTS public.institute_students CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.institutes CASCADE;

-- ============================================================
-- STEP 1: UTILITY FUNCTION (updated_at trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 2: INSTITUTES TABLE
-- ============================================================

CREATE TABLE public.institutes (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  pincode               TEXT,
  logo_url              TEXT,
  registration_number   TEXT,
  established_year      INTEGER,
  total_students        INTEGER DEFAULT 0,
  total_staff           INTEGER DEFAULT 0,
  subscription_plan     TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 3: BATCHES TABLE
-- ============================================================

CREATE TABLE public.batches (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id      UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  course_name       TEXT NOT NULL,
  description       TEXT,
  start_date        DATE NOT NULL,
  end_date          DATE,
  class_level       TEXT,
  total_seats       INTEGER,
  enrolled_students INTEGER DEFAULT 0,
  fee_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  schedule_days     TEXT[],           -- e.g. ['Monday','Wednesday','Friday']
  schedule_time     TEXT,             -- e.g. '10:00 AM - 12:00 PM'
  teacher_name      TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 4: INSTITUTE STUDENTS TABLE
-- ============================================================

CREATE TABLE public.institute_students (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id        UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_name        TEXT NOT NULL,
  email               TEXT,
  phone               TEXT NOT NULL,
  parent_name         TEXT,
  parent_phone        TEXT,
  parent_email        TEXT,
  date_of_birth       DATE,
  gender              TEXT CHECK (gender IN ('male', 'female', 'other')),
  address             TEXT,
  enrollment_number   TEXT UNIQUE,
  enrollment_date     DATE DEFAULT CURRENT_DATE,
  class_level         TEXT NOT NULL,   -- '10th', '11th Science', '12th Commerce', etc.
  batch_id            UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated')),
  profile_photo_url   TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Same phone number cannot be in the same class within the same institute
  UNIQUE(institute_id, phone, class_level)
);

-- ============================================================
-- STEP 5: INSTITUTE STAFF TABLE
-- ============================================================

CREATE TABLE public.institute_staff (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id      UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT NOT NULL,
  role              TEXT NOT NULL CHECK (role IN ('teacher', 'admin', 'accountant', 'receptionist')),
  subjects          TEXT[],           -- subjects they teach
  qualification     TEXT,
  experience_years  INTEGER,
  joining_date      DATE DEFAULT CURRENT_DATE,
  salary            DECIMAL(10,2),
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 6: FEE STRUCTURES TABLE
-- ============================================================

CREATE TABLE public.fee_structures (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id  UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  batch_id      UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  fee_type      TEXT NOT NULL CHECK (fee_type IN ('admission', 'monthly', 'quarterly', 'yearly', 'exam')),
  amount        DECIMAL(10,2) NOT NULL,
  description   TEXT,
  due_day       INTEGER,              -- day of month for recurring fees
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 7: FEE PAYMENTS TABLE
-- ============================================================

CREATE TABLE public.fee_payments (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id      UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id        UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  fee_structure_id  UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  amount            DECIMAL(10,2) NOT NULL,
  payment_date      DATE DEFAULT CURRENT_DATE,
  payment_method    TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'cheque')),
  transaction_id    TEXT,
  receipt_number    TEXT,
  month_year        TEXT,             -- e.g. 'January 2026'
  status            TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 8: FEE REMINDERS TABLE
-- ============================================================

CREATE TABLE public.fee_reminders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id      UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id        UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  amount_due        DECIMAL(10,2) NOT NULL,
  due_date          DATE NOT NULL,
  reminder_sent_at  TIMESTAMP WITH TIME ZONE,
  reminder_type     TEXT DEFAULT 'sms' CHECK (reminder_type IN ('sms', 'email', 'whatsapp', 'call')),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  message           TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 9: STUDENT ATTENDANCE TABLE
-- ============================================================

CREATE TABLE public.student_attendance (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id      UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id        UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  batch_id          UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  attendance_date   DATE NOT NULL,
  status            TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave')),
  check_in_time     TIME,
  check_out_time    TIME,
  notes             TEXT,
  marked_by         UUID REFERENCES auth.users(id),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, attendance_date)
);

-- ============================================================
-- STEP 10: STUDENT PERFORMANCE TABLE
-- ============================================================

CREATE TABLE public.student_performance (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id    UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  batch_id        UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  exam_name       TEXT NOT NULL,
  exam_date       DATE,
  subject         TEXT NOT NULL,
  total_marks     INTEGER NOT NULL,
  marks_obtained  INTEGER NOT NULL,
  percentage      DECIMAL(5,2),
  grade           TEXT,
  rank            INTEGER,
  remarks         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 11: ASSIGNMENTS TABLE (Institute Assignments)
-- ============================================================

CREATE TABLE public.institute_assignments (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id      UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  batch_id          UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  teacher_id        UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  subject           TEXT NOT NULL,
  assignment_type   TEXT DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'project', 'assignment', 'practical')),
  assigned_date     DATE DEFAULT CURRENT_DATE,
  due_date          DATE NOT NULL,
  total_marks       INTEGER,
  attachment_url    TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 12: ASSIGNMENT SUBMISSIONS TABLE
-- ============================================================

CREATE TABLE public.assignment_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id   UUID REFERENCES public.institute_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_text TEXT,
  attachment_url  TEXT,
  marks_obtained  INTEGER,
  feedback        TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'late', 'missing')),
  graded_by       UUID REFERENCES public.institute_staff(id) ON DELETE SET NULL,
  graded_at       TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- STEP 13: ANNOUNCEMENTS TABLE
-- ============================================================

CREATE TABLE public.announcements (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id        UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  title               TEXT NOT NULL,
  content             TEXT NOT NULL,
  announcement_type   TEXT DEFAULT 'general' CHECK (announcement_type IN ('general', 'urgent', 'event', 'holiday', 'exam', 'fee')),
  target_audience     TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'parents', 'staff', 'specific_batch')),
  batch_id            UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  priority            TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  attachment_url      TEXT,
  published_date      DATE DEFAULT CURRENT_DATE,
  expiry_date         DATE,
  is_active           BOOLEAN DEFAULT true,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 14: NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE public.notifications (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id        UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  recipient_type      TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'staff')),
  recipient_id        UUID NOT NULL,
  notification_type   TEXT NOT NULL CHECK (notification_type IN ('announcement', 'fee_reminder', 'assignment', 'attendance', 'exam', 'general')),
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  link_url            TEXT,
  is_read             BOOLEAN DEFAULT false,
  sent_via            TEXT[] DEFAULT ARRAY['app'],
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 15: LEAVE REQUESTS TABLE
-- ============================================================

CREATE TABLE public.leave_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id  UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id    UUID REFERENCES public.institute_students(id) ON DELETE CASCADE NOT NULL,
  leave_type    TEXT DEFAULT 'sick' CHECK (leave_type IN ('sick', 'casual', 'emergency', 'other')),
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  total_days    INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  attachment_url TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by   UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  remarks       TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 16: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE public.institutes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_reminders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_performance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 17: RLS POLICIES
-- ============================================================

-- Helper: check if current user owns the institute
-- Used in all policies below

-- INSTITUTES
CREATE POLICY "institutes_all" ON public.institutes
  FOR ALL USING (auth.uid() = admin_user_id);

-- BATCHES
CREATE POLICY "batches_all" ON public.batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = batches.institute_id AND admin_user_id = auth.uid())
  );

-- INSTITUTE STUDENTS
CREATE POLICY "institute_students_all" ON public.institute_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = institute_students.institute_id AND admin_user_id = auth.uid())
  );

-- INSTITUTE STAFF
CREATE POLICY "institute_staff_all" ON public.institute_staff
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = institute_staff.institute_id AND admin_user_id = auth.uid())
  );

-- FEE STRUCTURES
CREATE POLICY "fee_structures_all" ON public.fee_structures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = fee_structures.institute_id AND admin_user_id = auth.uid())
  );

-- FEE PAYMENTS
CREATE POLICY "fee_payments_all" ON public.fee_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = fee_payments.institute_id AND admin_user_id = auth.uid())
  );

-- FEE REMINDERS
CREATE POLICY "fee_reminders_all" ON public.fee_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = fee_reminders.institute_id AND admin_user_id = auth.uid())
  );

-- STUDENT ATTENDANCE
CREATE POLICY "student_attendance_all" ON public.student_attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = student_attendance.institute_id AND admin_user_id = auth.uid())
  );

-- STUDENT PERFORMANCE
CREATE POLICY "student_performance_all" ON public.student_performance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = student_performance.institute_id AND admin_user_id = auth.uid())
  );

-- INSTITUTE ASSIGNMENTS
CREATE POLICY "institute_assignments_all" ON public.institute_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = institute_assignments.institute_id AND admin_user_id = auth.uid())
  );

-- ASSIGNMENT SUBMISSIONS
CREATE POLICY "assignment_submissions_all" ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.institute_assignments ia
      JOIN public.institutes i ON i.id = ia.institute_id
      WHERE ia.id = assignment_submissions.assignment_id AND i.admin_user_id = auth.uid()
    )
  );

-- ANNOUNCEMENTS
CREATE POLICY "announcements_all" ON public.announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = announcements.institute_id AND admin_user_id = auth.uid())
  );

-- NOTIFICATIONS
CREATE POLICY "notifications_all" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = notifications.institute_id AND admin_user_id = auth.uid())
  );

-- LEAVE REQUESTS
CREATE POLICY "leave_requests_all" ON public.leave_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutes WHERE id = leave_requests.institute_id AND admin_user_id = auth.uid())
  );

-- ============================================================
-- STEP 18: UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_institutes_updated_at
  BEFORE UPDATE ON public.institutes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_institute_students_updated_at
  BEFORE UPDATE ON public.institute_students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_institute_staff_updated_at
  BEFORE UPDATE ON public.institute_staff
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_student_performance_updated_at
  BEFORE UPDATE ON public.student_performance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_institute_assignments_updated_at
  BEFORE UPDATE ON public.institute_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_assignment_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- STEP 19: INDEXES FOR PERFORMANCE
-- ============================================================

-- Institutes
CREATE INDEX idx_institutes_admin_user_id       ON public.institutes(admin_user_id);

-- Batches
CREATE INDEX idx_batches_institute_id           ON public.batches(institute_id);
CREATE INDEX idx_batches_is_active              ON public.batches(is_active);

-- Students
CREATE INDEX idx_students_institute_id          ON public.institute_students(institute_id);
CREATE INDEX idx_students_batch_id              ON public.institute_students(batch_id);
CREATE INDEX idx_students_class_level           ON public.institute_students(class_level);
CREATE INDEX idx_students_status                ON public.institute_students(status);
CREATE INDEX idx_students_enrollment_number     ON public.institute_students(enrollment_number);

-- Staff
CREATE INDEX idx_staff_institute_id             ON public.institute_staff(institute_id);
CREATE INDEX idx_staff_role                     ON public.institute_staff(role);

-- Fee Structures
CREATE INDEX idx_fee_structures_institute_id    ON public.fee_structures(institute_id);
CREATE INDEX idx_fee_structures_batch_id        ON public.fee_structures(batch_id);

-- Fee Payments
CREATE INDEX idx_fee_payments_institute_id      ON public.fee_payments(institute_id);
CREATE INDEX idx_fee_payments_student_id        ON public.fee_payments(student_id);
CREATE INDEX idx_fee_payments_status            ON public.fee_payments(status);
CREATE INDEX idx_fee_payments_payment_date      ON public.fee_payments(payment_date);
CREATE INDEX idx_fee_payments_month_year        ON public.fee_payments(month_year);

-- Fee Reminders
CREATE INDEX idx_fee_reminders_institute_id     ON public.fee_reminders(institute_id);
CREATE INDEX idx_fee_reminders_student_id       ON public.fee_reminders(student_id);
CREATE INDEX idx_fee_reminders_status           ON public.fee_reminders(status);

-- Attendance
CREATE INDEX idx_attendance_institute_id        ON public.student_attendance(institute_id);
CREATE INDEX idx_attendance_student_id          ON public.student_attendance(student_id);
CREATE INDEX idx_attendance_date                ON public.student_attendance(attendance_date);
CREATE INDEX idx_attendance_batch_id            ON public.student_attendance(batch_id);
CREATE INDEX idx_attendance_status              ON public.student_attendance(status);

-- Performance
CREATE INDEX idx_performance_institute_id       ON public.student_performance(institute_id);
CREATE INDEX idx_performance_student_id         ON public.student_performance(student_id);
CREATE INDEX idx_performance_batch_id           ON public.student_performance(batch_id);
CREATE INDEX idx_performance_exam_date          ON public.student_performance(exam_date);

-- Assignments
CREATE INDEX idx_inst_assignments_institute_id  ON public.institute_assignments(institute_id);
CREATE INDEX idx_inst_assignments_batch_id      ON public.institute_assignments(batch_id);
CREATE INDEX idx_inst_assignments_due_date      ON public.institute_assignments(due_date);
CREATE INDEX idx_inst_assignments_subject       ON public.institute_assignments(subject);

-- Submissions
CREATE INDEX idx_submissions_assignment_id      ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student_id         ON public.assignment_submissions(student_id);
CREATE INDEX idx_submissions_status             ON public.assignment_submissions(status);

-- Announcements
CREATE INDEX idx_announcements_institute_id     ON public.announcements(institute_id);
CREATE INDEX idx_announcements_type             ON public.announcements(announcement_type);
CREATE INDEX idx_announcements_priority         ON public.announcements(priority);
CREATE INDEX idx_announcements_published_date   ON public.announcements(published_date);

-- Notifications
CREATE INDEX idx_notifications_institute_id     ON public.notifications(institute_id);
CREATE INDEX idx_notifications_recipient        ON public.notifications(recipient_id, recipient_type);
CREATE INDEX idx_notifications_is_read          ON public.notifications(is_read);

-- Leave Requests
CREATE INDEX idx_leave_requests_institute_id    ON public.leave_requests(institute_id);
CREATE INDEX idx_leave_requests_student_id      ON public.leave_requests(student_id);
CREATE INDEX idx_leave_requests_status          ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_from_date       ON public.leave_requests(from_date);

-- ============================================================
-- STEP 20: VERIFY EVERYTHING
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'institutes','batches','institute_students','institute_staff',
    'fee_structures','fee_payments','fee_reminders',
    'student_attendance','student_performance',
    'institute_assignments','assignment_submissions',
    'announcements','notifications','leave_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      RAISE NOTICE '✅ Table exists: %', tbl;
    ELSE
      RAISE EXCEPTION '❌ MISSING TABLE: %', tbl;
    END IF;
  END LOOP;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All 14 tables created successfully!';
  RAISE NOTICE '🔐 RLS enabled on all tables';
  RAISE NOTICE '⚡ All indexes created';
  RAISE NOTICE '🔄 All triggers set up';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Schema is ready. You can now use the Institute Management System!';
END $$;
