'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute } from '@/lib/institute-types'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Info } from 'lucide-react'
import { generateEnrollmentNumber } from '@/lib/enrollment'

type BulkImportProps = { institute: Institute }
type ImportType = 'students' | 'fees'

export default function BulkImport({ institute }: BulkImportProps) {
  const [importType, setImportType] = useState<ImportType>('students')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    skipped: number
    errors: string[]
    generated: string[]
    skippedList: string[]
  } | null>(null)

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const valid = ['text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (valid.includes(f.type) || f.name.endsWith('.csv')) {
      setFile(f)
      setResults(null)
    } else {
      alert('Please upload a CSV or Excel file')
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((h, i) => { row[h] = vals[i] || '' })
      return row
    })
  }

  /**
   * Normalize any common date format → YYYY-MM-DD (what Postgres expects)
   * Handles: DD/MM/YY, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY
   * Returns null if blank or unparseable.
   */
  const normalizeDate = (raw: string): string | null => {
    if (!raw?.trim()) return null
    const s = raw.trim()

    // Already ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

    // DD/MM/YY  e.g. 15/01/05  → treat YY < 30 as 20YY, else 19YY
    const dmyShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
    if (dmyShort) {
      const [, d, m, yy] = dmyShort
      const year = parseInt(yy) < 30 ? `20${yy}` : `19${yy}`
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    // DD/MM/YYYY  e.g. 15/01/2005
    const dmyFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dmyFull) {
      const [, d, m, y] = dmyFull
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    // DD-MM-YYYY  e.g. 15-01-2005
    const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (dmyDash) {
      const [, d, m, y] = dmyDash
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    // MM/DD/YYYY  e.g. 01/15/2005 — only if day > 12 makes it unambiguous
    const mdyFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdyFull) {
      const [, m, d, y] = mdyFull
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    return null   // unparseable — skip the field
  }

  // ── Import dispatcher ────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) { alert('Please select a file first'); return }
    setLoading(true)
    setResults(null)
    try {
      const text = await file.text()
      const data = parseCSV(text)
      if (data.length === 0) { alert('No data found in file'); return }
      importType === 'students' ? await importStudents(data) : await importFees(data)
    } catch (err) {
      console.error(err)
      alert('Error importing file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  // ── Students import ──────────────────────────────────────────────────────────
  const importStudents = async (data: any[]) => {
    let success = 0, failed = 0, skipped = 0
    const errors: string[] = []
    const generated: string[] = []
    const skippedList: string[] = []

    // Pre-fetch all existing enrollment numbers for this institute
    // so we can detect duplicates before even hitting the DB
    const { data: existing } = await supabase
      .from('institute_students')
      .select('enrollment_number, phone, class_level')
      .eq('institute_id', institute.id)

    const usedNumbers = new Set(
      (existing ?? []).map(r => r.enrollment_number).filter(Boolean)
    )

    // Set of "phone|class_level" combos already in DB → skip these rows
    const usedPhoneClass = new Set(
      (existing ?? []).map(r => `${r.phone}|${r.class_level}`)
    )

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const label = row.student_name || `Row ${i + 2}`

      // ── Required field validation ──────────────────────────────────────────
      if (!row.student_name?.trim() || !row.phone?.trim()) {
        errors.push(`${label}: Missing student_name or phone`)
        failed++
        continue
      }
      if (!row.class_level?.trim()) {
        errors.push(`${label}: Missing class_level (e.g. 10th, 11th Science)`)
        failed++
        continue
      }

      // ── Duplicate check: phone + class already exists? ─────────────────────
      const phoneClassKey = `${row.phone.trim()}|${row.class_level.trim()}`
      if (usedPhoneClass.has(phoneClassKey)) {
        skippedList.push(`${label} (${row.class_level}, ${row.phone})`)
        skipped++
        continue
      }
      // Mark as used for rest of this batch (handles duplicate rows in same CSV)
      usedPhoneClass.add(phoneClassKey)

      // ── Date normalization ─────────────────────────────────────────────────
      const dob = normalizeDate(row.date_of_birth)

      // ── Enrollment number ──────────────────────────────────────────────────
      let enr = row.enrollment_number?.trim() || ''

      if (!enr) {
        // No number provided → auto-generate a fresh one
        enr = await generateEnrollmentNumber(institute.id, institute.name)
        // Keep generating until we get one not already used in this batch
        while (usedNumbers.has(enr)) {
          enr = await generateEnrollmentNumber(institute.id, institute.name)
        }
        generated.push(`${row.student_name} → ${enr}`)
      } else if (usedNumbers.has(enr)) {
        // Provided number already exists → auto-generate a new one
        const original = enr
        enr = await generateEnrollmentNumber(institute.id, institute.name)
        while (usedNumbers.has(enr)) {
          enr = await generateEnrollmentNumber(institute.id, institute.name)
        }
        generated.push(`${row.student_name}: "${original}" already used → auto-assigned ${enr}`)
      }

      // Mark this number as used for the rest of this batch
      usedNumbers.add(enr)

      // ── Insert ─────────────────────────────────────────────────────────────
      const { error } = await supabase.from('institute_students').insert({
        institute_id:      institute.id,
        student_name:      row.student_name.trim(),
        email:             row.email?.trim()        || null,
        phone:             row.phone.trim(),
        parent_name:       row.parent_name?.trim()  || null,
        parent_phone:      row.parent_phone?.trim() || null,
        parent_email:      row.parent_email?.trim() || null,
        date_of_birth:     dob,
        gender:            row.gender?.trim()       || null,
        address:           row.address?.trim()      || null,
        enrollment_number: enr,
        class_level:       row.class_level.trim(),
        status:            'active',
      })

      if (error) {
        errors.push(`${label}: ${error.message}`)
        failed++
      } else {
        success++
      }
    }

    setResults({ success, failed, skipped, errors, generated, skippedList })
  }

  // ── Fees import ──────────────────────────────────────────────────────────────
  const importFees = async (data: any[]) => {
    let success = 0, failed = 0
    const errors: string[] = []

    const { data: students } = await supabase
      .from('institute_students')
      .select('id, student_name, enrollment_number')
      .eq('institute_id', institute.id)

    for (const row of data) {
      const label = row.student_name || row.enrollment_number || 'Unknown'
      const student = students?.find(s =>
        s.enrollment_number === row.enrollment_number ||
        s.student_name === row.student_name
      )
      if (!student) { errors.push(`Student not found: ${label}`); failed++; continue }

      const amount = parseFloat(row.amount)
      if (isNaN(amount) || amount <= 0) { errors.push(`${label}: Invalid amount`); failed++; continue }

      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('fee_payments').insert({
        institute_id:   institute.id,
        student_id:     student.id,
        amount,
        payment_date:   row.payment_date   || new Date().toISOString().split('T')[0],
        payment_method: row.payment_method || 'cash',
        transaction_id: row.transaction_id || null,
        receipt_number: row.receipt_number || `REC${Date.now()}`,
        month_year:     row.month_year     || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status:         row.status         || 'paid',
        notes:          row.notes          || null,
        created_by:     user?.id,
      })
      if (error) { errors.push(`${label}: ${error.message}`); failed++ }
      else success++
    }

    setResults({ success, failed, skipped: 0, errors, generated: [], skippedList: [] })
  }

  // ── Template download ────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    let csv = ''
    if (importType === 'students') {
      csv = 'student_name,phone,email,class_level,parent_name,parent_phone,parent_email,date_of_birth,gender,address,enrollment_number\n'
      csv += 'Rahul Sharma,9876543210,rahul@example.com,10th,Mr. Sharma,9876543211,parent@example.com,2005-01-15,male,123 Street Delhi,\n'
      csv += 'Priya Patel,9876543212,priya@example.com,11th Science,Mrs. Patel,9876543213,,2006-03-20,female,456 Road Mumbai,\n'
      csv += 'Amit Kumar,9876543214,,12th Commerce,,,,,male,,CUSTOM-001'    } else {
      csv = 'student_name,enrollment_number,amount,payment_date,payment_method,month_year,status,receipt_number,transaction_id,notes\n'
      csv += 'Rahul Sharma,SF-2026-001,5000,2026-04-01,cash,April 2026,paid,,,Monthly fee\n'
      csv += 'Priya Patel,SF-2026-002,5000,2026-04-01,upi,April 2026,paid,,TXN123,Monthly fee'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Bulk Import</h1>
        <p className="text-gray-600">Import students or fee payments from CSV</p>
      </div>

      {/* Import type selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Select Import Type</h2>
        <div className="grid grid-cols-2 gap-4">
          {(['students', 'fees'] as ImportType[]).map(type => (
            <button
              key={type}
              onClick={() => { setImportType(type); setFile(null); setResults(null) }}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                importType === type
                  ? type === 'students' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className={`w-8 h-8 mb-3 ${
                importType === type
                  ? type === 'students' ? 'text-blue-600' : 'text-green-600'
                  : 'text-gray-400'
              }`} />
              <h3 className="font-bold text-gray-900 mb-1">
                {type === 'students' ? 'Import Students' : 'Import Fee Payments'}
              </h3>
              <p className="text-sm text-gray-600">
                {type === 'students' ? 'Add multiple students at once' : 'Record multiple payments'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-enrollment info banner */}
      {importType === 'students' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">🎯 Enrollment Number — Auto-Generated</p>
            <p>
              Leave the <code className="bg-blue-100 px-1 rounded font-mono">enrollment_number</code> column
              {' '}<strong>blank</strong> — the system will assign a unique number like{' '}
              <strong>SF-2026-001</strong> automatically.
            </p>
            <p className="mt-1 text-blue-700">
              You can also type your own custom number in that column and it will be used as-is.
            </p>
          </div>
        </div>
      )}

      {/* Template download */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex items-start gap-4">
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <Download className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Download Template First</h3>
          <p className="text-sm text-gray-600 mb-3">
            Fill in the template and upload it back. Don&apos;t rename the columns.
          </p>
          <button onClick={downloadTemplate} className="btn-primary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download {importType === 'students' ? 'Students' : 'Fees'} Template
          </button>
        </div>
      </div>

      {/* File upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upload File</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {file ? (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">{file.name}</p>
              <button onClick={() => setFile(null)} className="text-sm text-red-600 hover:text-red-700">
                Remove file
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Drop your CSV file here or</p>
              <label className="inline-block cursor-pointer">
                <span className="btn-secondary">Choose File</span>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          )}
          <p className="text-xs text-gray-500">Supported: CSV, Excel (.xlsx, .xls)</p>
        </div>

        {file && (
          <button
            onClick={handleImport}
            disabled={loading}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Importing...</>
              : <><Upload className="w-5 h-5" />Import {importType === 'students' ? 'Students' : 'Fee Payments'}</>
            }
          </button>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Import Results</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-green-700 font-medium">Imported</p>
                <p className="text-2xl font-bold text-green-600">{results.success}</p>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex items-center gap-3">
              <Info className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Skipped (duplicate)</p>
                <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-center gap-3">
              <X className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm text-red-700 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
              </div>
            </div>
          </div>

          {results.skippedList.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Skipped — already enrolled with same phone in same class ({results.skippedList.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {results.skippedList.map((msg, i) => (
                  <p key={i} className="text-sm text-yellow-800">⏭ {msg}</p>
                ))}
              </div>
            </div>
          )}

          {results.generated.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Auto-generated Enrollment Numbers ({results.generated.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {results.generated.map((msg, i) => (
                  <p key={i} className="text-sm text-blue-700 font-mono">✅ {msg}</p>
                ))}
              </div>
            </div>
          )}

          {results.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="font-medium text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Errors ({results.errors.length})
              </p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-700">• {err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-3">📋 Instructions</h3>
        <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
          <li>Download the template CSV file above</li>
          <li>Open in Excel or Google Sheets</li>
          <li>Fill in student data (don&apos;t rename columns)</li>
          <li>Leave <strong>enrollment_number</strong> blank — it will be auto-generated</li>
          <li>Save as CSV and upload here</li>
          <li>Review the results</li>
        </ol>

        {importType === 'students' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
            <p className="font-medium mb-1">Required columns:</p>
            <p><code>student_name</code>, <code>phone</code>, <code>class_level</code></p>
            <p className="mt-2 font-medium">Optional columns:</p>
            <p>email, parent details, date_of_birth, gender, address, enrollment_number</p>
            <p className="mt-2 font-medium text-orange-700">📅 Date format (date_of_birth):</p>
            <p>Preferred: <code>YYYY-MM-DD</code> → <strong>2005-01-15</strong></p>
            <p>Also accepted: <code>DD/MM/YYYY</code> → 15/01/2005 &nbsp;|&nbsp; <code>DD/MM/YY</code> → 15/01/05</p>
          </div>
        )}

        {importType === 'fees' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
            <p className="font-medium mb-1">Required columns:</p>
            <p><code>student_name</code> OR <code>enrollment_number</code>, <code>amount</code></p>
            <p className="mt-2 font-medium">Optional columns:</p>
            <p>payment_date, payment_method, month_year, status, receipt_number, transaction_id, notes</p>
          </div>
        )}
      </div>
    </div>
  )
}
