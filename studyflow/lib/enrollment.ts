import { supabase } from '@/lib/supabase/client'

/**
 * Auto-generates a unique enrollment number for a student.
 *
 * Format:  <INSTITUTE_PREFIX>-<YEAR>-<PADDED_SEQUENCE>
 * Example: SF-2026-001, SF-2026-042, ABCD-2026-100
 *
 * Institute prefix = first 4 letters of institute name (uppercase, letters only)
 * Year             = current year
 * Sequence         = next available number padded to 3 digits (grows beyond 3 if needed)
 */
export async function generateEnrollmentNumber(
  instituteId: string,
  instituteName: string
): Promise<string> {
  const year = new Date().getFullYear()

  // Build a short prefix from the institute name (letters only, max 4 chars)
  const prefix = instituteName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'STU'

  const yearPrefix = `${prefix}-${year}-`

  // Count how many students already have an enrollment number starting with this prefix+year
  const { count } = await supabase
    .from('institute_students')
    .select('*', { count: 'exact', head: true })
    .eq('institute_id', instituteId)
    .like('enrollment_number', `${yearPrefix}%`)

  const next = (count ?? 0) + 1
  // Pad to at least 3 digits; grows naturally beyond 999
  const padded = String(next).padStart(3, '0')

  return `${yearPrefix}${padded}`
}
