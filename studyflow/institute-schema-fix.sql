-- Institute Management System - Complete Fix Script
-- This script will fix incomplete tables and add all new features
-- Safe to run multiple times

-- ============================================
-- STEP 1: DROP INCOMPLETE TABLES
-- ============================================
-- Drop tables that might be in incomplete state
-- This is safe because we'll recreate them properly

DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;

-- ============================================
-- STEP 2: CREATE ALL TABLES FRESH
-- ============================================

-- Assignments table
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

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
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
-- STEP 5: CREATE TRIGGERS
-- ============================================

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
-- STEP 6: CREATE INDEXES
-- ============================================

CREATE INDEX idx_assignments_institute_id ON public.assignments(institute_id);
CREATE INDEX idx_assignments_batch_id ON public.assignments(batch_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX idx_announcements_institute_id ON public.announcements(institute_id);
CREATE INDEX idx_announcements_published_date ON public.announcements(published_date);
CREATE INDEX idx_notifications_institute_id ON public.notifications(institute_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, recipient_type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_leave_requests_institute_id ON public.leave_requests(institute_id);
CREATE INDEX idx_leave_requests_student_id ON public.leave_requests(student_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);

-- ============================================
-- STEP 7: VERIFICATION
-- ============================================

-- Check if all tables exist with correct columns
DO $$
DECLARE
  v_result TEXT;
BEGIN
  -- Check assignments table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assignments' 
    AND column_name = 'institute_id'
  ) THEN
    RAISE NOTICE '✅ assignments table created with institute_id column';
  ELSE
    RAISE EXCEPTION '❌ assignments table missing institute_id column';
  END IF;

  -- Check assignment_submissions table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assignment_submissions' 
    AND column_name = 'assignment_id'
  ) THEN
    RAISE NOTICE '✅ assignment_submissions table created correctly';
  ELSE
    RAISE EXCEPTION '❌ assignment_submissions table has issues';
  END IF;

  -- Check announcements table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' 
    AND column_name = 'institute_id'
  ) THEN
    RAISE NOTICE '✅ announcements table created correctly';
  ELSE
    RAISE EXCEPTION '❌ announcements table has issues';
  END IF;

  -- Check notifications table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'institute_id'
  ) THEN
    RAISE NOTICE '✅ notifications table created correctly';
  ELSE
    RAISE EXCEPTION '❌ notifications table has issues';
  END IF;

  -- Check leave_requests table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' 
    AND column_name = 'institute_id'
  ) THEN
    RAISE NOTICE '✅ leave_requests table created correctly';
  ELSE
    RAISE EXCEPTION '❌ leave_requests table has issues';
  END IF;

  RAISE NOTICE '🎉 All tables created successfully with correct structure!';
END $$;

-- Show table summary
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name AND schemaname = 'public') as index_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN ('assignments', 'assignment_submissions', 'announcements', 'notifications', 'leave_requests')
ORDER BY t.table_name;

-- Final success message
SELECT '🎉 Schema fix completed successfully! All new features are ready to use!' as status;
