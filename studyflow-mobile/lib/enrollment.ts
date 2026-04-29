import { supabase } from './supabase/client';

/**
 * Auto-generates a unique enrollment number.
 * Format: <PREFIX>-<YEAR>-<PADDED_SEQUENCE>
 * Example: SF-2026-001
 */
export async function generateEnrollmentNumber(
  instituteId: string,
  instituteName: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = instituteName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'STU';

  const yearPrefix = `${prefix}-${year}-`;

  const { count } = await supabase
    .from('institute_students')
    .select('*', { count: 'exact', head: true })
    .eq('institute_id', instituteId)
    .like('enrollment_number', `${yearPrefix}%`);

  const next = (count ?? 0) + 1;
  const padded = String(next).padStart(3, '0');
  return `${yearPrefix}${padded}`;
}
