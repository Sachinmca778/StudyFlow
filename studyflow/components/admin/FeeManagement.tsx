'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Institute, FeePayment, InstituteStudent } from '@/lib/institute-types'
import { 
  Plus, Search, IndianRupee, Download, Filter, 
  Receipt, TrendingUp, Calendar, Users, Eye, Printer
} from 'lucide-react'

type FeeManagementProps = {
  institute: Institute
}

export default function FeeManagement({ institute }: FeeManagementProps) {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<InstituteStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [formData, setFormData] = useState({
    student_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque',
    transaction_id: '',
    receipt_number: '',
    month_year: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    status: 'paid' as 'paid' | 'pending' | 'overdue',
    notes: '',
  })

  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingAmount: 0,
    thisMonth: 0,
    totalStudents: 0,
    paidStudents: 0,
    pendingStudents: 0,
  })

  useEffect(() => {
    fetchPayments()
    fetchStudents()
  }, [institute.id])

  useEffect(() => {
    calculateStats()
  }, [payments, students])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_payments')
        .select(`
          *,
          student:institute_students(student_name, enrollment_number, class_level, phone)
        `)
        .eq('institute_id', institute.id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('institute_students')
        .select('*')
        .eq('institute_id', institute.id)
        .eq('status', 'active')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const calculateStats = () => {
    const totalCollected = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const pendingAmount = payments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    const thisMonth = payments
      .filter(p => p.month_year === currentMonth && p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Student-wise stats
    const paidStudentIds = new Set(payments.filter(p => p.status === 'paid').map(p => p.student_id))
    const pendingStudentIds = new Set(payments.filter(p => p.status === 'pending' || p.status === 'overdue').map(p => p.student_id))

    setStats({ 
      totalCollected, 
      pendingAmount, 
      thisMonth,
      totalStudents: students.length,
      paidStudents: paidStudentIds.size,
      pendingStudents: pendingStudentIds.size,
    })
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: user } = await supabase.auth.getUser()
      
      // Generate receipt number if not provided
      const receiptNumber = formData.receipt_number || `REC${Date.now()}`
      
      const { error } = await supabase
        .from('fee_payments')
        .insert({
          institute_id: institute.id,
          ...formData,
          receipt_number: receiptNumber,
          created_by: user.user?.id,
        })

      if (error) throw error

      alert('Payment recorded successfully!')
      setShowAddModal(false)
      fetchPayments()
      resetForm()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Error recording payment')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      transaction_id: '',
      receipt_number: '',
      month_year: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      status: 'paid',
      notes: '',
    })
  }

  const viewReceipt = (payment: any) => {
    setSelectedPayment(payment)
    setShowReceiptModal(true)
  }

  const printReceipt = () => {
    window.print()
  }

  const exportToCSV = () => {
    const csvData = filteredPayments.map(p => ({
      'Receipt Number': p.receipt_number || '-',
      'Student Name': p.student?.student_name || '-',
      'Class': p.student?.class_level || '-',
      'Amount': p.amount,
      'Month/Year': p.month_year,
      'Payment Date': new Date(p.payment_date).toLocaleDateString(),
      'Payment Method': p.payment_method,
      'Status': p.status,
      'Transaction ID': p.transaction_id || '-',
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fee-payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Get unique classes and months
  const uniqueClasses = Array.from(
    new Set(
      students
        .map(s => s.class_level)
        .filter((cls): cls is string => Boolean(cls))
    )
  )

  const uniqueMonths = Array.from(
    new Set(payments.map(p => p.month_year).filter(Boolean))
  )

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    const matchesClass = filterClass === 'all' || payment.student?.class_level === filterClass
    const matchesMonth = filterMonth === 'all' || payment.month_year === filterMonth
    const matchesSearch = 
      payment.student?.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.student?.enrollment_number?.includes(searchQuery)
    
    return matchesStatus && matchesClass && matchesMonth && matchesSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Management</h1>
          <p className="text-gray-600">Track and manage fee payments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100 text-sm">Total Collected</p>
            <IndianRupee className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold mb-1">₹{stats.totalCollected.toLocaleString()}</p>
          <p className="text-green-100 text-xs">{stats.paidStudents} students paid</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100 text-sm">Pending Amount</p>
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold mb-1">₹{stats.pendingAmount.toLocaleString()}</p>
          <p className="text-orange-100 text-xs">{stats.pendingStudents} students pending</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-sm">This Month</p>
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold mb-1">₹{stats.thisMonth.toLocaleString()}</p>
          <p className="text-blue-100 text-xs">{new Date().toLocaleString('default', { month: 'long' })}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-sm">Collection Rate</p>
            <Users className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {stats.totalStudents > 0 ? Math.round((stats.paidStudents / stats.totalStudents) * 100) : 0}%
          </p>
          <p className="text-purple-100 text-xs">{stats.paidStudents}/{stats.totalStudents} students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search payments..."
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.sort().map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input"
          >
            <option value="all">All Months</option>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-blue-600">
                        {payment.receipt_number || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.student?.student_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{payment.student?.enrollment_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                        {payment.student?.class_level || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{Number(payment.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{payment.month_year}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewReceipt(payment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center print:hidden">
              <h3 className="text-xl font-bold text-gray-900">Fee Receipt</h3>
              <div className="flex gap-2">
                <button
                  onClick={printReceipt}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-8" id="receipt-content">
              {/* Institute Header */}
              <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">{institute.name}</h1>
                {institute.address && <p className="text-sm text-gray-600">{institute.address}</p>}
                {institute.phone && <p className="text-sm text-gray-600">Phone: {institute.phone}</p>}
                {institute.email && <p className="text-sm text-gray-600">Email: {institute.email}</p>}
                <p className="text-lg font-semibold text-blue-600 mt-2">FEE RECEIPT</p>
              </div>

              {/* Receipt Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Receipt No:</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.receipt_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedPayment.payment_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student Name:</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.student?.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enrollment No:</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.student?.enrollment_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class:</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.student?.class_level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Month/Year:</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.month_year}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-b border-gray-300 py-4 mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm text-gray-600">Description</th>
                      <th className="text-right py-2 text-sm text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-gray-900">Tuition Fee - {selectedPayment.month_year}</td>
                      <td className="text-right py-2 font-semibold text-gray-900">
                        ₹{Number(selectedPayment.amount).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td className="py-2 font-bold text-gray-900">Total Amount</td>
                      <td className="text-right py-2 font-bold text-lg text-gray-900">
                        ₹{Number(selectedPayment.amount).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">Payment Method:</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {selectedPayment.payment_method.replace('_', ' ')}
                </p>
                {selectedPayment.transaction_id && (
                  <>
                    <p className="text-sm text-gray-600 mt-2">Transaction ID:</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.transaction_id}</p>
                  </>
                )}
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="text-gray-900">{selectedPayment.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600 text-center">
                  This is a computer-generated receipt and does not require a signature.
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Generated on {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Fee Payment</h2>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student *
                  </label>
                  <select
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_name} - {student.enrollment_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                    className="input"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month/Year
                  </label>
                  <input
                    type="text"
                    value={formData.month_year}
                    onChange={(e) => setFormData({ ...formData, month_year: e.target.value })}
                    className="input"
                    placeholder="January 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="input"
                    placeholder="REC001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
