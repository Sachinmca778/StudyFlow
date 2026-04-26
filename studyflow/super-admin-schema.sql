-- ============================================================
-- SUPER ADMIN SCHEMA
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ── 1. Super admins table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_admins (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Super Admin',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. Super admin activity log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_admin_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  super_admin_id UUID REFERENCES public.super_admins(id) ON DELETE CASCADE NOT NULL,
  action        TEXT NOT NULL,   -- e.g. 'viewed_institute', 'updated_plan'
  target_type   TEXT,            -- 'institute'
  target_id     UUID,
  details       JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.super_admins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_logs  ENABLE ROW LEVEL SECURITY;

-- Only super admins can read the super_admins table
CREATE POLICY "super_admins_select" ON public.super_admins
  FOR SELECT USING (auth.uid() = user_id);

-- Super admins can read their own logs
CREATE POLICY "super_admin_logs_select" ON public.super_admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND id = super_admin_logs.super_admin_id)
  );

CREATE POLICY "super_admin_logs_insert" ON public.super_admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND id = super_admin_logs.super_admin_id)
  );

-- ── 4. Allow super admins to READ all institutes (bypass normal RLS) ─────────
-- We use a separate permissive policy on institutes
CREATE POLICY "super_admin_read_all_institutes" ON public.institutes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Allow super admin to read all students across all institutes
CREATE POLICY "super_admin_read_all_students" ON public.institute_students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Allow super admin to read all batches
CREATE POLICY "super_admin_read_all_batches" ON public.batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Allow super admin to read all fee payments
CREATE POLICY "super_admin_read_all_fees" ON public.fee_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Allow super admin to read all staff
CREATE POLICY "super_admin_read_all_staff" ON public.institute_staff
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Allow super admin to UPDATE institute subscription plan
CREATE POLICY "super_admin_update_institutes" ON public.institutes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 5. Index ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_admin_id ON public.super_admin_logs(super_admin_id);

-- ── 6. Register your super admin account ─────────────────────────────────────
-- IMPORTANT: Replace the email below with YOUR super admin email.
-- After creating the Supabase auth account for this email, run:
--
--   INSERT INTO public.super_admins (user_id, email, name)
--   VALUES (
--     (SELECT id FROM auth.users WHERE email = 'superadmin@studyflow.com'),
--     'superadmin@studyflow.com',
--     'StudyFlow Super Admin'
--   );
--
-- Or use the helper below (uncomment and fill in):
-- INSERT INTO public.super_admins (user_id, email, name)
-- SELECT id, email, 'StudyFlow Super Admin'
-- FROM auth.users
-- WHERE email = 'YOUR_SUPER_ADMIN_EMAIL_HERE';

SELECT '✅ Super admin schema created successfully!' AS status;
