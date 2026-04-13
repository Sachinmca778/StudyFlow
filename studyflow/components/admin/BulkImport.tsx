'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute } from '@/lib/institute-types'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'

type BulkImportProps = {
  institute: Institute
}

type ImportType = 'students' | 'fees'

export default function BulkImport({ institute }: BulkImportProps) {
  const [importType, setImportType] = useState<ImportType>('students')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setResults(null)
      } else {
        alert('Please upload a CSV or Excel file')
      }
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }

    return data
  }

  const handleImport = async () => {
    if (!file) {
      alert('Please select a file first')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const text = await file.text()
      const data = parseCSV(text)

      if (data.length === 0) {
        alert('No data found in file')
        setLoading(false)
        return
      }

      if (importType === 'students') {
        await importStudents(data)
      } else {
        await importFees(data)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Error importing file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  const importStudents = async (data: any[]) => {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.student_name || !row.phone) {
          errors.push(`Row skipped: Missing student_name or phone`)
          failed++
          continue
        }

        // Insert student
        const { error } = await supabase
          .from('institute_students')
          .insert({
            institute_id: institute.id,
            student_name: row.student_name,
            email: row.email || null,
            phone: row.phone,
            parent_name: row.parent_name || null,
            parent_phone: row.parent_phone || null,
            parent_email: row.parent_email || null,
            date_of_birth: row.date_of_birth || null,
            gender: row.gender || null,
            address: row.address || null,
            enrollment_number: row.enrollment_number || null,
            class_level: row.class_level || null,
            status: 'active',
          })

        if (error) {
          errors.push(`${row.student_name}: ${error.message}`)
          failed++
        } else {
          success++
        }
      } catch (err: any) {
        errors.push(`${row.student_name}: ${err.message}`)
        failed++
      }
    }

    setResults({ success, failed, errors })
  }

  const importFees = async (data: any[]) => {
    let success = 0
    let failed = 0
    const errors: string[] = []

    // First, get all students to match by enrollment number or name
    const { data: students } = await supabase
      .from('institute_students')
      .select('id, student_name, enrollment_number')
      .eq('institute_id', institute.id)

    for (const row of data) {
      try {
        // Find student by enrollment number or name
        const student = students?.find(s => 
          s.enrollment_number === row.enrollment_number || 
          s.student_name === row.student_name
        )

        if (!student) {
          errors.push(`Student not found: ${row.student_name || row.enrollment_number}`)
          failed++
          continue
        }

        // Validate amount
        const amount = parseFloat(row.amount)
        if (isNaN(amount) || amount <= 0) {
          errors.push(`${row.student_name}: Invalid amount`)
          failed++
          continue
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Insert fee payment
        const { error } = await supabase
          .from('fee_payments')
          .insert({
            institute_id: institute.id,
            student_id: student.id,
            amount: amount,
            payment_date: row.payment_date || new Date().toISOString().split('T')[0],
            payment_method: row.payment_method || 'cash',
            transaction_id: row.transaction_id || null,
            receipt_number: row.receipt_number || null,
            month_year: row.month_year || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            status: row.status || 'paid',
            notes: row.notes || null,
            created_by: user?.id,
          })

        if (error) {
          errors.push(`${row.student_name}: ${error.message}`)
          failed++
        } else {
          success++
        }
      } catch (err: any) {
        errors.push(`${row.student_name}: ${err.message}`)
        failed++
      }
    }

    setResults({ success, failed, errors })
  }

  const downloadTemplate = () => {
    let csvContent = ''
    
    if (importType === 'students') {
      csvContent = 'student_name,email,phone,parent_name,parent_phone,parent_email,date_of_birth,gender,address,enrollment_number,class_level\n'
      csvContent += 'Rahul Sharma,rahul@example.com,9876543210,Mr. Sharma,9876543211,parent@example.com,2005-01-15,male,123 Street Delhi,ENR001,12th\n'
      csvContent += 'Priya Patel,priya@example.com,9876543212,Mrs. Patel,9876543213,parent2@example.com,2006-03-20,female,456 Road Mumbai,ENR002,11th'
    } else {
      csvContent = 'student_name,enrollment_number,amount,payment_date,payment_method,month_year,status,receipt_number,transaction_id,notes\n'
      csvContent += 'Rahul Sharma,ENR001,5000,2026-04-01,cash,April 2026,paid,REC001,,Monthly fee\n'
      csvContent += 'Priya Patel,ENR002,5000,2026-04-01,upi,April 2026,paid,REC002,TXN123,Monthly fee'
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import</h1>
        <p className="text-gray-600">Import students or fee payments from Excel/CSV</p>
      </div>

      {/* Import Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Select Import Type</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setImportType('students')
              setFile(null)
              setResults(null)
            }}
            className={`p-6 rounded-xl border-2 transition-all ${
              importType === 'students'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileSpreadsheet className={`w-8 h-8 mb-3 ${
              importType === 'students' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <h3 className="font-bold text-gray-900 mb-1">Import Students</h3>
            <p className="text-sm text-gray-600">Add multiple students at once</p>
          </button>

          <button
            onClick={() => {
              setImportType('fees')
              setFile(null)
              setResults(null)
            }}
            className={`p-6 rounded-xl border-2 transition-all ${
              importType === 'fees'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileSpreadsheet className={`w-8 h-8 mb-3 ${
              importType === 'fees' ? 'text-green-600' : 'text-gray-400'
            }`} />
            <h3 className="font-bold text-gray-900 mb-1">Import Fee Payments</h3>
            <p className="text-sm text-gray-600">Record multiple payments</p>
          </button>
        </div>
      </div>

      {/* Download Template */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Download Template First</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download the CSV template, fill it with your data, and upload it back.
            </p>
            <button
              onClick={downloadTemplate}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download {importType === 'students' ? 'Students' : 'Fees'} Template
            </button>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upload File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          {file ? (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">{file.name}</p>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Drop your CSV/Excel file here or</p>
              <label className="inline-block">
                <span className="btn-secondary cursor-pointer">
                  Choose File
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </p>
        </div>

        {file && (
          <div className="mt-6">
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import {importType === 'students' ? 'Students' : 'Fee Payments'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Import Results</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{results.success}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <X className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                </div>
              </div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-2">Errors:</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-6 mt-6">
        <h3 className="font-bold text-gray-900 mb-3">📋 Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>1. Download the template CSV file</li>
          <li>2. Open it in Excel or Google Sheets</li>
          <li>3. Fill in your data (don't change column names)</li>
          <li>4. Save as CSV format</li>
          <li>5. Upload the file here</li>
          <li>6. Review the results and fix any errors</li>
        </ul>

        {importType === 'students' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">Required fields for students:</p>
            <p className="text-sm text-blue-700">• student_name, phone</p>
            <p className="text-sm text-blue-700 mt-2">Optional: email, parent details, enrollment_number, class_level, etc.</p>
          </div>
        )}

        {importType === 'fees' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-900 font-medium mb-2">Required fields for fees:</p>
            <p className="text-sm text-green-700">• student_name OR enrollment_number, amount</p>
            <p className="text-sm text-green-700 mt-2">Optional: payment_date, payment_method, month_year, status, receipt_number</p>
          </div>
        )}
      </div>
    </div>
  )
}
