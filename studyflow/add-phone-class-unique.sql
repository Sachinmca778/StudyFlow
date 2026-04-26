-- Migration: Add unique constraint on (institute_id, phone, class_level)
-- This prevents the same phone number from being enrolled in the same class twice.
-- Run this ONCE in Supabase SQL Editor if your database already exists.

-- Step 1: Find and show any existing duplicates before adding the constraint
-- (Review these manually if any appear)
SELECT
  institute_id,
  phone,
  class_level,
  COUNT(*) AS duplicate_count,
  array_agg(student_name) AS student_names
FROM public.institute_students
GROUP BY institute_id, phone, class_level
HAVING COUNT(*) > 1;

-- Step 2: Add the unique constraint
-- If Step 1 returned rows, resolve duplicates first (delete or update them),
-- then run this line.
ALTER TABLE public.institute_students
  ADD CONSTRAINT uq_student_phone_class
  UNIQUE (institute_id, phone, class_level);

-- Verify
SELECT '✅ Unique constraint (institute_id, phone, class_level) added successfully.' AS status;
