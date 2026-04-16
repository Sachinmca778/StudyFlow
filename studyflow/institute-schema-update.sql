-- Institute Management System - Schema Update
-- Run this to add new features (Assignments, Communication, etc.)
-- This script is safe to run multiple times

-- ============================================
-- DROP EXISTING TABLES (if you want fresh start)
-- ============================================
-- Uncomment these lines ONLY if you want to recreate tables
-- WARNING: This will delete all data in these tables!

-- DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
-- DROP TABLE IF EXISTS public.assignments CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.announcements CASCADE;
-- DROP TABLE IF EXISTS public.leave_requests CASCADE;

-- ============================================
-- CREATE TABLES (Only if they don't exist)
-- ============================================

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
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
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
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
CREATE TABLE IF NOT EXISTS public.announcements (
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
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'staff')),
  recipient_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('announcement', 'fee_reminder', 'assignment', 'attendance', 'exam', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_via TEXT[] DEFAULT ARRAY['app'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Leave Requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
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

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage own institute assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage own institute submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Admins can manage own institute announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage own institute notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage own institute leave requests" ON public.leave_requests;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

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

-- ============================================
-- CREATE TRIGGERS (Drop existing first)
-- ============================================

DROP TRIGGER IF EXISTS set_updated_at_assignments ON public.assignments;
DROP TRIGGER IF EXISTS set_updated_at_assignment_submissions ON public.assignment_submissions;
DROP TRIGGER IF EXISTS set_updated_at_announcements ON public.announcements;
DROP TRIGGER IF EXISTS set_updated_at_leave_requests ON public.leave_requests;

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

-- ============================================
-- CREATE INDEXES (Drop existing first)
-- ============================================

DROP INDEX IF EXISTS idx_assignments_institute_id;
DROP INDEX IF EXISTS idx_assignments_batch_id;
DROP INDEX IF EXISTS idx_assignment_submissions_assignment_id;
DROP INDEX IF EXISTS idx_assignment_submissions_student_id;
DROP INDEX IF EXISTS idx_announcements_institute_id;
DROP INDEX IF EXISTS idx_notifications_institute_id;
DROP INDEX IF EXISTS idx_notifications_recipient;
DROP INDEX IF EXISTS idx_leave_requests_institute_id;
DROP INDEX IF EXISTS idx_leave_requests_student_id;

CREATE INDEX idx_assignments_institute_id ON public.assignments(institute_id);
CREATE INDEX idx_assignments_batch_id ON public.assignments(batch_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX idx_announcements_institute_id ON public.announcements(institute_id);
CREATE INDEX idx_notifications_institute_id ON public.notifications(institute_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, recipient_type);
CREATE INDEX idx_leave_requests_institute_id ON public.leave_requests(institute_id);
CREATE INDEX idx_leave_requests_student_id ON public.leave_requests(student_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if all tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') 
    THEN '✅ assignments table exists'
    ELSE '❌ assignments table missing'
  END as assignments_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignment_submissions') 
    THEN '✅ assignment_submissions table exists'
    ELSE '❌ assignment_submissions table missing'
  END as submissions_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') 
    THEN '✅ announcements table exists'
    ELSE '❌ announcements table missing'
  END as announcements_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN '✅ notifications table exists'
    ELSE '❌ notifications table missing'
  END as notifications_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') 
    THEN '✅ leave_requests table exists'
    ELSE '❌ leave_requests table missing'
  END as leave_requests_status;

-- Count policies
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('assignments', 'assignment_submissions', 'announcements', 'notifications', 'leave_requests')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Success message
SELECT '🎉 Schema update completed successfully!' as status;
